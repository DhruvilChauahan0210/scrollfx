#!/usr/bin/env node
/**
 * Every block, served from the production build and scrolled in Chromium. A
 * block passes when its page logs no error or warning (hydration included)
 * and every svg-scroll-draw engine in it ran to the end. The home page and each
 * block's docs page must load clean too, and every scroll-drawn picture on the
 * home page must finish as it reaches the middle of the screen, not before.
 * Every component (registry:ui) is loaded the same way from its test page,
 * /preview/ui/<name>, which stacks all its examples: no errors or warnings,
 * every engine finishes, and every drawing tied to the scroll finishes as it
 * reaches the middle of the screen.
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

/**
 * Scroll down as a reader would until the svg's centre sits at 65% of the
 * screen, then at 45%, and read how much of it is still undrawn at each. Run
 * in the page; null for an svg that is hidden, in the hero, or not drawn.
 */
async function timing({ selector, i, skipHero }) {
  const svg = document.querySelectorAll(selector)[i];
  if ((skipHero && svg.closest('section').querySelector('h1')) || svg.getClientRects().length === 0) return null;
  const paths = [...svg.querySelectorAll('path, circle')].filter((p) => getComputedStyle(p).strokeDasharray !== 'none');
  if (!paths.length) return null;
  const undrawn = () => Math.max(...paths.map((p) => { const cs = getComputedStyle(p); return Math.abs(parseFloat(cs.strokeDashoffset)) / parseFloat(cs.strokeDasharray); }));
  const box = svg.getBoundingClientRect();
  const centre = box.top + scrollY + box.height / 2;
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
  const at = svg.closest('section');
  return { name: at?.querySelector('h2')?.textContent || at?.id || `svg ${i}`, early, late };
}

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
    const r = await page.evaluate(timing, { selector: 'section svg', i, skipHero: true });
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

// Every component, from its test page: each example in turn. A drawing tied
// to the scroll must finish as it reaches the middle of the screen (as on the
// home page); then, read top to bottom, every engine must run to the end,
// including those played once on arrival.
for (const slug of components) {
  const { page, errors } = await open(`/preview/ui/${slug}`);
  await page.waitForTimeout(500);
  const problems = [...errors];
  const count = await page.evaluate(() => document.querySelectorAll('svg[data-ink="scroll"]').length);
  for (let i = 0; i < count; i++) {
    const r = await page.evaluate(timing, { selector: 'svg[data-ink="scroll"]', i, skipHero: false });
    if (!r) continue;
    if (r.early < 0.02) problems.push(`${r.name}: drawing ${i} already finished with its centre at 65% of the screen`);
    if (r.late > 0.02) problems.push(`${r.name}: drawing ${i} ${(r.late * 100).toFixed(0)}% undrawn with its centre at 45%`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 150) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
  }
  // A drawing played on arrival pauses while it is off screen: bring each
  // one still short back into view and give it time to finish. Scrolling
  // back up undraws the scroll-tied drawings below it, so read the page down
  // to the end again afterwards.
  for (let k = 0; k < 20; k++) {
    const found = await page.evaluate(() => {
      const short = [...globalThis[Symbol.for('svg-scroll-draw.registry')].entries()].find(([el, e]) => el.getAttribute('data-ink') === 'view' && el.getClientRects().length > 0 && e.getProgress() < 0.99);
      short?.[0].scrollIntoView({ block: 'center' });
      return !!short;
    });
    if (!found) break;
    await page.waitForTimeout(3500);
  }
  for (let y = await page.evaluate(() => scrollY); y <= height; y += 150) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1000);
  const engines = await page.evaluate(() => {
    const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
    return m ? [...m.entries()].filter(([el]) => el.getClientRects().length > 0).map(([, e]) => ({ type: e.type, p: e.getProgress() })) : [];
  });
  await page.close();
  if (!engines.length) problems.push('no svg-scroll-draw engine registered');
  const short = engines.filter((e) => e.p < 0.99);
  if (short.length) problems.push(`${short.length} of ${engines.length} engines never finished (${short.map((e) => `${e.type} ${e.p.toFixed(2)}`).join(', ')})`);
  console.log(`${problems.length ? '✗' : '✓'} ui/${slug}  ${engines.length} engines, ${count} drawings at mid-screen`);
  problems.forEach((p) => console.log(`    ${p}`));
  if (problems.length) failures.push(`ui/${slug}`);
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
