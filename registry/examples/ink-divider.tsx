import { InkDivider } from '@/registry/ui/ink-divider';
import type { Example } from './types';

/** A divider between two short paragraphs, as it sits on a page. */
function Between({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
      <p>Events arrive from forty regions and land on one screen in under a second, already joined.</p>
      <div className="my-8 text-foreground">{children}</div>
      <p>Every chart opens into the rows behind it. Nothing is summarised away.</p>
    </div>
  );
}

export const examples: Example[] = [
  { name: 'default', title: 'Straight', description: 'One rule, as a hand draws it with a ruler: almost straight.', Component: (pen) => <Between><InkDivider {...pen} /></Between> },
  { name: 'wavy', title: 'Wavy', description: 'A wave whose swing rises and falls a little along the way.', Component: (pen) => <Between><InkDivider {...pen} variant="wavy" seed={3} /></Between> },
  { name: 'sketchy', title: 'Sketchy', description: 'Ruled twice, never quite on the same line: ink, then the accent pen.', Component: (pen) => <Between><InkDivider {...pen} variant="sketchy" seed={5} /></Between> },
  { name: 'dotted', title: 'Dotted', description: 'A dot every few pixels, set down one after another, left to right.', Component: (pen) => <Between><InkDivider {...pen} variant="dotted" /></Between> },
  { name: 'with-label', title: 'With a label', description: 'Two rules drawn outward from a label in the middle; the label is plain text.', Component: (pen) => <Between><InkDivider {...pen} variant="with-label" label="Chapter two" /></Between> },
];
