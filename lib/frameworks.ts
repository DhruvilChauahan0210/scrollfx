/**
 * The frameworks a component ships in. React is every component's first; the
 * Vue and Svelte versions (registry/vue/<name>.vue, registry/svelte/<name>.svelte)
 * are published by scripts/build-framework-registries.mjs. Plain data, for the
 * server pages and the sheet's picker alike.
 */
export type Framework = 'react' | 'vue' | 'svelte';

export const FRAMEWORKS: Framework[] = ['react', 'vue', 'svelte'];

export const FRAMEWORK_LABEL: Record<Framework, string> = { react: 'React', vue: 'Vue', svelte: 'Svelte' };

/** The language the source is highlighted as. */
export const FRAMEWORK_LANG = { react: 'tsx', vue: 'vue', svelte: 'svelte' } as const;
