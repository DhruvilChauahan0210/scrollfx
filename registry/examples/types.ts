import type React from 'react';

/**
 * What the drawing office passes an example: the pen the reader picked and,
 * when it re-plots one, `view` so it plays in front of them. An example hands
 * these to its components; its code on the site is shown without them.
 */
export type Pen = { accent?: string; trigger?: 'scroll' | 'view' };

/** One example of a component, as its sheet shows it: one per variant worth seeing. */
export type Example = { name: string; title: string; description?: string; Component: React.ComponentType<Pen> };
