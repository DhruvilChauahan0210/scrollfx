'use client';

import { useSyncExternalStore } from 'react';
import { FRAMEWORKS, type Framework } from '@/lib/frameworks';

/**
 * The framework the reader reads the sheets in: one choice for every sheet on
 * the page, remembered in this browser where it can be. The server, and the
 * first render after it, read React, so the page hydrates as it was served.
 */
const KEY = 'scrollfx:framework';
const listeners = new Set<() => void>();
let current: Framework | null = null;

function read(): Framework {
  if (current) return current;
  try {
    const saved = localStorage.getItem(KEY) as Framework | null;
    current = saved && FRAMEWORKS.includes(saved) ? saved : 'react';
  } catch {
    current = 'react';
  }
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setFramework(fw: Framework) {
  current = fw;
  try { localStorage.setItem(KEY, fw); } catch {}
  listeners.forEach((l) => l());
}

export const useFramework = () => useSyncExternalStore(subscribe, read, () => 'react' as Framework);
