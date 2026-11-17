import { ChartLine } from '@/registry/ui/chart-line';

function Single() {
  return <ChartLine label="Visitors a month, January to December" />;
}

function MultiSeries() {
  return (
    <ChartLine
      data={[
        { month: 'January', desktop: 186, mobile: 80 },
        { month: 'February', desktop: 305, mobile: 200 },
        { month: 'March', desktop: 237, mobile: 120 },
        { month: 'April', desktop: 73, mobile: 190 },
        { month: 'May', desktop: 209, mobile: 130 },
        { month: 'June', desktop: 214, mobile: 140 },
      ]}
      index="month"
      config={{ desktop: { label: 'Desktop' }, mobile: { label: 'Mobile' } }}
      label="Desktop and mobile visitors, January to June"
    />
  );
}

function Stepped() {
  return (
    <ChartLine
      data={[
        { week: 'W1', seats: 12 }, { week: 'W2', seats: 12 }, { week: 'W3', seats: 18 }, { week: 'W4', seats: 18 },
        { week: 'W5', seats: 25 }, { week: 'W6', seats: 31 }, { week: 'W7', seats: 31 }, { week: 'W8', seats: 40 },
      ]}
      index="week"
      config={{ seats: { label: 'Seats' } }}
      curve="step"
      height={200}
      label="Paid seats by week"
    />
  );
}

export const examples = [
  { name: 'default', title: 'Single series', description: 'One series, a smooth monotone curve that never overshoots its points.', Component: Single },
  { name: 'multi-series', title: 'Multiple series', description: 'Each series takes its own pen and its own marker: the first the accent and circles, the next the ink and squares.', Component: MultiSeries },
  { name: 'stepped', title: 'Stepped', description: 'curve="step" for values that change in jumps: seats, prices, plan limits.', Component: Stepped },
];
