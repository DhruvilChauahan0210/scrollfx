import type { SheetSpec } from './types';

const arrow = '[data-example] svg[data-ink]';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 2,
  view: 'w-fit',
  details: [
    {
      example: 'default',
      prop: 'variant="curved"',
      callouts: [
        { prop: 'from', in: arrow, at: [0.06, 0.3], side: 'left', end: 'dot' },
        { prop: 'bend', note: '0.3', in: arrow, at: [0.5, 0.35], side: 'left' },
      ],
      dimensions: [
        { prop: 'width', note: '160', in: arrow, axis: 'x' },
        { prop: 'height', note: '96', in: arrow, axis: 'y', side: 'right' },
      ],
    },
    { example: 'straight', prop: 'variant="straight"', callouts: [{ prop: 'variant', note: 'straight', in: arrow, at: [0.5, 0.5], side: 'left' }] },
    { example: 'looped', prop: 'variant="looped"', callouts: [{ prop: 'variant', note: 'looped', in: arrow, at: [0.5, 0.4], side: 'left' }] },
  ],
};
