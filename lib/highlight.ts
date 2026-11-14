import { codeToHtml } from 'shiki';

/** Server-side highlighting, light and dark in one pass (see globals.css). */
export function highlight(code: string, lang: 'tsx' | 'bash' = 'tsx') {
  return codeToHtml(code, { lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: 'light' });
}
