import { InkSignature } from '@/registry/ui/ink-signature';
import type { Example } from './types';

export const examples: Example[] = [
  {
    name: 'default',
    title: 'Name',
    description: 'A name in Hershey’s script, written in order at one steady speed, then underlined with a flourish.',
    Component: () => (
      <figure className="max-w-md">
        <blockquote className="font-serif text-2xl leading-snug tracking-[-0.015em]">“We stopped animating our pages. Now the pen does it, and only when someone is reading.”</blockquote>
        <figcaption className="mt-6">
          <InkSignature name="Ada Marlow" />
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Ada Marlow · Founder, Okkara</p>
        </figcaption>
      </figure>
    ),
  },
  {
    name: 'in-view',
    title: 'Written on arrival',
    description: 'With trigger="view" the name is written once, over `duration` ms, as it comes into view, rather than with the scroll.',
    Component: () => <InkSignature name="With thanks, Tom" size={48} trigger="view" duration={2400} seed={3} />,
  },
  {
    name: 'custom',
    title: 'Your own signature',
    description: 'Pass SVG path data, one string per stroke in writing order, and the viewBox they sit in.',
    Component: () => (
      <InkSignature
        name="J. Okafor"
        viewBox="0 0 300 120"
        paths={[
          'M58 20C66 34 70 58 64 78C58 98 34 100 28 86C24 76 40 70 56 74',
          'M80 84L81 85',
          'M118 46C100 44 92 68 104 80C116 92 136 78 134 60C132 46 120 42 110 50',
          'M146 36C149 56 149 72 146 88',
          'M147 72C155 62 163 60 161 69C159 77 151 77 155 81C161 87 169 79 173 71C175 65 181 63 181 71C181 79 189 81 193 71C197 60 195 48 192 40',
          'M187 64L201 62',
          'M200 80C204 70 212 68 216 74C218 80 210 84 208 78C214 82 222 72 228 68C232 66 236 68 238 72',
          'M30 102C110 94 200 92 272 72',
        ]}
      />
    ),
  },
];
