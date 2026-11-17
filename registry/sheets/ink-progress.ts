import type { SheetSpec } from './types';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 2,
  view: 'max-w-xl',
  details: [
    {
      example: 'default',
      prop: 'variant="bar"',
      callouts: [
        { prop: 'label', in: '[role=progressbar] span', at: [0, 0.5], side: 'left' },
        { prop: 'value', note: '64', in: '[role=progressbar] .relative', at: [0.64, 0.5], side: 'right' },
        { prop: 'showValue', in: '[role=progressbar] .font-serif', at: [1, 0.5], side: 'right' },
      ],
    },
    {
      example: 'ring',
      prop: 'variant="ring"',
      callouts: [{ prop: 'variant', note: 'ring', in: '[role=progressbar] .relative', at: [0.95, 0.3], side: 'right' }],
      dimensions: [{ prop: 'size', note: '128', in: '[role=progressbar] .relative', axis: 'y', side: 'left' }],
    },
    {
      example: 'gauge',
      prop: 'variant="gauge"',
      callouts: [{ prop: 'variant', note: 'gauge', in: '[role=progressbar] .relative', at: [0.5, 0.05], side: 'left' }],
    },
  ],
};
