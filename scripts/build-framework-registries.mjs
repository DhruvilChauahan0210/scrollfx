#!/usr/bin/env node
/**
 * The Vue and Svelte registries, for the shadcn-vue and shadcn-svelte CLIs:
 *
 *   registry/vue/<name>.vue        → public/r/vue/<name>.json
 *   registry/svelte/<name>.svelte  → public/r/svelte/<name>.json
 *   lib/plotter.ts                 → public/r/<framework>/plotter.json
 *                                  → public/r/<framework>/registry.json (the index)
 *
 * Titles and descriptions come from registry.json, so every version of a block
 * is described once. Every block depends on its framework's plotter item,
 * which installs lib/plotter.ts (the same file React uses).
 *
 *   npx shadcn-vue@latest add https://scrollfx-ui.vercel.app/r/vue/<name>.json
 *   npx shadcn-svelte@latest add https://scrollfx-ui.vercel.app/r/svelte/<name>.json
 *
 * shadcn-svelte wants `content`, `type` and `target` on every file and rejects
 * `path`. Its targets are relative to the alias folder for the file's type, so
 * the generators target `plotter.ts` (landing at $lib/plotter.ts, where the
 * blocks import it) and the blocks `scrollfx/<Name>.svelte`.
 *
 * Run by `npm run registry`; `--check` fails if the committed files are stale.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = 'https://scrollfx-ui.vercel.app';
const check = process.argv.includes('--check');
const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'));
const pascal = (name) => name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
const lib = registry.items.find((i) => i.name === 'plotter');
const plotter = readFileSync(join(ROOT, 'lib/plotter.ts'), 'utf8');

const FRAMEWORKS = [
  {
    dir: 'vue',
    ext: '.vue',
    schema: 'https://shadcn-vue.com',
    lib: { path: 'lib/plotter.ts', content: plotter, type: 'registry:lib' },
    file: (name, content) => ({ path: `registry/vue/${name}.vue`, content, type: 'registry:component', target: `components/scrollfx/${pascal(name)}.vue` }),
  },
  {
    dir: 'svelte',
    ext: '.svelte',
    schema: 'https://shadcn-svelte.com',
    // Targets are relative to the alias folder for the file's type ($lib for
    // a lib, $lib/components for a component), not to the project root: a
    // full src/lib/... path installs at src/lib/src/lib/...
    lib: { content: plotter, type: 'registry:lib', target: 'plotter.ts' },
    file: (name, content) => ({ content, type: 'registry:component', target: `scrollfx/${pascal(name)}.svelte` }),
  },
];

let stale = 0;
for (const fw of FRAMEWORKS) {
  const OUT = join(ROOT, 'public/r', fw.dir);
  const items = [
    { $schema: `${fw.schema}/schema/registry-item.json`, name: 'plotter', type: 'registry:lib', title: lib.title, description: lib.description, files: [fw.lib] },
  ];
  for (const item of registry.items.filter((i) => i.type === 'registry:block')) {
    const src = join(ROOT, 'registry', fw.dir, `${item.name}${fw.ext}`);
    if (!existsSync(src)) continue;
    items.push({
      $schema: `${fw.schema}/schema/registry-item.json`,
      name: item.name,
      type: 'registry:block',
      title: item.title,
      description: item.description,
      dependencies: ['svg-scroll-draw'],
      registryDependencies: [`${SITE}/r/${fw.dir}/plotter.json`],
      files: [fw.file(item.name, readFileSync(src, 'utf8'))],
    });
  }
  const index = {
    $schema: `${fw.schema}/schema/registry.json`,
    name: 'scrollfx',
    homepage: SITE,
    // The index lists the files without their content, as the shadcn index does.
    items: items.map(({ $schema, files, ...rest }) => ({ ...rest, files: files.map(({ content, ...f }) => f) })),
  };
  mkdirSync(OUT, { recursive: true });
  for (const [name, data] of [...items.map((i) => [`${i.name}.json`, i]), ['registry.json', index]]) {
    const path = join(OUT, name);
    const text = JSON.stringify(data, null, 2) + '\n';
    if (check) {
      if (!existsSync(path) || readFileSync(path, 'utf8') !== text) { console.error(`✗ public/r/${fw.dir}/${name} is stale`); stale++; }
    } else writeFileSync(path, text);
  }
  console.log(`${check ? '✓ up to date:' : '✓ wrote'} public/r/${fw.dir}: ${items.length - 1} blocks and plotter`);
}
if (check && stale) process.exit(1);
