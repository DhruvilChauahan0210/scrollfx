import type { SheetSpec } from './types';

const stamp = '[data-example] > span';

export const sheet: SheetSpec = {
  shape: 'circle',
  scale: 2,
  view: 'w-fit',
  details: [
    {
      example: 'default',
      prop: 'variant="circle"',
      callouts: [
        { prop: 'rim', note: 'round the band', in: stamp, at: [0.2, 0.2], side: 'left' },
        { prop: 'children', note: 'the word', in: stamp, at: [0.5, 0.5], side: 'right', end: 'dot' },
        { prop: 'rotate', note: '−8°', in: stamp, at: [0.93, 0.62], side: 'right' },
      ],
      dimensions: [{ prop: 'size', note: '148', in: stamp, axis: 'x' }],
    },
    { example: 'rectangle', prop: 'variant="rectangle"', callouts: [{ prop: 'variant', note: 'rectangle', in: '[data-example] span', at: [1, 0.5], side: 'right' }] },
    { example: 'seal', prop: 'variant="seal"', callouts: [{ prop: 'variant', note: 'seal', in: stamp, at: [0.97, 0.4], side: 'right' }] },
  ],
};
