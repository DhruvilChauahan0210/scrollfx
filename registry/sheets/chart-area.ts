import type { SheetSpec } from './types';

// Default data: Jan–Dec, 1.2 to 4.6, on a 0–5 axis; point i at i/11 across.
const plot = '[data-slot=plot]';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 2,
  details: [
    {
      example: 'default',
      prop: 'defaults',
      callouts: [
        { prop: 'accent', note: 'the curve', in: plot, at: [10 / 11, 1 - 4.2 / 5], side: 'right' },
        { prop: 'curve', note: 'smooth', in: plot, at: [8 / 11, 1 - 3.4 / 5], side: 'right' },
        { prop: 'data', note: '12 rows', in: plot, at: [0.82, 0.8], side: 'right', end: 'dot' },
        { prop: 'index', note: 'month', in: '[data-slot=x-labels]', at: [1.01, 0.5], side: 'right' },
      ],
      dimensions: [{ prop: 'height', note: '240', in: plot, axis: 'y', side: 'left' }],
    },
    {
      example: 'stacked',
      prop: 'stacked',
      callouts: [
        { prop: 'stacked', note: 'web on api', in: plot, at: [0.75, 0.32], side: 'right', end: 'dot' },
        { prop: 'config', note: '3 series', in: '[data-slot=legend] li:last-child', at: [1.04, 0.5], side: 'right' },
      ],
    },
  ],
};
