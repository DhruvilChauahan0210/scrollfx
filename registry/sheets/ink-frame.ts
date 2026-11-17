import type { SheetSpec } from './types';

const frame = '[data-example] > div';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 3,
  view: 'max-w-md',
  details: [
    {
      example: 'default',
      prop: 'variant="rect"',
      callouts: [
        { prop: 'variant', note: 'rect', in: frame, at: [1, 0.3], side: 'right' },
        { prop: 'accent', note: 'second pass', in: frame, at: [0.995, 0.75], side: 'right' },
        { prop: 'children', note: 'any', in: frame, at: [0.06, 0.55], side: 'left', end: 'dot' },
      ],
    },
    { example: 'rounded', prop: 'variant="rounded"', callouts: [{ prop: 'variant', note: 'rounded', in: frame, at: [0.985, 0.04], side: 'right' }] },
    { example: 'double', prop: 'variant="double"', callouts: [{ prop: 'variant', note: 'double', in: frame, at: [0.97, 0.5], side: 'right' }] },
    { example: 'corner-marks', prop: 'variant="corner-marks"', callouts: [{ prop: 'variant', note: 'corner-marks', in: '[data-example] figure > div', at: [1, 0], side: 'right' }] },
  ],
};
