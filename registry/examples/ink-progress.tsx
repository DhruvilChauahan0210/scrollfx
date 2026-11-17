import { InkProgress } from '@/registry/ui/ink-progress';
import type { Example } from './types';

export const examples: Example[] = [
  {
    name: 'default',
    title: 'Bar',
    description: 'An outline and a scale, then the fill hatched in from the left, stopping at the value.',
    Component: () => (
      <div className="max-w-xl space-y-10">
        <InkProgress value={64} label="Storage used" />
        <InkProgress value={28} label="Monthly events" seed={5} />
      </div>
    ),
  },
  {
    name: 'ring',
    title: 'Ring',
    description: 'A ring drawn once in ink, then a band of three arcs in the accent pen from the top, clockwise, out to the value.',
    Component: () => (
      <div className="flex flex-wrap gap-14">
        <InkProgress variant="ring" value={72} label="Onboarding" />
        <InkProgress variant="ring" value={3} max={5} label="Steps done" display="value" suffix="/5" />
      </div>
    ),
  },
  {
    name: 'gauge',
    title: 'Gauge',
    description: 'An instrument face ticked clockwise, an accent band out to the value and a needle on it.',
    Component: () => (
      <div className="flex flex-wrap gap-14">
        <InkProgress variant="gauge" value={38} label="CPU" size={144} />
        <InkProgress variant="gauge" value={91} label="Uptime target" size={144} />
      </div>
    ),
  },
];
