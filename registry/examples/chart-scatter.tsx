import { ChartScatter } from '@/registry/ui/chart-scatter';
import type { Pen } from './types';

function Groups(pen: Pen) {
  return <ChartScatter {...pen} label="Hours saved against seats, by plan" />;
}

function Trend(pen: Pen) {
  return (
    <ChartScatter {...pen}
      data={[
        { temp: 14, sales: 215 }, { temp: 16, sales: 325 }, { temp: 12, sales: 185 }, { temp: 19, sales: 412 },
        { temp: 21, sales: 522 }, { temp: 18, sales: 445 }, { temp: 23, sales: 544 }, { temp: 22, sales: 614 },
        { temp: 25, sales: 590 }, { temp: 17, sales: 421 }, { temp: 13, sales: 240 }, { temp: 20, sales: 470 },
        { temp: 24, sales: 640 }, { temp: 15, sales: 300 }, { temp: 26, sales: 680 }, { temp: 11, sales: 170 },
      ]}
      x="temp"
      y="sales"
      xLabel="Temperature, °C"
      yLabel="Ice creams sold"
      trend
      label="Ice creams sold against the day's temperature, with a fitted trend line"
    />
  );
}

export const examples = [
  { name: 'default', title: 'Groups', description: 'group splits the points into series, each its own mark: accent circles, then ink squares.', Component: Groups },
  { name: 'trend', title: 'With a trend line', description: 'trend fits a least-squares line through each group, drawn last, once the points are down.', Component: Trend },
];
