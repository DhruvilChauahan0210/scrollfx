import type { SheetSpec } from './types';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 3,
  details: [
    {
      example: 'default',
      prop: 'variant="area"',
      callouts: [
        // Round the first card, not across its figure: under it, up the gap beside it, then in to the hatching.
        {
          prop: 'variant',
          note: 'area',
          in: '.grid > div:first-child [role=img]',
          at: [0.9, 0.8],
          side: 'left',
          end: 'dot',
          via: [
            { in: '.grid > div:first-child', at: [1.035, 1.2] },
            { in: '.grid > div:first-child', at: [1.035, 'anchor'] },
          ],
        },
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
