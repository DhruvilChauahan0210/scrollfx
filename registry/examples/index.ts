import type { Example } from './types';
import { examples as inkHighlight } from './ink-highlight';
import { examples as inkDivider } from './ink-divider';
import { examples as inkFrame } from './ink-frame';
import { examples as inkProgress } from './ink-progress';
import { examples as inkStamp } from './ink-stamp';
import { examples as inkSignature } from './ink-signature';
import { examples as inkArrow } from './ink-arrow';

export type { Example } from './types';

/** Every component's examples, by its registry name: one line per component. */
export const EXAMPLES: Record<string, Example[]> = {
  'ink-highlight': inkHighlight,
  'ink-divider': inkDivider,
  'ink-frame': inkFrame,
  'ink-progress': inkProgress,
  'ink-stamp': inkStamp,
  'ink-signature': inkSignature,
  'ink-arrow': inkArrow,
};
