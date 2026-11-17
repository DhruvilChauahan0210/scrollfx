import registry from '@/registry.json';

/**
 * Every component (each registry:ui item), read from registry.json: one list
 * for the CLI and the site, as lib/blocks.ts is for the blocks.
 *
 * A component's family is `meta.family` if it sets one; otherwise the title of
 * the family library it depends on (charts depend on lib/chart, titled
 * "Charts"); otherwise "Components". Families keep the order they first
 * appear in registry.json.
 */
export interface Component {
  slug: string;
  name: string;
  description: string;
  family: string;
  /** The registry:lib items it installs with it, besides itself. */
  libs: string[];
}

type Item = (typeof registry.items)[number] & { meta?: { family?: string } };
const items = registry.items as Item[];
const libs = new Map(items.filter((i) => i.type === 'registry:lib').map((i) => [i.name, i.title]));
const depName = (url: string) => url.replace(/^.*\//, '').replace(/\.json$/, '');

export const COMPONENTS: Component[] = items.filter((i) => i.type === 'registry:ui').map((i) => {
  const deps = (i.registryDependencies ?? []).map(depName);
  const family = i.meta?.family ?? deps.filter((d) => d !== 'plotter' && libs.has(d)).map((d) => libs.get(d)!)[0] ?? 'Components';
  return { slug: i.name, name: i.title, description: i.description, family, libs: deps.filter((d) => libs.has(d)) };
});

export const FAMILIES: { name: string; components: Component[] }[] = [...new Set(COMPONENTS.map((c) => c.family))].map((name) => ({
  name,
  components: COMPONENTS.filter((c) => c.family === name),
}));

export const getComponent = (slug: string) => COMPONENTS.find((c) => c.slug === slug);
