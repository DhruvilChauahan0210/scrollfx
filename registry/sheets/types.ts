/**
 * A component's drawing sheet, as data: the callouts and dimensions the pen
 * draws round it, naming the props that shape each part, and its details (the
 * variants), each drawn small to a stated scale. Anchors are fractions of a
 * box inside the drawing (a `data-slot` of a chart, or any selector), so they
 * hold at every width.
 */

/** A leader from a label in the margin to the part a prop shapes. */
export interface Callout {
  /** The prop, as written in code. */
  prop: string;
  /** Said after it, quieter: `6 rows`, `first series`. */
  note?: string;
  /** The box the anchor is in: a selector inside the drawing. Defaults to the drawing itself. */
  in?: string;
  /** For words that wrap: the line of the box to anchor to (its nth client rect), not the whole box. */
  line?: number;
  /** The anchor, as a fraction of that box: [across, down]. */
  at: [number, number];
  /** The margin the label sits in. */
  side: 'left' | 'right';
  /** An arrowhead on an edge or a line; a dot on a surface. */
  end?: 'arrow' | 'dot';
  /**
   * Points the leader turns at on its way (wide sheets), to go round what is
   * between the label and the part: each a fraction of a box like the anchor,
   * its y `'anchor'` to level with the anchor. The label sits level with the
   * first.
   */
  via?: { in?: string; line?: number; at: [number, number | 'anchor'] }[];
  /** A different anchor on a phone, where the callout is a balloon beside the drawing rather than a label in a margin. */
  phone?: { in?: string; line?: number; at: [number, number] };
}

/** A dimension: the size a prop sets, measured off a box with extension lines and end ticks. */
export interface Dimension {
  prop: string;
  note?: string;
  in?: string;
  /** `y` measures the box's height beside it; `x` its width, under it. */
  axis: 'x' | 'y';
  /** For `y`, the margin it is drawn in: the right by default. */
  side?: 'left' | 'right';
}

export interface Detail {
  /** The example's name in registry/examples/<name>.tsx. */
  example: string;
  /** The prop that makes this variant, as written: `variant="donut"`. */
  prop: string;
  callouts?: Callout[];
  dimensions?: Dimension[];
}

export interface SheetSpec {
  /** How a detail is drawn round: a circle, or a box. */
  shape: 'circle' | 'box';
  /** Details are drawn at 1 : scale. */
  scale: number;
  /** Classes for the drawing's own box on the sheet (its width). */
  view?: string;
  /** Every variant worth seeing, the first as drawn on the sheet. */
  details: Detail[];
  /** Notes beyond the ones every sheet carries. */
  notes?: string[];
}
