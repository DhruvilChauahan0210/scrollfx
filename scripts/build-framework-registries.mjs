#!/usr/bin/env node
/**
 * The Vue and Svelte registries, for the shadcn-vue and shadcn-svelte CLIs:
 *
 *   registry/vue/<name>.vue          → public/r/vue/<name>.json        (a block or a component)
 *   registry/svelte/<name>.svelte    → public/r/svelte/<name>.json
 *   each shared library              → public/r/<framework>/<lib>.json (plotter, chart, ...)
 *                                    → public/r/<framework>/registry.json (the index)
 *
 * What is published, and in what order, follows registry.json: every
 * registry:block and registry:ui item that has a Vue (or Svelte) file, and
 * every registry:lib item that has files for that framework. Titles and
 * descriptions come from there too, so every version is described once.
 *
 * A shared library `<lib>` is, for each framework:
 *   - its framework-free core, the same file React uses: lib/plotter.ts for
 *     the plotter, lib/<lib>-core.ts for the others (lib/chart-core.ts);
 *   - the framework's own helpers: every file in registry/<framework>/lib/
 *     named `<lib>-*` or `<lib>.*` (registry/vue/lib/chart-vue.ts,
 *     registry/svelte/lib/chart-parts.svelte), installed beside it.
 * A library with neither for a framework is left out of it. Every block and
 * component depends on its framework's plotter item, and on its framework's
 * version of each other library its React item depends on
 * (registryDependencies in registry.json).
 *
 *   npx shadcn-vue@latest add https://scrollfx-ui.vercel.app/r/vue/<name>.json
 *   npx shadcn-svelte@latest add https://scrollfx-ui.vercel.app/r/svelte/<name>.json
 *
 * shadcn-svelte wants `content`, `type` and `target` on every file and rejects
 * `path`. Its targets are relative to the alias folder for the file's type, so
 * a library file targets its own name (landing at $lib/<file>, where the
 * components import it) and a block or component `scrollfx/<Name>.svelte`.
 *
 * Run by `npm run registry`; `--check` fails if the committed files are stale.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = 'https://scrollfx-ui.vercel.app';
const check = process.argv.includes('--check');
const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'));
const pascal = (name) => name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const depName = (url) => url.replace(/^.*\//, '').replace(/\.json$/, '');

const FRAMEWORKS = [
  {
    dir: 'vue',
    ext: '.vue',
    schema: 'https://shadcn-vue.com',
    // A library file installs at lib/<file>, imported as @/lib/<name>.
    lib: (file, content) => ({ path: `lib/${file}`, content, type: 'registry:lib' }),
    file: (name, content) => ({ path: `registry/vue/${name}.vue`, content, type: 'registry:component', target: `components/scrollfx/${pascal(name)}.vue` }),
  },
  {
    dir: 'svelte',
    ext: '.svelte',
    schema: 'https://shadcn-svelte.com',
    // Targets are relative to the alias folder for the file's type ($lib for
    // a lib, $lib/components for a component), not to the project root: a
    // full src/lib/... path installs at src/lib/src/lib/...
    lib: (file, content) => ({ content, type: 'registry:lib', target: file }),
    file: (name, content) => ({ content, type: 'registry:component', target: `scrollfx/${pascal(name)}.svelte` }),
  },
];

/** A library's files for a framework, as [installed name, source path]: its framework-free core, then the framework's helpers. */
function libFiles(lib, fw) {
  const core = lib === 'plotter' ? 'lib/plotter.ts' : `lib/${lib}-core.ts`;
  const helpers = join(ROOT, 'registry', fw.dir, 'lib');
  const own = existsSync(helpers) ? readdirSync(helpers).filter((f) => f.startsWith(`${lib}-`) || f.startsWith(`${lib}.`)).sort() : [];
  return [...(existsSync(join(ROOT, core)) ? [[core.slice('lib/'.length), core]] : []), ...own.map((f) => [f, `registry/${fw.dir}/lib/${f}`])];
}

let stale = 0;
for (const fw of FRAMEWORKS) {
  const OUT = join(ROOT, 'public/r', fw.dir);
  const libs = new Set(registry.items.filter((i) => i.type === 'registry:lib' && libFiles(i.name, fw).length).map((i) => i.name));
  const libDeps = (item) => (item.registryDependencies ?? []).map(depName).filter((d) => libs.has(d)).map((d) => `${SITE}/r/${fw.dir}/${d}.json`);
  const items = [];
  for (const item of registry.items) {
    const base = { $schema: `${fw.schema}/schema/registry-item.json`, name: item.name, type: item.type, title: item.title, description: item.description };
    if (item.type === 'registry:lib') {
      if (!libs.has(item.name)) continue;
      const registryDependencies = libDeps(item);
      items.push({
        ...base,
        ...(item.dependencies ? { dependencies: item.dependencies } : {}),
        ...(registryDependencies.length ? { registryDependencies } : {}),
        files: libFiles(item.name, fw).map(([file, path]) => fw.lib(file, read(path))),
      });
      continue;
    }
    if (item.type !== 'registry:block' && item.type !== 'registry:ui') continue;
    const src = `registry/${fw.dir}/${item.name}${fw.ext}`;
    if (!existsSync(join(ROOT, src))) continue;
    items.push({
      ...base,
      dependencies: ['svg-scroll-draw@^2.29.0'],
      registryDependencies: [...new Set([`${SITE}/r/${fw.dir}/plotter.json`, ...libDeps(item)])],
      files: [fw.file(item.name, read(src))],
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
  const count = (type) => items.filter((i) => i.type === type).length;
  console.log(`${check ? '✓ up to date:' : '✓ wrote'} public/r/${fw.dir}: ${count('registry:block')} blocks, ${count('registry:ui')} components, and the ${[...libs].join(' and ')} libraries`);
}
if (check && stale) process.exit(1);
