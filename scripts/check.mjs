#!/usr/bin/env node
/**
 * Every block, served from the production build and scrolled in Chromium. A
 * block passes when its page logs no error or warning (hydration included)
 * and every svg-scroll-draw engine in it ran to the end. The home page and each
 * block's docs page must load clean too, and every scroll-drawn picture on the
 * home page must finish as it reaches the middle of the screen, not before.
 *
 * Every component (each registry:ui item) is held to the same rules on its
 * docs page, /components/<slug>, where its examples run live: no error or
 * warning, every engine finishes, and every drawing finishes as it reaches the
 * middle of the screen, at desktop and phone sizes. A drawing there may be
 * several pens layered in one box (a chart's axes, hatching and lines, each
 * its own engine): they are measured together, as the reader sees them.
 *
 *   npm run build && npm run check
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const items = JSON.parse(readFileSync(new URL('../registry.json', import.meta.url))).items;
const slugs = items.filter((i) => i.type === 'registry:block').map((i) => i.name);
const components = items.filter((i) => i.type === 'registry:ui').map((i) => i.name);
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
  // A reader takes in the first screen before scrolling: a hero's plot plays
  // on arrival and pauses while it is off screen, so let what is on screen
  // finish first (the flow field takes about five seconds).
  for (let t = 0; t < 8000; t += 250) {
    const done = await page.evaluate(() => {
      const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
      return !!m && [...m.entries()].every(([el, e]) => e.getProgress() >= 0.99 || el.getBoundingClientRect().top > innerHeight);
    });
    if (done) break;
    await page.waitForTimeout(250);
  }
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 150) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1500);
  const engines = await page.evaluate(() => {
    const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
    // An element hidden at this width (a phone-only rail on a desktop) has
    // nothing to scroll through, so its engine is not expected to move.
    return m ? [...m.entries()].filter(([el]) => el.getClientRects().length > 0).map(([, e]) => ({ type: e.type, p: e.getProgress() })) : [];
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

// Every scroll-drawn picture on the home page must finish as it reaches the
// middle of the screen: still drawing when its centre is at 65% of the screen
// (finished earlier, it played before the reader got there), and done by the
// time its centre is at 45% (later, it is still drawing up by the header). The
// hero plots on arrival, not on scroll, and is left out. Desktop and phone.
for (const [width, height] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  const count = await page.evaluate(() => document.querySelectorAll('section svg').length);
  const wrong = [];
  let checked = 0;
  for (let i = 0; i < count; i++) {
    const r = await page.evaluate(async (i) => {
      const svg = document.querySelectorAll('section svg')[i];
      if (svg.closest('section').querySelector('h1') || svg.getClientRects().length === 0) return null;
      const paths = [...svg.querySelectorAll('path, circle')].filter((p) => getComputedStyle(p).strokeDasharray !== 'none');
      if (!paths.length) return null;
      const undrawn = () => Math.max(...paths.map((p) => { const cs = getComputedStyle(p); return Math.abs(parseFloat(cs.strokeDashoffset)) / parseFloat(cs.strokeDasharray); }));
      const box = svg.getBoundingClientRect();
      const centre = box.top + scrollY + box.height / 2;
      // Scroll down as a reader would until the centre sits at `at` of the screen.
      const settle = async (at) => {
        const target = centre - innerHeight * at;
        for (let y = Math.max(0, target - innerHeight); y < target; y += 60) {
          scrollTo(0, y);
          await new Promise((ok) => requestAnimationFrame(() => setTimeout(ok, 16)));
        }
        scrollTo(0, target);
        await new Promise((ok) => setTimeout(ok, 250));
        return undrawn();
      };
      const early = await settle(0.65);
      const late = await settle(0.45);
      return { name: svg.closest('section').querySelector('h2')?.textContent ?? `svg ${i}`, early, late };
    }, i);
    if (!r) continue;
    checked++;
    if (r.early < 0.02) wrong.push(`${r.name}: already finished with its centre at 65% of the screen`);
    if (r.late > 0.02) wrong.push(`${r.name}: ${(r.late * 100).toFixed(0)}% undrawn with its centre at 45%`);
  }
  await page.close();
  console.log(`${wrong.length ? '✗' : '✓'} / at ${width}px: ${checked} drawings finish as they reach mid-screen`);
  wrong.forEach((l) => console.log(`    ${l}`));
  if (wrong.length) failures.push(`/ at ${width}px`);
}

// Scroll a page to the end as a reader would, then every engine in a visible
// element must have finished. The footer plots on arrival, over a few seconds,
// so give what is still running up to eight.
async function engines(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 150) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
  }
  const read = () => page.evaluate(() => {
    const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
    return m ? [...m.entries()].filter(([el]) => el.getClientRects().length > 0).map(([, e]) => ({ type: e.type, p: e.getProgress() })) : [];
  });
  await page.waitForTimeout(1500);
  for (let t = 0; t < 8000 && (await read()).some((e) => e.p < 0.99); t += 250) await page.waitForTimeout(250);
  return read();
}

// The drawings on a component page: scroll-drawn svgs in <main>, grouped by
// the box they fill, so a chart's pens count as one drawing. Each must still
// be drawing with its centre at 65% of the screen and done by 45%. One that
// already sits above 65% when the page opens cannot be scrolled to it, and
// is counted apart.
async function midScreen(page) {
  const count = await page.evaluate(() => {
    const groups = new Set();
    for (const svg of document.querySelectorAll('main svg')) {
      if (!svg.getClientRects().length || ![...svg.querySelectorAll('path, circle')].some((p) => getComputedStyle(p).strokeDasharray !== 'none')) continue;
      const r = svg.getBoundingClientRect();
      groups.add([r.left, r.top + scrollY, r.width, r.height].map(Math.round).join());
    }
    return groups.size;
  });
  const wrong = [];
  let checked = 0, onArrival = 0;
  for (let i = 0; i < count; i++) {
    const r = await page.evaluate(async (i) => {
      scrollTo(0, 0);
      await new Promise((ok) => setTimeout(ok, 50));
      const groups = new Map();
      for (const svg of document.querySelectorAll('main svg')) {
        if (!svg.getClientRects().length) continue;
        const paths = [...svg.querySelectorAll('path, circle')].filter((p) => getComputedStyle(p).strokeDasharray !== 'none');
        if (!paths.length) continue;
        const r = svg.getBoundingClientRect();
        const key = [r.left, r.top + scrollY, r.width, r.height].map(Math.round).join();
        groups.set(key, [...(groups.get(key) ?? []), ...paths]);
      }
      const [key, paths] = [...groups.entries()][i];
      const [, top, , height] = key.split(',').map(Number);
      const centre = top + height / 2;
      if (centre < innerHeight * 0.65) return { arrival: true };
      const undrawn = () => Math.max(...paths.map((p) => { const cs = getComputedStyle(p); return Math.abs(parseFloat(cs.strokeDashoffset)) / parseFloat(cs.strokeDasharray); }));
      const settle = async (at) => {
        const target = centre - innerHeight * at;
        for (let y = Math.max(0, target - innerHeight); y < target; y += 60) {
          scrollTo(0, y);
          await new Promise((ok) => requestAnimationFrame(() => setTimeout(ok, 16)));
        }
        scrollTo(0, target);
        await new Promise((ok) => setTimeout(ok, 250));
        return undrawn();
      };
      const early = await settle(0.65);
      const late = await settle(0.45);
      const ex = paths[0].closest('[data-example]')?.getAttribute('data-example');
      return { name: `${ex ?? 'drawing'} @${Math.round(top)}px`, early, late };
    }, i);
    if (r.arrival) { onArrival++; continue; }
    checked++;
    if (r.early < 0.02) wrong.push(`${r.name}: already finished with its centre at 65% of the screen`);
    if (r.late > 0.02) wrong.push(`${r.name}: ${(r.late * 100).toFixed(0)}% undrawn with its centre at 45%`);
  }
  return { checked, onArrival, wrong };
}

for (const slug of components) {
  const problems = [];
  let summary = '';
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
    await page.goto(`${base}/components/${slug}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const { checked, onArrival, wrong } = await midScreen(page);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    const all = await engines(page);
    await page.close();
    problems.push(...errors.map((e) => `${width}px: ${e}`), ...wrong.map((w) => `${width}px: ${w}`));
    if (!checked) problems.push(`${width}px: no drawing measured`);
    const short = all.filter((e) => e.p < 0.99);
    if (short.length) problems.push(`${width}px: ${short.length} of ${all.length} engines never finished (${short.map((e) => `${e.type} ${e.p.toFixed(2)}`).join(', ')})`);
    summary += ` ${width}px: ${checked} drawings at mid-screen${onArrival ? ` (+${onArrival} on screen at load)` : ''}, ${all.length} engines;`;
  }
  console.log(`${problems.length ? '✗' : '✓'} /components/${slug} ${summary.replace(/;$/, '')}`);
  problems.forEach((p) => console.log(`    ${p}`));
  if (problems.length) failures.push(`/components/${slug}`);
}

{
  const { page, errors } = await open('/components');
  const all = await engines(page);
  await page.close();
  const short = all.filter((e) => e.p < 0.99);
  if (!all.length) errors.push('no svg-scroll-draw engine registered');
  if (short.length) errors.push(`${short.length} of ${all.length} engines never finished`);
  console.log(`${errors.length ? '✗' : '✓'} /components  ${all.length} engines`);
  errors.forEach((e) => console.log(`    ${e}`));
  if (errors.length) failures.push('/components');
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
console.log(`\n✓ ${slugs.length} blocks and ${components.length} components run to the end, and every page loads clean`);
