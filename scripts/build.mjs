#!/usr/bin/env node
/**
 * Builds site/ (the gallery, served by Vercel) and the effects table in
 * README.md, both from the <meta name="fx:…"> tags in effects/*.html.
 *
 *   node scripts/build.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://github.com/DhruvilChauahan0210/scrollfx';
const LIB = 'https://svg-scroll-draw.vercel.app';

const meta = (html, name) => html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1] ?? '';
const effects = readdirSync(join(root, 'effects'))
  .filter((f) => f.endsWith('.html'))
  .sort()
  .map((file) => {
    const html = readFileSync(join(root, 'effects', file), 'utf8');
    return {
      file,
      slug: file.replace(/\.html$/, ''),
      title: html.match(/<title>([^<·]+)/)[1].trim(),
      desc: meta(html, 'description'),
      number: meta(html, 'fx:number'),
      category: meta(html, 'fx:category'),
      api: meta(html, 'fx:api'),
    };
  });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// ── site/ ────────────────────────────────────────────────────────────────────
const site = join(root, 'site');
rmSync(site, { recursive: true, force: true });
mkdirSync(join(site, 'e'), { recursive: true });
for (const e of effects) copyFileSync(join(root, 'effects', e.file), join(site, 'e', e.file));

const categories = [...new Set(effects.map((e) => e.category))];
const cards = (cat) => effects.filter((e) => e.category === cat).map((e) => `
      <a class="card" href="e/${e.file}">
        <span class="n">${e.number}</span>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.desc)}</p>
        <code>${esc(e.api)}</code>
      </a>`).join('');

writeFileSync(join(site, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>scrollfx — ${effects.length} copy-paste scroll effects</title>
<meta name="description" content="${effects.length} scroll-driven effects, each one HTML file you can copy: line drawing, reveals, text, counters, pinning, horizontal scroll and image sequences. Built on svg-scroll-draw.">
<style>
:root { --bg: #f6f4ef; --ink: #16171b; --muted: #5d5f66; --accent: #2d55d8; --line: #d9d5cc; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif; }
header { padding: 72px 20px 32px; max-width: 1100px; margin: 0 auto; }
h1 { font-size: clamp(40px, 8vw, 88px); line-height: .98; margin: 0 0 16px; letter-spacing: -.03em; }
header p { max-width: 60ch; color: var(--muted); margin: 0 0 12px; font-size: 18px; }
header a { color: var(--ink); }
.pill { display: inline-block; font: 600 13px/1 ui-monospace, monospace; padding: 8px 12px; border: 1px solid var(--ink); border-radius: 999px; text-decoration: none; margin: 8px 8px 0 0; }
main { max-width: 1100px; margin: 0 auto; padding: 0 20px 60px; }
h2 { font-size: 14px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin: 40px 0 14px; font-family: ui-monospace, monospace; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.card { display: block; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; color: inherit; text-decoration: none; transition: border-color .15s, transform .15s; }
.card:hover, .card:focus-visible { border-color: var(--ink); transform: translateY(-2px); }
.n { font: 600 12px/1 ui-monospace, monospace; color: var(--accent); }
.card h3 { margin: 8px 0 6px; font-size: 19px; }
.card p { margin: 0 0 10px; color: var(--muted); font-size: 14px; }
.card code { font-size: 12px; color: var(--muted); }
footer { text-align: center; padding: 32px 20px 48px; color: var(--muted); border-top: 1px solid var(--line); }
footer a { color: var(--ink); }
</style>
</head>
<body>
<header>
  <h1>scrollfx</h1>
  <p>${effects.length} scroll-driven effects. Each one is a single HTML file: open it, read it, copy it into your page. No build step.</p>
  <p>Every effect runs on <a href="${LIB}">svg-scroll-draw</a>, a zero-dependency scroll animation library that uses the browser's own scroll timeline where it can.</p>
  <a class="pill" href="${REPO}">GitHub ★</a><a class="pill" href="${LIB}/docs">svg-scroll-draw docs</a><a class="pill" href="https://www.npmjs.com/package/svg-scroll-draw">npm install svg-scroll-draw</a>
</header>
<main>
${categories.map((c) => `  <h2>${esc(c)}</h2>\n  <div class="grid">${cards(c)}\n  </div>`).join('\n')}
</main>
<footer>MIT · Built with <a href="${LIB}">svg-scroll-draw</a> · <a href="${REPO}">source on GitHub</a></footer>
</body>
</html>
`);

// ── README table ─────────────────────────────────────────────────────────────
const readmePath = join(root, 'README.md');
const readme = readFileSync(readmePath, 'utf8');
const table = ['| # | Effect | What it does | API |', '|---|---|---|---|',
  ...effects.map((e) => `| ${e.number} | [${e.title}](effects/${e.file}) | ${e.desc} | \`${e.api}\` |`)].join('\n');
const next = readme.replace(/<!-- effects -->[\s\S]*<!-- \/effects -->/, `<!-- effects -->\n${table}\n<!-- /effects -->`);
writeFileSync(readmePath, next);
console.log(`✓ ${effects.length} effects → site/ and the README table`);
