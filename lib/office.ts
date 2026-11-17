import registry from '@/registry.json';
import pkg from '@/package.json';
import { COMPONENTS } from '@/lib/components';

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

/** What `shadcn add` puts in a project for this component: its file, the libraries it needs, and the npm packages. */
export function partsList(slug: string): Part[] {
  const item = byName.get(slug);
  if (!item) return [];
  const own = (item.files ?? []).map((f) => ({ path: f.target ?? f.path, what: 'The component', kind: 'file' as const }));
  const libs = (item.registryDependencies ?? []).map(depName).sort((a, b) => (a === 'plotter' ? 1 : b === 'plotter' ? -1 : 0)).flatMap((d) =>
    (byName.get(d)?.files ?? []).map((f) => ({ path: f.target ?? f.path, what: LIB_NOTE[d] ?? 'Shared library', kind: 'file' as const })),
  );
  const npm = (item.dependencies ?? []).map((d) => {
    const at = d.lastIndexOf('@');
    return { path: at > 0 ? `${d.slice(0, at)} ${d.slice(at + 1)}` : d, what: 'Dependency, from npm', kind: 'package' as const };
  });
  return [...own, ...libs, ...npm];
}
