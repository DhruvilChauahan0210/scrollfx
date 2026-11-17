import type { SheetSpec } from './types';
import { sheet as chartLine } from './chart-line';
import { sheet as chartArea } from './chart-area';
import { sheet as chartBar } from './chart-bar';
import { sheet as chartPie } from './chart-pie';
import { sheet as chartRadar } from './chart-radar';
import { sheet as chartScatter } from './chart-scatter';
import { sheet as sparkline } from './sparkline';
import { sheet as inkHighlight } from './ink-highlight';
import { sheet as inkDivider } from './ink-divider';
import { sheet as inkFrame } from './ink-frame';
import { sheet as inkProgress } from './ink-progress';
import { sheet as inkStamp } from './ink-stamp';
import { sheet as inkSignature } from './ink-signature';
import { sheet as inkArrow } from './ink-arrow';

export type { SheetSpec } from './types';

/** Every component's drawing sheet, by registry name. */
export const SHEETS: Record<string, SheetSpec> = {
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
