import { InkFrame } from '@/registry/ui/ink-frame';
import type { Example } from './types';

function Card({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted-foreground">{body}</p>
    </>
  );
}

export const examples: Example[] = [
  {
    name: 'default',
    title: 'Rect',
    description: 'The pen goes round twice, ink then accent, never quite on the same line.',
    Component: () => (
      <InkFrame className="max-w-md p-8">
        <Card eyebrow="Studio" title="For teams that ship weekly." body="Unlimited projects, shared plates, and a seat for everyone who reviews." />
      </InkFrame>
    ),
  },
  {
    name: 'rounded',
    title: 'Rounded',
    description: 'The same two passes with round corners, for softer cards.',
    Component: () => (
      <InkFrame variant="rounded" seed={4} className="max-w-md p-8">
        <Card eyebrow="Note" title="Seeded, so it never jumps." body="The same seed draws the same frame on every visit, and on the server and the client alike." />
      </InkFrame>
    ),
  },
  {
    name: 'double',
    title: 'Double',
    description: 'A finer frame in the accent pen just inside the first, as round a certificate.',
    Component: () => (
      <InkFrame variant="double" seed={7} className="max-w-md bg-card p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Awarded to</p>
        <p className="mt-4 font-serif text-4xl italic tracking-[-0.02em]">Okkara Labs</p>
        <p className="mt-4 text-[15px] text-muted-foreground">for the clearest changelog of the year</p>
      </InkFrame>
    ),
  },
  {
    name: 'corner-marks',
    title: 'Corner marks',
    description: 'Crop marks at the corners, as on a printer’s proof: for a figure, an image or a plate.',
    Component: () => (
      <figure className="max-w-md">
        <InkFrame variant="corner-marks" className="p-3">
          <div className="grid aspect-[4/3] place-items-center bg-card font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Your image here</div>
        </InkFrame>
        <figcaption className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fig. 1 — A plate, trimmed to the marks</figcaption>
      </figure>
    ),
  },
];
