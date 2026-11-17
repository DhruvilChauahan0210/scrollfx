import type { SheetSpec } from './types';

// Default data: Jan–Jun, 186 to 305 orders, on a 0–400 axis; bar i is centred at (i + 0.5)/6
// and is 0.6 of its band wide.
const plot = '[data-slot=plot]';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 2,
  details: [
    {
      example: 'default',
      prop: 'defaults',
      callouts: [
        { prop: 'accent', note: 'the outlines', in: plot, at: [1.5 / 6 + 0.05, 1 - 305 / 400], side: 'right' },
        { prop: 'data', note: '6 rows', in: plot, at: [5.5 / 6, 0.6], side: 'right', end: 'dot' },
        { prop: 'orientation', note: 'vertical', in: plot, at: [4.5 / 6 + 0.05, 1 - 209 / 400 / 2], side: 'right' },
        { prop: 'index', note: 'month', in: '[data-slot=x-labels]', at: [5.5 / 6 + 0.04, 0.5], side: 'right' },
      ],
      dimensions: [{ prop: 'height', note: '240', in: plot, axis: 'y', side: 'left' }],
    },
    {
      example: 'horizontal',
      prop: 'orientation="horizontal"',
      callouts: [
        { prop: 'orientation', note: 'horizontal', in: plot, at: [412 / 500, 0.1], side: 'right' },
        { prop: 'data', note: '5 rows', in: plot, at: [0.1, 0.9], side: 'right', end: 'dot' },
      ],
      dimensions: [{ prop: 'height', note: 'a row a bar', in: plot, axis: 'y', side: 'left' }],
    },
    {
      example: 'grouped',
      prop: 'config={…2 series}',
      callouts: [
        { prop: 'config', note: '2 series', in: '[data-slot=legend]', at: [0, 0.5], side: 'left' },
        { prop: 'accent', note: 'first series', in: plot, at: [0.83, 1 - 230 / 400], side: 'right' },
      ],
    },
    {
      example: 'stacked',
      prop: 'stacked',
      callouts: [{ prop: 'stacked', note: 'one on another', in: plot, at: [0.875 + 0.075, 1 - 230 / 600], side: 'right' }],
    },
  ],
};
