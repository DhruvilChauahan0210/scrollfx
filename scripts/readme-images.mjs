#!/usr/bin/env node
/**
 * The README's images, taken from the live site (or BASE):
 *
 *   docs/hero-light.jpg, docs/hero-dark.jpg   the first screen, both themes
 *   docs/plates/<slug>.jpg                    each plate's preview, at most a screen tall
 *   docs/plotting.gif                         the hero's print being plotted
 *
 * Stills load with reduced motion, which shows every drawing finished, so no
 * capture catches a plate half drawn. The GIF records the real plot and needs
 * ffmpeg on the PATH.
 *
 *   npm run readme:images                 # from https://scrollfx-ui.vercel.app
 *   BASE=http://localhost:4400 npm run readme:images
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'https://scrollfx-ui.vercel.app';
const OUT = new URL('../docs/', import.meta.url).pathname;
mkdirSync(join(OUT, 'plates'), { recursive: true });
const slugs = JSON.parse(readFileSync(new URL('../registry.json', import.meta.url)))
  .items.filter((i) => i.type === 'registry:block' && !i.name.startsWith('hero-')).map((i) => i.name);

const browser = await chromium.launch();

for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce', colorScheme: theme });
  await page.goto(`${BASE}/?theme=${theme}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, `hero-${theme}.jpg`), type: 'jpeg', quality: 86 });
  await page.close();
}

for (const slug of slugs) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto(`${BASE}/preview/${slug}?theme=light`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const clip = await page.evaluate(() => {
    const r = document.querySelector('section').getBoundingClientRect();
    return { x: 0, y: r.top + scrollY, width: innerWidth, height: Math.min(r.height, 900) };
  });
  await page.screenshot({ path: join(OUT, 'plates', `${slug}.jpg`), type: 'jpeg', quality: 84, clip, fullPage: true });
  await page.close();
  console.log(`✓ plates/${slug}.jpg`);
}

// The plot, recorded at its real speed, then cut to the print: from just
// before the first stroke to two seconds after the last. The plot starts at
// load, about a second before the network goes idle, hence `ready - 1.2`.
const dir = mkdtempSync(join(tmpdir(), 'scrollfx-clip-'));
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: 'light', recordVideo: { dir, size: { width: 1280, height: 1000 } } });
const page = await ctx.newPage();
const loaded = Date.now();
await page.goto(`${BASE}/?theme=light`, { waitUntil: 'networkidle' });
const ready = (Date.now() - loaded) / 1000;
const box = await page.evaluate(() => { const r = document.querySelector('figure').getBoundingClientRect(); return [r.width, r.height, r.x, r.y].map(Math.round); });
await page.waitForTimeout(9000);
await ctx.close();
await browser.close();
const video = join(dir, readdirSync(dir).find((f) => f.endsWith('.webm')));
execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-ss', String(Math.max(0, ready - 1.2)), '-t', '8', '-i', video,
  '-vf', `crop=${box.join(':')},fps=15,scale=460:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=48:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
  '-loop', '0', join(OUT, 'plotting.gif'),
]);
rmSync(dir, { recursive: true, force: true });
console.log('✓ hero-light.jpg, hero-dark.jpg, plotting.gif');
