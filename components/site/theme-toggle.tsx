'use client';

import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
    // The previews are their own documents: tell them too.
    document.querySelectorAll('iframe').forEach((f) => f.contentDocument?.documentElement.classList.toggle('dark', dark));
  };
  return (
    <button type="button" onClick={toggle} aria-label="Toggle dark mode" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent">
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  );
}
