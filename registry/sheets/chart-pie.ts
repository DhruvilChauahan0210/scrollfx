import type { SheetSpec } from './types';

// Default data: 275, 200, 187, 173, 90 (925 in all), clockwise from twelve o'clock.
// The circle's radius is 0.47 of the plot's square box; the shares sit at 0.55.
const plot = '[data-slot=plot]';
const at = (deg: number, r: number): [number, number] => [0.5 + Math.sin((deg * Math.PI) / 180) * r, 0.5 - Math.cos((deg * Math.PI) / 180) * r];

export const sheet: SheetSpec = {
  shape: 'circle',
  scale: 2,
  view: 'max-w-md',
  details: [
    {
      example: 'default',
      prop: 'variant="pie"',
      callouts: [
        { prop: 'accent', note: 'first wedge', in: plot, at: at(53, 0.3), side: 'right', end: 'dot' },
        { prop: 'labels', note: 'shares', in: plot, at: [at(53, 0.55)[0] + 0.095, at(53, 0.55)[1]], side: 'right' },
        { prop: 'data', note: '5 rows', in: plot, at: at(220, 0.32), side: 'left', end: 'dot' },
        { prop: 'legend', in: '[data-slot=legend]', at: [0.05, 0.5], side: 'left' },
      ],
    },
    {
      example: 'donut',
      prop: 'variant="donut"',
      callouts: [
        { prop: 'variant', note: 'donut', in: plot, at: at(135, 0.47 * 0.58), side: 'right' },
        { prop: 'totalLabel', in: plot, at: [0.42, 0.56], side: 'left' },
      ],
    },
  ],
};
