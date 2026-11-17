import type { SheetSpec } from './types';

// Default data: six skills scored out of 100, spoke i at i/6 of a turn from twelve
// o'clock; the web's radius is 0.46 of the plot's square box.
const plot = '[data-slot=plot]';
const at = (spoke: number, of: number, r: number): [number, number] => [0.5 + Math.sin((spoke / of) * Math.PI * 2) * r * 0.46, 0.5 - Math.cos((spoke / of) * Math.PI * 2) * r * 0.46];

export const sheet: SheetSpec = {
  shape: 'circle',
  scale: 2,
  view: 'max-w-md',
  details: [
    {
      example: 'default',
      prop: 'grid="polygon"',
      callouts: [
        { prop: 'max', note: '100', in: plot, at: at(0, 6, 1), side: 'left' },
        { prop: 'accent', note: 'the shape', in: plot, at: at(2, 6, 0.92), side: 'right' },
        { prop: 'grid', note: 'polygon', in: plot, at: at(4.5, 6, Math.cos(Math.PI / 6)), side: 'left' },
        { prop: 'data', note: '6 spokes', in: plot, at: at(1.5, 6, 0.4), side: 'right', end: 'dot' },
      ],
    },
    {
      example: 'compare',
      prop: 'grid="circle"',
      callouts: [
        { prop: 'grid', note: 'circle', in: plot, at: at(4.5, 5, 1), side: 'left' },
        { prop: 'config', note: '2 series', in: '[data-slot=legend]', at: [0.05, 0.5], side: 'left' },
      ],
    },
  ],
};
