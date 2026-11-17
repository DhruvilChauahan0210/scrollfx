import { ChartPie } from '@/registry/ui/chart-pie';
import type { Pen } from './types';

function Pie(pen: Pen) {
  return <ChartPie {...pen} label="Visitors by browser" />;
}

function Donut(pen: Pen) {
  return (
    <ChartPie {...pen}
      data={[
        { plan: 'starter', seats: 1240 },
        { plan: 'team', seats: 860 },
        { plan: 'business', seats: 410 },
        { plan: 'enterprise', seats: 190 },
      ]}
      nameKey="plan"
      valueKey="seats"
      config={{ starter: { label: 'Starter' }, team: { label: 'Team' }, business: { label: 'Business' }, enterprise: { label: 'Enterprise' } }}
      variant="donut"
      totalLabel="Seats"
      label="Seats by plan"
    />
  );
}

export const examples = [
  { name: 'default', title: 'Pie', description: 'Each wedge is shaded by hatching of its own angle and density, the first in the accent, then the pen outlines them.', Component: Pie },
  { name: 'donut', title: 'Donut', description: 'variant="donut" opens the middle for the total, written in the server HTML.', Component: Donut },
];
