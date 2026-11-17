import type { SheetSpec } from './types';

const plot = '[data-slot=plot]';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 2,
  details: [
    {
      example: 'default',
      prop: 'group="plan"',
      callouts: [
        { prop: 'yLabel', in: 'figure [data-slot=y-title]', at: [0, 0.5], side: 'left' },
        { prop: 'group', note: 'plan', in: '[data-slot=legend]', at: [0, 0.5], side: 'left' },
        { prop: 'xLabel', in: 'figure [data-slot=x-title]', at: [1, 0.5], side: 'right' },
      ],
      dimensions: [{ prop: 'height', note: '260', in: plot, axis: 'y', side: 'right' }],
    },
    {
      example: 'trend',
      prop: 'trend',
      callouts: [{ prop: 'trend', note: 'least squares', in: plot, at: [0.8, 0.3], side: 'right' }],
    },
  ],
};
