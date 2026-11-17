import { InkHighlight } from '@/registry/ui/ink-highlight';
import type { Example } from './types';

const P = 'max-w-2xl text-pretty font-serif text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.3] tracking-[-0.015em]';

export const examples: Example[] = [
  {
    name: 'default',
    title: 'Underline',
    description: 'One stroke under the words, pressing in from the left and lifting at the end.',
    Component: () => (
      <p className={P}>
        Most sections sit still. This one is <InkHighlight>marked up as you read</InkHighlight>, the way a proof comes back from an editor.
      </p>
    ),
  },
  {
    name: 'double-underline',
    title: 'Double underline',
    description: 'A second, shorter stroke under the first, for the word that matters most.',
    Component: () => (
      <p className={P}>
        Ship it on Friday, but <InkHighlight variant="double-underline">only if the tests pass</InkHighlight>.
      </p>
    ),
  },
  {
    name: 'circle',
    title: 'Circle',
    description: 'A loop round the words, a little more than one turn, its end passing outside its start.',
    Component: () => (
      <p className={P}>
        Three plans, and most teams start on <InkHighlight variant="circle" seed={4}>Studio</InkHighlight>.
      </p>
    ),
  },
  {
    name: 'box',
    title: 'Box',
    description: 'Four strokes ruled round the words, one after another, crossing at the corners.',
    Component: () => (
      <p className={P}>
        Every chart opens into <InkHighlight variant="box" seed={3}>the rows behind it</InkHighlight>, and every row into the event that made it.
      </p>
    ),
  },
  {
    name: 'strike',
    title: 'Strike',
    description: 'A line struck through, for a price that changed or a claim withdrawn. Rendered as <s>.',
    Component: () => (
      <p className={P}>
        Plans from <InkHighlight variant="strike">$24</InkHighlight> $18 a month, billed yearly.
      </p>
    ),
  },
  {
    name: 'hatch-fill',
    title: 'Hatch fill',
    description: 'Diagonal hatching behind the lower half of the letters, plotted left to right.',
    Component: () => (
      <p className={P}>
        Drawings are made in the browser; <InkHighlight variant="hatch-fill">the words stay in the HTML</InkHighlight>, for search and for screen readers.
      </p>
    ),
  },
  {
    name: 'wrapping',
    title: 'Across lines',
    description: 'A phrase that wraps gets a mark for each line it takes, drawn one after the other as each line reaches the middle of the screen.',
    Component: () => (
      <p className="max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground">
        The marks are measured to the words and made again when the layout changes, so{' '}
        <InkHighlight variant="underline" seed={9} className="text-foreground">a phrase that breaks over two or three lines in a narrow column</InkHighlight>{' '}
        is underlined on each of them, and{' '}
        <InkHighlight variant="hatch-fill" seed={2} className="text-foreground">hatching follows it round the line break</InkHighlight> too.
      </p>
    ),
  },
];
