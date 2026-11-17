import { ChartRadar } from '@/registry/ui/chart-radar';
import type { Pen } from './types';

function Single(pen: Pen) {
  return <ChartRadar {...pen} label="Scores by skill, out of 100" />;
}

function Compare(pen: Pen) {
  return (
    <ChartRadar {...pen}
      data={[
        { metric: 'Speed', v1: 62, v2: 88 },
        { metric: 'Size', v1: 80, v2: 70 },
        { metric: 'Docs', v1: 55, v2: 84 },
        { metric: 'Types', v1: 70, v2: 92 },
        { metric: 'Tests', v1: 48, v2: 76 },
      ]}
      index="metric"
      config={{ v2: { label: 'Version 2' }, v1: { label: 'Version 1' } }}
      max={100}
      grid="circle"
      label="Version 1 and version 2 compared on five measures, out of 100"
    />
  );
}

export const examples = [
  { name: 'default', title: 'Single series', description: 'The web first, then the shape hatched in and outlined in the accent, a dot on every reading.', Component: Single },
  { name: 'compare', title: 'Two series, round grid', description: 'A second series in ink with its own hatch and markers; grid="circle" draws the rings round.', Component: Compare },
];
