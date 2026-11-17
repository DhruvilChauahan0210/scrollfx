import type { SheetSpec } from './types';

// The words marked are the <mark> (or <s>) the component renders; anchors are fractions of it.
const words = 'mark, s';

export const sheet: SheetSpec = {
  shape: 'box',
  scale: 3,
  view: 'max-w-2xl',
  details: [
    {
      example: 'default',
      prop: 'variant="underline"',
      callouts: [
        // Over the line to the words, and along the line's end to the underline: neither leader crosses a word.
        { prop: 'children', note: 'the words', in: words, line: 0, at: [0.55, 0.2], side: 'right', end: 'dot', via: [{ in: words, line: 0, at: [0.55, -0.55] }], phone: { at: [1.02, 0.45] } },
        { prop: 'variant', note: 'underline', in: words, line: 0, at: [1.005, 1.08], side: 'right' },
      ],
    },
    { example: 'double-underline', prop: 'variant="double-underline"', callouts: [{ prop: 'variant', note: 'double-underline', in: words, at: [0.8, 1.2], side: 'right' }] },
    { example: 'circle', prop: 'variant="circle"', callouts: [{ prop: 'variant', note: 'circle', in: words, at: [1.08, 0.2], side: 'right' }] },
    { example: 'box', prop: 'variant="box"', callouts: [{ prop: 'variant', note: 'box', in: words, at: [1.02, 0.5], side: 'right' }] },
    { example: 'strike', prop: 'variant="strike"', callouts: [{ prop: 'variant', note: 'strike', in: words, at: [0.9, 0.55], side: 'left' }] },
    { example: 'hatch-fill', prop: 'variant="hatch-fill"', callouts: [{ prop: 'variant', note: 'hatch-fill', in: words, at: [0.6, 0.75], side: 'right', end: 'dot' }] },
    { example: 'wrapping', prop: 'across lines', callouts: [{ prop: 'seed', note: 'shapes each mark', in: words, at: [0.4, 1], side: 'right' }] },
  ],
};
