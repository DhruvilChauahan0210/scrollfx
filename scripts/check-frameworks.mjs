#!/usr/bin/env node
/**
 * Every Vue or Svelte block and component (registry/<framework>/<name>.<ext>),
 * compiled and run in Chromium.
 *
 * The site renders the React versions, so nothing else would notice a Vue or
 * Svelte file that does not compile or never draws. Each is compiled
 * (@vue/compiler-sfc, or svelte/compiler for client code), bundled with
 * esbuild against the installed svg-scroll-draw, lib/ (plotter and the
 * framework-free cores) and the framework's own helpers in
 * registry/<framework>/lib/, styled with the site's own Tailwind theme,
 * mounted, and scrolled through. It passes when it logs no error, every
 * engine in a visible element runs to the end, and each scroll-drawn picture
 * finishes as it reaches the middle of the screen: still drawing with its
 * centre at 65% of the screen, done by 45% (the hero and the footer play on
 * arrival and are only checked for finishing).
 *
 * A block is mounted once, with its default props. A component (a
 * registry:ui item) is mounted once per variant, from
 * registry/framework-examples/<name>.json, the one list both frameworks read:
 *
 *   { "variants": [ { "name": "default", "props": {} },
 *                   { "name": "horizontal", "props": { "orientation": "horizontal" } },
 *                   { "name": "view", "props": { "trigger": "view" } },
 *                   { "name": "words", "props": {}, "text": "Children, as plain text" } ] }
 *
 * `props` are passed as they are (camelCase, as in React); `text`, if given,
 * is the default slot (Vue) or `children` (Svelte). A component's pens in one
 * box (a chart's axes, hatching and lines) are measured together, as the
 * reader sees them; a variant with `"trigger": "view"` plays on arrival and
 * is only checked for finishing. A component with no examples file is mounted
 * once with its defaults.
 *
 *   npm run check:vue      (node scripts/check-frameworks.mjs vue)
 *   npm run check:svelte   (node scripts/check-frameworks.mjs svelte)
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const FRAMEWORK = process.argv[2];
if (FRAMEWORK !== 'vue' && FRAMEWORK !== 'svelte') {
  console.error('usage: node scripts/check-frameworks.mjs vue|svelte');
  process.exit(2);
}
const EXT = FRAMEWORK === 'vue' ? '.vue' : '.svelte';
const ROOT = new URL('..', import.meta.url).pathname;
const DIR = join(ROOT, 'registry', FRAMEWORK);
const LIB = join(DIR, 'lib');
const EXAMPLES = join(ROOT, 'registry/framework-examples');
const require = createRequire(join(ROOT, 'package.json'));
const { build } = require('esbuild');
const { compile } = await import('@tailwindcss/node');
const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'));
const components = new Set(registry.items.filter((i) => i.type === 'registry:ui').map((i) => i.name));

// ONLY=pricing node scripts/check-frameworks.mjs svelte checks the files whose names start with it.
const files = readdirSync(DIR).filter((f) => f.endsWith(EXT) && f.startsWith(process.env.ONLY ?? '')).sort();
// A run that has not finished in this long fails, rather than hanging the check.
const RUN_MS = 120_000;
const ON_ARRIVAL = new Set(['hero-flow-field', 'footer-plotted']);

/** What to mount for a file: a block once with its defaults; a component once per variant. */
function runsOf(name) {
  if (!components.has(name)) return [{ label: name, props: {}, arrival: ON_ARRIVAL.has(name), grouped: false }];
  const path = join(EXAMPLES, `${name}.json`);
  const variants = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')).variants : [{ name: 'default', props: {} }];
  return variants.map((v) => ({ label: `${name} · ${v.name}`, props: v.props ?? {}, text: v.text, arrival: v.props?.trigger === 'view', grouped: true }));
}

/**
 * esbuild: components through their compiler, and the aliases they import
 * shared code by (`@/lib/x` in Vue, `$lib/x` in Svelte): the framework's own
 * helper in registry/<framework>/lib/ if there is one, else lib/x.ts.
 */
const plugin = {
  name: 'components',
  setup(b) {
    b.onResolve({ filter: /^(@\/lib|\$lib)\// }, (args) => {
      const rel = args.path.replace(/^(@\/lib|\$lib)\//, '');
      for (const p of [join(LIB, rel), join(LIB, rel + '.ts')]) if (existsSync(p)) return { path: p };
      return { path: join(ROOT, 'lib', rel.endsWith('.ts') ? rel : rel + '.ts') };
    });
    b.onLoad({ filter: /\.vue$/ }, (args) => {
      const { parse, compileScript } = require('@vue/compiler-sfc');
      const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      if (errors.length) throw new Error(errors.map(String).join('\n'));
      const script = compileScript(descriptor, { id: 'v' + args.path.length, inlineTemplate: true });
      return { contents: script.content, loader: 'ts', resolveDir: dirname(args.path) };
    });
    b.onLoad({ filter: /\.svelte$/ }, (args) => {
      const { compile: compileSvelte } = require('svelte/compiler');
      const { js } = compileSvelte(readFileSync(args.path, 'utf8'), { filename: args.path, generate: 'client' });
      return { contents: js.code, loader: 'js', resolveDir: dirname(args.path) };
    });
    // A stylesheet the files import (svg-scroll-draw/no-flash.css) goes in a
    // <style>, as Vite would put it in the page.
    b.onLoad({ filter: /\.css$/ }, (args) => ({
      contents: `document.head.appendChild(Object.assign(document.createElement('style'), { textContent: ${JSON.stringify(readFileSync(args.path, 'utf8'))} }));`,
      loader: 'js',
    }));
  },
};

async function bundle(file, run) {
  const component = JSON.stringify(join(DIR, file));
  const props = JSON.stringify(run.props);
  const text = JSON.stringify(run.text ?? null);
  const entry = FRAMEWORK === 'vue'
    ? `import { createApp, h } from 'vue'; import C from ${component};
       const text = ${text};
       createApp({ render: () => h(C, ${props}, text === null ? undefined : { default: () => text }) }).mount('#app'); window.__ready = true;`
    : `import { mount, createRawSnippet } from 'svelte'; import C from ${component};
       const text = ${text};
       const props = ${props};
       if (text !== null) props.children = createRawSnippet(() => ({ render: () => '<span>' + text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]) + '</span>' }));
       mount(C, { target: document.getElementById('app'), props }); window.__ready = true;`;
  const out = await build({
    stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
    bundle: true, write: false, format: 'iife', platform: 'browser', plugins: [plugin], conditions: ['svelte', 'browser'],
    define: { __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false', 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  return out.outputFiles[0].text;
}

/**
 * Tailwind 4 CSS for the classes the file uses, with the site's theme tokens:
 * the file's own, its shared libraries' (lib/ and registry/<framework>/lib/),
 * and those its examples pass in.
 */
async function css(file) {
  const name = file.slice(0, -EXT.length);
  const sources = [join(DIR, file), ...readdirSync(join(ROOT, 'lib')).map((f) => join(ROOT, 'lib', f))];
  if (existsSync(LIB)) sources.push(...readdirSync(LIB).map((f) => join(LIB, f)));
  if (existsSync(join(EXAMPLES, `${name}.json`))) sources.push(join(EXAMPLES, `${name}.json`));
  const src = sources.map((p) => readFileSync(p, 'utf8')).join('\n');
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
let blocks = 0, variants = 0;
const named = new Set();

for (const file of files) {
  const name = file.slice(0, -EXT.length);
  for (const r of runsOf(name)) {
    if (components.has(name)) { variants++; named.add(name); } else blocks++;
    let js;
    try { js = await bundle(file, r); } catch (e) { check(false, `${r.label}: does not compile — ${String(e).slice(0, 300)}`); console.log(`✗ ${r.label}  does not compile`); continue; }
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text().slice(0, 200)); });
    let timer;
    const late = new Promise((ok) => { timer = setTimeout(() => ok('timeout'), RUN_MS); });
    const result = await Promise.race([run(r, file, js, page, errors), late]);
    clearTimeout(timer);
    if (result === 'timeout') {
      check(false, `${r.label}: did not finish within ${RUN_MS / 1000} s`);
      console.log(`✗ ${r.label}  timed out`);
    }
    await page.close().catch(() => {});
  }
}

async function run({ label: name, arrival, grouped }, file, js, page, errors) {
  await page.goto(origin);
  await page.addStyleTag({ content: await css(file) });
  await page.addScriptTag({ content: js });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 5000 }).catch(() => check(false, `${name}: never mounted`));
  await page.waitForTimeout(400);

  // Each scroll-drawn picture: still drawing at centre 65%, done by 45%. A
  // component's pens in one box are one picture.
  if (!arrival) {
    const bands = await page.evaluate(async (grouped) => {
      const pictures = new Map();
      for (const svg of document.querySelectorAll('#app svg')) {
        if (!svg.getClientRects().length || svg.dataset.ink === 'view') continue;
        const paths = [...svg.querySelectorAll('path, circle')].filter((p) => getComputedStyle(p).strokeDasharray !== 'none');
        if (!paths.length) continue;
        const r = svg.getBoundingClientRect();
        const key = grouped ? [r.left, r.top + scrollY, r.width, r.height].map(Math.round).join() : pictures.size;
        pictures.set(key, { svg, paths: [...(pictures.get(key)?.paths ?? []), ...paths] });
      }
      const out = [];
      for (const { svg, paths } of pictures.values()) {
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
        await new Promise((r) => setTimeout(r, 50));
      }
      return out;
    }, grouped);
    check(bands.length > 0, `${name}: no scroll-drawn picture found`);
    bands.forEach((b, i) => {
      check(b.early > 0.02, `${name}: drawing ${i + 1} already finished with its centre at 65% of the screen`);
      check(b.late <= 0.02, `${name}: drawing ${i + 1} ${(b.late * 100).toFixed(0)}% undrawn with its centre at 45%`);
    });
  }

  // Through to the end: every engine in a visible element finishes. What
  // plays on arrival pauses while it is off screen, so it is brought into
  // view and given time to play there instead.
  if (arrival) {
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
  return 'done';
}

await browser.close();
server.close();
const fw = FRAMEWORK === 'vue' ? 'Vue' : 'Svelte';
if (failures.length) {
  console.error(`\n✗ ${failures.length} ${FRAMEWORK} check(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`\n✓ ${blocks} ${fw} blocks and ${named.size} ${fw} components (${variants} variants) compile, run to the end, and finish as they reach mid-screen`);
