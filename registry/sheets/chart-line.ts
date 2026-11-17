import type { SheetSpec } from './types';

// Default data: Jan–Dec, 1,240 to 4,320 visitors, on a 0–5K axis; point i sits at i/11 across the plot.
const plot = '[data-slot=plot]';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 2,
  details: [
    {
      example: 'default',
      prop: 'defaults',
      callouts: [
        { prop: 'data', note: '12 rows', in: plot, at: [1, 1 - 4320 / 5000], side: 'right', end: 'dot' },
        { prop: 'accent', note: 'the line', in: plot, at: [7 / 11, 1 - 3120 / 5000], side: 'right' },
        { prop: 'curve', note: 'smooth', in: plot, at: [9.5 / 11, 1 - 3700 / 5000], side: 'right' },
        { prop: 'zero', note: 'axis from 0', in: plot, at: [0.97, 1], side: 'right' },
        { prop: 'index', note: 'month', in: '[data-slot=x-labels]', at: [1.01, 0.5], side: 'right' },
      ],
      dimensions: [{ prop: 'height', note: '240', in: plot, axis: 'y', side: 'left' }],
    },
    {
      example: 'multi-series',
      prop: 'config={…2 series}',
      callouts: [
        { prop: 'accent', note: 'first series', in: plot, at: [1, 1 - 214 / 400], side: 'right', end: 'dot' },
        { prop: 'markers', note: 'square, 2nd', in: plot, at: [0.6, 1 - 190 / 400], side: 'right' },
        { prop: 'config', note: 'labels', in: '[data-slot=legend] li:last-child', at: [1.04, 0.5], side: 'right' },
      ],
    },
    {
      example: 'stepped',
      prop: 'curve="step"',
      callouts: [
        { prop: 'data', note: '8 rows', in: plot, at: [1, 0], side: 'right', end: 'dot' },
        { prop: 'curve', note: 'step', in: plot, at: [4.5 / 7, 1 - 28 / 40], side: 'right' },
      ],
      dimensions: [{ prop: 'height', note: '200', in: plot, axis: 'y', side: 'left' }],
    },
  ],
};
