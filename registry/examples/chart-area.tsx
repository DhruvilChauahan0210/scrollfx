import { ChartArea } from '@/registry/ui/chart-area';

function Single() {
  return <ChartArea format={{ maximumFractionDigits: 0, minimumFractionDigits: 0 }} label="Events a day, millions, January to December" />;
}

function Stacked() {
  return (
    <ChartArea
      data={[
        { month: 'Jan', api: 420, web: 310, mobile: 180 },
        { month: 'Feb', api: 460, web: 340, mobile: 200 },
        { month: 'Mar', api: 510, web: 330, mobile: 260 },
        { month: 'Apr', api: 580, web: 390, mobile: 290 },
        { month: 'May', api: 640, web: 420, mobile: 340 },
        { month: 'Jun', api: 700, web: 470, mobile: 410 },
      ]}
      index="month"
      config={{ api: { label: 'API' }, web: { label: 'Web' }, mobile: { label: 'Mobile' } }}
      stacked
      label="Requests by client, thousands, stacked, January to June"
    />
  );
}

export const examples = [
  { name: 'default', title: 'Single series', description: 'The area under the curve is hatched upright, left to right, then the curve is drawn over it in the accent.', Component: Single },
  { name: 'stacked', title: 'Stacked', description: 'stacked puts each series on the one below. Each band takes its own hatch, so they read apart without colour.', Component: Stacked },
];
