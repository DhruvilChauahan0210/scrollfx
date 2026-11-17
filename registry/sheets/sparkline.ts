import type { SheetSpec } from './types';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 3,
  details: [
    {
      example: 'default',
      prop: 'variant="area"',
      callouts: [
        { prop: 'variant', note: 'area', in: '[role=img]', at: [0.45, 0.85], side: 'left', end: 'dot' },
        { prop: 'color', note: 'line, dot', in: '.grid > div:last-child [role=img]', at: [0.97, 0.88], side: 'right' },
      ],
    },
    {
      example: 'table',
      prop: 'curve="linear"',
      callouts: [
        { prop: 'curve', note: 'linear', in: 'tbody tr:first-child [role=img]', at: [0.5, 0.5], side: 'right' },
        { prop: 'dot', note: 'last value', in: 'tbody tr:nth-child(2) [role=img]', at: [0.98, 0.1], side: 'right' },
      ],
    },
  ],
};
