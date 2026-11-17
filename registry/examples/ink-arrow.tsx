import { InkArrow } from '@/registry/ui/ink-arrow';
import type { Example } from './types';

const Note = ({ children }: { children: React.ReactNode }) => <span className="font-serif text-xl italic tracking-[-0.01em] text-muted-foreground">{children}</span>;
const Button = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background">{children}</span>
);

export const examples: Example[] = [
  {
    name: 'default',
    title: 'Curved',
    description: 'A curve bending to one side, from a note to what it is about.',
    Component: (pen) => (
      <div className="flex items-end gap-2">
        <div className="pb-20"><Note>start here</Note></div>
        <InkArrow {...pen} className="mb-2" />
        <Button>Get started</Button>
      </div>
    ),
  },
  {
    name: 'straight',
    title: 'Straight',
    description: 'Nearly straight, as a hand draws one without a ruler.',
    Component: (pen) => (
      <div className="flex items-center gap-3">
        <Note>the price drops here</Note>
        <InkArrow {...pen} variant="straight" width={140} height={30} from={[0.04, 0.5]} to={[0.94, 0.5]} seed={2} />
        <span className="font-serif text-4xl tracking-[-0.03em]">$18</span>
      </div>
    ),
  },
  {
    name: 'looped',
    title: 'Looped',
    description: 'A loop thrown half way, for a note that wants to be noticed.',
    Component: (pen) => (
      <div className="flex items-start gap-1">
        <div className="pt-1"><Note>new this week</Note></div>
        <InkArrow {...pen} variant="looped" width={200} height={120} from={[0.04, 0.12]} to={[0.94, 0.86]} bend={-0.25} seed={5} />
        <div className="self-end"><Button>Plotted charts</Button></div>
      </div>
    ),
  },
];
