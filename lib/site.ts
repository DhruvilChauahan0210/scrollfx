/** Where the site and its registry live. Change it if the Vercel project gets another domain. */
export const SITE_URL = 'https://scrollfx-ui.vercel.app';
export const REPO = 'https://github.com/DhruvilChauahan0210/scrollfx';
export const LIB = 'https://svg-scroll-draw.vercel.app';
export const installCommand = (slug: string) => `npx shadcn@latest add ${SITE_URL}/r/${slug}.json`;
export const vueInstallCommand = (slug: string) => `npx shadcn-vue@latest add ${SITE_URL}/r/vue/${slug}.json`;
export const svelteInstallCommand = (slug: string) => `npx shadcn-svelte@latest add ${SITE_URL}/r/svelte/${slug}.json`;

/** The install line for a block or component in each framework's CLI. */
export const installCommands = (slug: string) => ({ react: installCommand(slug), vue: vueInstallCommand(slug), svelte: svelteInstallCommand(slug) });
