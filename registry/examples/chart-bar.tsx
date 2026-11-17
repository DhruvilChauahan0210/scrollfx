import { ChartBar } from '@/registry/ui/chart-bar';
import type { Pen } from './types';

const QUARTERS = [
  { quarter: 'Q1', new: 120, returning: 210 },
  { quarter: 'Q2', new: 180, returning: 240 },
  { quarter: 'Q3', new: 160, returning: 300 },
  { quarter: 'Q4', new: 230, returning: 330 },
];

function Vertical(pen: Pen) {
  return <ChartBar {...pen} label="Orders a month, January to June" />;
}

function Horizontal(pen: Pen) {
  return (
    <ChartBar {...pen}
      data={[
        { lang: 'TypeScript', repos: 412 },
        { lang: 'Python', repos: 356 },
        { lang: 'Go', repos: 198 },
        { lang: 'Rust', repos: 164 },
        { lang: 'Ruby', repos: 88 },
      ]}
      index="lang"
      config={{ repos: { label: 'Repositories' } }}
      orientation="horizontal"
      label="Repositories by language"
    />
  );
}

function Grouped(pen: Pen) {
  return (
    <ChartBar {...pen}
      data={QUARTERS}
      index="quarter"
      config={{ new: { label: 'New' }, returning: { label: 'Returning' } }}
      label="New and returning customers by quarter"
    />
  );
}

function Stacked(pen: Pen) {
  return (
    <ChartBar {...pen}
      data={QUARTERS}
      index="quarter"
      config={{ new: { label: 'New' }, returning: { label: 'Returning' } }}
      stacked
      label="Customers by quarter, new stacked on returning"
    />
  );
}

export const examples = [
  { name: 'default', title: 'Vertical', description: 'Columns hatched one after another, then outlined in the accent.', Component: Vertical },
  { name: 'horizontal', title: 'Horizontal', description: 'orientation="horizontal" lays the bars across, the labels down the left; the height follows the number of bars.', Component: Horizontal },
  { name: 'grouped', title: 'Grouped', description: 'Several series sit side by side, each with its own hatch: the first diagonal one way in the accent, the next the other way in ink.', Component: Grouped },
  { name: 'stacked', title: 'Stacked', description: 'stacked builds each bar from its series, the pen outlining each piece on the one below.', Component: Stacked },
];
