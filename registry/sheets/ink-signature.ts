import type { SheetSpec } from './types';

const sig = '[role=img]';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 3,
  view: 'max-w-md',
  details: [
    {
      example: 'default',
      prop: 'name="Ada Marlow"',
      callouts: [
        { prop: 'name', note: 'Hershey script', in: sig, at: [0.3, 0.3], side: 'left' },
        { prop: 'flourish', in: sig, at: [0.8, 0.92], side: 'right' },
      ],
    },
    { example: 'in-view', prop: 'trigger="view"', callouts: [{ prop: 'trigger', note: 'view', in: sig, at: [0.9, 0.4], side: 'right' }] },
    { example: 'custom', prop: 'paths={…}', callouts: [{ prop: 'paths', note: '8 strokes', in: sig, at: [0.5, 0.5], side: 'right' }] },
  ],
};
