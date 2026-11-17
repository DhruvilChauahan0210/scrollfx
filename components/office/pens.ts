/**
 * The plotter's pens. Pen 1 is the ink (the text colour, so it follows the
 * paper); pen 2 is the accent, and the reader may load another: these are the
 * colours a pen plotter's carousel held, toned to sit on paper and on a
 * blueprint alike.
 */
export const PENS = [
  { name: 'Vermilion', color: '#e0482a' },
  { name: 'Viridian', color: '#1e9a73' },
  { name: 'Ochre', color: '#d0901f' },
  { name: 'Violet', color: '#8a5cd6' },
] as const;
