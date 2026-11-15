#!/usr/bin/env node
/**
 * The Vue registry, for the shadcn-vue CLI:
 *
 *   registry/vue/<name>.vue   → public/r/vue/<name>.json   (one block)
 *   lib/plotter.ts            → public/r/vue/plotter.json  (the generators)
 *                             → public/r/vue/registry.json (the index)
 *
 * Titles and descriptions come from registry.json, so the React and Vue
 * versions of a block are described once. Every block depends on the Vue
 * plotter item, which installs lib/plotter.ts (the same file React uses).
 *
 *   npx shadcn-vue@latest add https://scrollfx-ui.vercel.app/r/vue/<name>.json
 *
 * Run by `npm run registry`; `--check` fails if the committed files are stale.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'public/r/vue');
const SITE = 'https://scrollfx-ui.vercel.app';
const check = process.argv.includes('--check');

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'));
const pascal = (name) => name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

const lib = registry.items.find((i) => i.name === 'plotter');
const items = [
  {
    $schema: 'https://shadcn-vue.com/schema/registry-item.json',
    name: 'plotter',
    type: 'registry:lib',
    title: lib.title,
    description: lib.description,
    files: [{ path: 'lib/plotter.ts', content: readFileSync(join(ROOT, 'lib/plotter.ts'), 'utf8'), type: 'registry:lib' }],
  },
];
for (const item of registry.items.filter((i) => i.type === 'registry:block')) {
  const file = join(ROOT, 'registry/vue', `${item.name}.vue`);
  if (!existsSync(file)) continue;
  items.push({
    $schema: 'https://shadcn-vue.com/schema/registry-item.json',
    name: item.name,
    type: 'registry:block',
    title: item.title,
    description: item.description,
    dependencies: ['svg-scroll-draw'],
    registryDependencies: [`${SITE}/r/vue/plotter.json`],
    files: [{ path: `registry/vue/${item.name}.vue`, content: readFileSync(file, 'utf8'), type: 'registry:component', target: `components/scrollfx/${pascal(item.name)}.vue` }],
  });
}

const index = {
  $schema: 'https://shadcn-vue.com/schema/registry.json',
  name: 'scrollfx',
  homepage: SITE,
  // The index lists the files without their content, as the shadcn index does.
  items: items.map(({ $schema, files, ...rest }) => ({ ...rest, files: files.map(({ content, ...f }) => f) })),
};

const outputs = [...items.map((i) => [`${i.name}.json`, i]), ['registry.json', index]];
let stale = 0;
mkdirSync(OUT, { recursive: true });
for (const [name, data] of outputs) {
  const path = join(OUT, name);
  const text = JSON.stringify(data, null, 2) + '\n';
  if (check) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== text) { console.error(`✗ public/r/vue/${name} is stale`); stale++; }
  } else writeFileSync(path, text);
}
if (check && stale) process.exit(1);
console.log(`${check ? '✓ up to date:' : '✓ wrote'} public/r/vue: ${items.length - 1} blocks and plotter`);
