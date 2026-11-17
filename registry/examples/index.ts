import type { ComponentType } from 'react';
import { examples as chartLine } from './chart-line';
import { examples as chartArea } from './chart-area';
import { examples as chartBar } from './chart-bar';
import { examples as chartPie } from './chart-pie';
import { examples as chartRadar } from './chart-radar';
import { examples as chartScatter } from './chart-scatter';
import { examples as sparkline } from './sparkline';

/** One way to use a component, shown live on its page with its source. */
export interface Example {
  name: string;
  title: string;
  description?: string;
  Component: ComponentType;
}

/** Every component's examples, by registry name; the first is its preview on /components. */
export const EXAMPLES: Record<string, Example[]> = {
  'chart-line': chartLine,
  'chart-area': chartArea,
  'chart-bar': chartBar,
  'chart-pie': chartPie,
  'chart-radar': chartRadar,
  'chart-scatter': chartScatter,
  sparkline: sparkline,
};
