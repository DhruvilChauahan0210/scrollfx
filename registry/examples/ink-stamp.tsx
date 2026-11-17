import { InkStamp } from '@/registry/ui/ink-stamp';
import type { Example } from './types';

export const examples: Example[] = [
  {
    name: 'default',
    title: 'Circle',
    description: 'Two rings round the rim and one inside, with a line of text set round the band between them.',
    Component: (pen) => <InkStamp {...pen} rim="Quality checked · Batch 07 · 2026 ·">Approved</InkStamp>,
  },
  {
    name: 'rectangle',
    title: 'Rectangle',
    description: 'Ruled twice round the words, then once more, finer, inside; it sizes to them.',
    Component: (pen) => (
      <div className="flex flex-wrap items-center gap-10">
        <InkStamp {...pen} variant="rectangle">Draft</InkStamp>
        <InkStamp {...pen} variant="rectangle" rotate={4} seed={8}>Paid in full</InkStamp>
      </div>
    ),
  },
  {
    name: 'seal',
    title: 'Seal',
    description: 'A scalloped edge, a ring and a dotted ring inside, for a guarantee or a first edition.',
    Component: (pen) => <InkStamp {...pen} variant="seal" rim="First edition · Plotted by hand ·" rotate={6} size={164}>Est. 2026</InkStamp>,
  },
];
