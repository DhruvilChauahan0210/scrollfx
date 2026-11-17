import type { Example } from './types';
import { examples as chartLine } from './chart-line';
import { examples as chartArea } from './chart-area';
import { examples as chartBar } from './chart-bar';
import { examples as chartPie } from './chart-pie';
import { examples as chartRadar } from './chart-radar';
import { examples as chartScatter } from './chart-scatter';
import { examples as sparkline } from './sparkline';
import { examples as inkHighlight } from './ink-highlight';
import { examples as inkDivider } from './ink-divider';
import { examples as inkFrame } from './ink-frame';
import { examples as inkProgress } from './ink-progress';
import { examples as inkStamp } from './ink-stamp';
import { examples as inkSignature } from './ink-signature';
import { examples as inkArrow } from './ink-arrow';

export type { Example } from './types';

/** Every component's examples, by registry name; the first is its preview on /components. */
export const EXAMPLES: Record<string, Example[]> = {
  'chart-line': chartLine,
  'chart-area': chartArea,
  'chart-bar': chartBar,
  'chart-pie': chartPie,
  'chart-radar': chartRadar,
  'chart-scatter': chartScatter,
  sparkline: sparkline,
  'ink-highlight': inkHighlight,
  'ink-divider': inkDivider,
  'ink-frame': inkFrame,
  'ink-progress': inkProgress,
  'ink-stamp': inkStamp,
  'ink-signature': inkSignature,
  'ink-arrow': inkArrow,
};
