#!/usr/bin/env node
/**
 * Every Vue block (registry/vue/<name>.vue), compiled and run in Chromium.
 *
 * The site renders the React blocks, so nothing else would notice a Vue block
 * that does not compile or never draws. Each SFC is compiled with
 * @vue/compiler-sfc, bundled with esbuild against the installed
 * svg-scroll-draw and lib/plotter, styled with the site's own Tailwind theme,
 * mounted with its default props, and scrolled through. A block passes when
 * it logs no error, every engine in a visible element runs to the end, and
 * each scroll-drawn picture finishes as it reaches the middle of the screen:
 * still drawing with its centre at 65% of the screen, done by 45% (the hero
 * and the footer play on arrival and are only checked for finishing).
 *
 *   npm run check:vue
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const ROOT = new URL('..', import.meta.url).pathname;
const VUE_DIR = join(ROOT, 'registry/vue');
const require = createRequire(join(ROOT, 'package.json'));
const { parse, compileScript } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { compile } = await import('@tailwindcss/node');

const files = readdirSync(VUE_DIR).filter((f) => f.endsWith('.vue')).sort();
const ON_ARRIVAL = new Set(['hero-flow-field', 'footer-plotted']);

/** esbuild: .vue through compiler-sfc, and the `@/` alias to the project root. */
const plugin = {
  name: 'vue-sfc',
  setup(b) {
    b.onResolve({ filter: /^@\// }, (args) => ({ path: join(ROOT, args.path.slice(2) + (args.path.endsWith('.ts') ? '' : '.ts')) }));
    b.onLoad({ filter: /\.vue$/ }, (args) => {
      const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      if (errors.length) throw new Error(errors.map(String).join('\n'));
      const script = compileScript(descriptor, { id: 'v' + args.path.length, inlineTemplate: true });
      return { contents: script.content, loader: 'ts', resolveDir: dirname(args.path) };
    });
  },
};

async function bundle(file) {
  const entry = `import { createApp } from 'vue'; import C from ${JSON.stringify(join(VUE_DIR, file))};
    createApp(C).mount('#app'); window.__ready = true;`;
  const out = await build({
    stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
    bundle: true, write: false, format: 'iife', platform: 'browser', plugins: [plugin],
    define: { __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false', 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  return out.outputFiles[0].text;
}

/** Tailwind 4 CSS for the classes the file uses, with the site's theme tokens. */
async function css(file) {
  const src = readFileSync(join(VUE_DIR, file), 'utf8');
  const compiler = await compile(readFileSync(join(ROOT, 'app/globals.css'), 'utf8'), { base: join(ROOT, 'app'), onDependency: () => {} });
  return compiler.build(src.split(/[\s"'`]+/).filter(Boolean));
}

const PAGE = '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}</style></head>' +
  '<body><div style="height:100vh"></div><div id="app"></div><div style="height:150vh"></div></body></html>';
const server = http.createServer((_, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGE); });
await new Promise((ok) => server.listen(0, ok));
const origin = `http://localhost:${server.address().port}`;

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };
const browser = await chromium.launch();

for (const file of files) {
  const name = file.replace(/\.vue$/, '');
  let js;
  try { js = await bundle(file); } catch (e) { check(false, `${name}: does not compile — ${String(e).slice(0, 300)}`); continue; }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text().slice(0, 200)); });
  await page.goto(origin);
  await page.addStyleTag({ content: await css(file) });
  await page.addScriptTag({ content: js });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 5000 }).catch(() => check(false, `${name}: never mounted`));
  await page.waitForTimeout(400);

  // Each scroll-drawn picture: still drawing at centre 65%, done by 45%.
  if (!ON_ARRIVAL.has(name)) {
    const bands = await page.evaluate(async () => {
      const out = [];
      for (const svg of document.querySelectorAll('#app svg')) {
        if (!svg.getClientRects().length) continue;
        const paths = [...svg.querySelectorAll('path, circle')].filter((p) => getComputedStyle(p).strokeDasharray !== 'none');
        if (!paths.length) continue;
        const undrawn = () => Math.max(...paths.map((p) => { const c = getComputedStyle(p); return Math.abs(parseFloat(c.strokeDashoffset)) / parseFloat(c.strokeDasharray); }));
        const box = svg.getBoundingClientRect();
        const centre = box.top + scrollY + box.height / 2;
        const at = async (f) => {
          const t = centre - innerHeight * f;
          for (let y = Math.max(0, t - innerHeight); y < t; y += 60) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 16))); }
          scrollTo(0, t);
          await new Promise((r) => setTimeout(r, 250));
          return undrawn();
        };
        out.push({ early: await at(0.65), late: await at(0.45) });
        scrollTo(0, 0);
      }
      return out;
    });
    check(bands.length > 0, `${name}: no scroll-drawn picture found`);
    bands.forEach((b, i) => {
      check(b.early > 0.02, `${name}: drawing ${i + 1} already finished with its centre at 65% of the screen`);
      check(b.late <= 0.02, `${name}: drawing ${i + 1} ${(b.late * 100).toFixed(0)}% undrawn with its centre at 45%`);
    });
  }

  // Through to the end: every engine in a visible element finishes. A block
  // that plays on arrival pauses while it is off screen, so it is brought into
  // view and given time to play there instead.
  if (ON_ARRIVAL.has(name)) {
    await page.evaluate(() => document.querySelector('#app > *').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(6500);
  } else {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 150) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(30); }
    await page.waitForTimeout(1200);
  }
  const engines = await page.evaluate(() => {
    const m = globalThis[Symbol.for('svg-scroll-draw.registry')];
    return m ? [...m.entries()].filter(([el]) => el.getClientRects().length > 0).map(([, e]) => e.getProgress()) : [];
  });
  check(engines.length > 0, `${name}: no svg-scroll-draw engine registered`);
  const short = engines.filter((p) => p < 0.99);
  check(!short.length, `${name}: ${short.length} of ${engines.length} engines never finished`);
  check(errors.length === 0, `${name}: errors: ${errors.join(' | ')}`);
  console.log(`${failures.some((f) => f.startsWith(name + ':')) ? '✗' : '✓'} ${name}  ${engines.length} engines`);
  await page.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\n✗ ${failures.length} Vue check(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`\n✓ ${files.length} Vue blocks compile, run to the end, and finish as they reach mid-screen`);
