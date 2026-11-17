import type { SheetSpec } from './types';

const rule = '[role=separator]';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 3,
  view: 'max-w-2xl',
  details: [
    {
      example: 'default',
      prop: 'variant="straight"',
      callouts: [
        { prop: 'variant', note: 'straight', in: rule, at: [0.12, 0.5], side: 'left' },
        { prop: 'color', note: 'ink', in: rule, at: [0.82, 0.5], side: 'right' },
      ],
      dimensions: [],
    },
    { example: 'wavy', prop: 'variant="wavy"', callouts: [{ prop: 'variant', note: 'wavy', in: rule, at: [0.88, 0.5], side: 'right' }] },
    { example: 'sketchy', prop: 'variant="sketchy"', callouts: [{ prop: 'accent', note: 'second pass', in: rule, at: [0.85, 0.6], side: 'right' }] },
    { example: 'dotted', prop: 'variant="dotted"', callouts: [{ prop: 'variant', note: 'dotted', in: rule, at: [0.88, 0.5], side: 'right' }] },
    { example: 'with-label', prop: 'variant="with-label"', callouts: [{ prop: 'label', note: 'plain text', in: `${rule} > span`, at: [0.5, 1.4], side: 'right' }] },
  ],
};
