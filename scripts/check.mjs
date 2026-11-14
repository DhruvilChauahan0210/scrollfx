#!/usr/bin/env node
/**
 * Every effect, opened in Chromium and scrolled to the end: it passes when
 * nothing logs an error and at least one svg-scroll-draw engine ran to the end
 * (read from the library's instance registry). Run after `npm run build`.
 *
 *   node scripts/check.mjs
 */
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
if (!existsSync(join(site, 'index.html'))) {
  console.error('✗ no site/ — run `npm run build` first');
  process.exit(1);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((req, res) => {
  const path = join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = path.endsWith('/') ? join(path, 'index.html') : path;
  if (!existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const files = readdirSync(join(site, 'e')).filter((f) => f.endsWith('.html')).sort();
const browser = await chromium.launch();
const failures = [];

for (const file of files) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
  await page.goto(`${base}/e/${file}`, { waitUntil: 'networkidle' });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  let max = 0;
  const read = () => page.evaluate(() => {
    const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
    return m ? [...m.values()].map((e) => ({ type: e.type, p: e.getProgress() })) : [];
  });
  // A snapping page moves one section per gesture, so it is read a screen at a
  // time with a pause for each glide, as a reader would scroll it.
  const snaps = readFileSync(join(site, 'e', file), 'utf8').includes('scrollSnap');
  const step = snaps ? await page.evaluate(() => window.innerHeight) : 200;
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(snaps ? 1200 : 40);
    for (const e of await read()) max = Math.max(max, e.p);
  }
  await page.waitForTimeout(800);
  const engines = await read();
  for (const e of engines) max = Math.max(max, e.p);
  await page.close();

  const problems = [...errors];
  if (!engines.length) problems.push('no svg-scroll-draw engine registered');
  else if (max < 0.9) problems.push(`never ran to the end (${engines.map((e) => `${e.type} ${e.p.toFixed(2)}`).join(', ')})`);
  console.log(`${problems.length ? '✗' : '✓'} ${file}${engines.length ? `  [${[...new Set(engines.map((e) => e.type))].join(', ')}]` : ''}`);
  for (const p of problems) console.log(`    ${p}`);
  if (problems.length) failures.push(file);
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\n✗ ${failures.length} of ${files.length} effects failed`);
  process.exit(1);
}
console.log(`\n✓ all ${files.length} effects run`);
