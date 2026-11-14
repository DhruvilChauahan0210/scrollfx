import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Fraunces } from 'next/font/google';
import './globals.css';

const serif = Fraunces({ style: ['normal', 'italic'], axes: ['opsz', 'SOFT'], subsets: ['latin'], variable: '--font-fraunces' });

export const metadata: Metadata = {
  metadataBase: new URL('https://scrollfx.vercel.app'),
  title: { default: 'scrollfx — plotted sections for React', template: '%s · scrollfx' },
  description: 'Generative, scroll-drawn sections for React and Tailwind: flow fields, contour maps, hatched charts and more, plotted stroke by stroke as the reader scrolls. Install with the shadcn CLI. Built on svg-scroll-draw.',
};

// The theme follows the system until the page says otherwise (?theme=dark|light).
// A preview inside the site's iframe takes the page around it.
const THEME = `(() => { try {
  const q = new URLSearchParams(location.search).get('theme');
  const host = window.self !== window.top ? (window.parent.document.documentElement.classList.contains('dark') ? 'dark' : 'light') : null;
  const t = q || host || localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', t === 'dark');
} catch {} })();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
