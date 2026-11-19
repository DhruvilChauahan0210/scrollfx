import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import registry from '@/registry.json';
import pkg from '@/package.json';
import { COMPONENTS } from '@/lib/components';
import type { Framework } from '@/lib/frameworks';

/**
 * The drawing office's bookkeeping: each component is a sheet in one set, in
 * registry order, after a cover. What a sheet's parts list and title block
 * say is read from registry.json and package.json, never typed by hand.
 */

export const TOTAL = COMPONENTS.length;
export const sheetNo = (n: number) => String(n).padStart(2, '0');
export const sheetOf = (slug: string) => COMPONENTS.findIndex((c) => c.slug === slug) + 1;

/** The svg-scroll-draw release the set is drawn with: its revision. */
export const REV = pkg.dependencies['svg-scroll-draw'].replace(/^[^\d]*/, '');

export interface Part {
  path: string;
  what: string;
  kind: 'file' | 'package';
}

type Item = { name: string; files?: { path: string; target?: string }[]; dependencies?: string[]; registryDependencies?: string[] };
const items = registry.items as unknown as Item[];
const byName = new Map(items.map((i) => [i.name, i]));
const depName = (url: string) => url.replace(/^.*\//, '').replace(/\.json$/, '');

const LIB_NOTE: Record<string, string> = {
  chart: 'Scales, ticks, curves, hatching and the pens the charts share',
  ink: 'The pen hook the ink pieces share, and Hershey’s script',
  plotter: 'Stroke geometry: hatching, sketched lines, scroll windows',
};

// A library file's own note, where a library installs more than one.
const FILE_NOTE: Record<string, string> = {
  'chart-core.ts': 'Scales, ticks, curves, hatching and when each pen works, shared by React, Vue and Svelte',
  'chart.ts': 'The pens, labels, key and data table, in React',
  'chart-vue.ts': 'The pens, labels, key and data table, in Vue',
  'chart-parts.svelte': 'The pens, labels, key and data table, as Svelte snippets',
};
const noteFor = (lib: string, path: string) => FILE_NOTE[path.replace(/^.*\//, '')] ?? LIB_NOTE[lib] ?? 'Shared library';

/** A Vue or Svelte registry item, as scripts/build-framework-registries.mjs writes it to public/r/<framework>/. */
type FrameworkItem = { files?: { path?: string; target?: string }[]; dependencies?: string[]; registryDependencies?: string[] };
function frameworkItem(fw: Exclude<Framework, 'react'>, name: string): FrameworkItem | undefined {
  const path = join(process.cwd(), 'public/r', fw, `${name}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;
}
/** Where a Vue or Svelte file lands: shadcn-svelte's targets are relative to $lib (a library) or $lib/components. */
const landing = (fw: Exclude<Framework, 'react'>, f: { path?: string; target?: string }, lib: boolean) =>
  fw === 'vue' ? (f.target ?? f.path ?? '') : `$lib/${lib ? '' : 'components/'}${f.target ?? ''}`;

/** What `shadcn add` (or shadcn-vue, or shadcn-svelte) puts in a project for this component: its file, the libraries it needs, and the npm packages. */
export function partsList(slug: string, fw: Framework = 'react'): Part[] {
  const item = fw === 'react' ? byName.get(slug) : frameworkItem(fw, slug);
  if (!item) return [];
  const own = (item.files ?? []).map((f) => ({ path: fw === 'react' ? (f.target ?? f.path ?? '') : landing(fw, f, false), what: 'The component', kind: 'file' as const }));
  const libs = (item.registryDependencies ?? []).map(depName).sort((a, b) => (a === 'plotter' ? 1 : b === 'plotter' ? -1 : 0)).flatMap((d) =>
    ((fw === 'react' ? byName.get(d) : frameworkItem(fw, d))?.files ?? []).map((f) => {
      const path = fw === 'react' ? (f.target ?? f.path ?? '') : landing(fw, f, true);
      return { path, what: noteFor(d, path), kind: 'file' as const };
    }),
  );
  const npm = (item.dependencies ?? []).map((d) => {
    const at = d.lastIndexOf('@');
    return { path: at > 0 ? `${d.slice(0, at)} ${d.slice(at + 1)}` : d, what: 'Dependency, from npm', kind: 'package' as const };
  });
  return [...own, ...libs, ...npm];
}
