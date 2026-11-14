/** Where the site and its registry live. Change it if the Vercel project gets another domain. */
export const SITE_URL = 'https://scrollfx.vercel.app';
export const REPO = 'https://github.com/DhruvilChauahan0210/scrollfx';
export const LIB = 'https://svg-scroll-draw.vercel.app';
export const installCommand = (slug: string) => `npx shadcn@latest add ${SITE_URL}/r/${slug}.json`;
