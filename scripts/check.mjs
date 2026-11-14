#!/usr/bin/env node
/**
 * Every block, served from the production build and scrolled in Chromium. A
 * block passes when its page logs no error or warning (hydration included)
 * and every svg-scroll-draw engine in it ran to the end. The home page and each
 * block's docs page must load clean too.
 *
 *   npm run build && npm run check
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const slugs = JSON.parse(readFileSync(new URL('../registry.json', import.meta.url))).items.map((i) => i.name);
const port = await new Promise((ok) => { const s = createServer().listen(0, () => { const { port } = s.address(); s.close(() => ok(port)); }); });
const server = spawn('npx', ['next', 'start', '-p', String(port)], { stdio: 'ignore', detached: true });
const base = `http://localhost:${port}`;
for (let i = 0; i < 60 && !(await fetch(base).then(() => true, () => false)); i++) await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch();
const failures = [];

async function open(path) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { page, errors };
}

for (const slug of slugs) {
  const { page, errors } = await open(`/preview/${slug}`);
  // A reader takes in the first screen before scrolling: the hero's underline
  // plays on arrival and pauses while it is off screen.
  await page.waitForTimeout(2000);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 150) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1500);
  const engines = await page.evaluate(() => {
    const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
    return m ? [...m.values()].map((e) => ({ type: e.type, p: e.getProgress() })) : [];
  });
  await page.close();
  const problems = [...errors];
  if (!engines.length) problems.push('no svg-scroll-draw engine registered');
  const short = engines.filter((e) => e.p < 0.99);
  if (short.length) problems.push(`${short.length} of ${engines.length} engines never finished (${short.map((e) => `${e.type} ${e.p.toFixed(2)}`).join(', ')})`);
  console.log(`${problems.length ? '✗' : '✓'} ${slug}  ${engines.length} engines`);
  problems.forEach((p) => console.log(`    ${p}`));
  if (problems.length) failures.push(slug);
}

for (const path of ['/', ...slugs.map((s) => `/blocks/${s}`)]) {
  const { page, errors } = await open(path);
  await page.close();
  console.log(`${errors.length ? '✗' : '✓'} ${path}`);
  errors.forEach((e) => console.log(`    ${e}`));
  if (errors.length) failures.push(path);
}

await browser.close();
try { process.kill(-server.pid); } catch {}
if (failures.length) { console.error(`\n✗ ${failures.length} failed`); process.exit(1); }
console.log(`\n✓ ${slugs.length} blocks run to the end, and every page loads clean`);
