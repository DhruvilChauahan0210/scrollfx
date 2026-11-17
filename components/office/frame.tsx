import type { ReactNode } from 'react';

const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * A drawing sheet's furniture: the paper, a thin outer line and the frame
 * inside it, with zone references between the two (numbers along the top and
 * bottom, letters down the sides), centring marks at the middle of each side,
 * fold marks on the edges and crop marks just off the corners, as a printed
 * sheet comes from the plotter. Static: the pen spends itself on the drawing.
 */
export function Frame({ id, label, children, className = '' }: { id?: string; label: string; children: ReactNode; className?: string }) {
  return (
    <article id={id} data-sheet={id} aria-label={label} className={`sheet relative scroll-mt-20 p-[26px] sm:p-[30px] shadow-[0_0_0_1px_var(--border),0_24px_48px_-28px_rgba(40,30,10,.35)] dark:shadow-[0_0_0_1px_#2b4874,0_30px_60px_-30px_rgba(0,0,0,.8)] ${className}`}>
      <CropMarks />
      {/* Fold marks: where an A1 sheet is folded to file, a short tick on the edge. */}
      <span aria-hidden className="absolute left-1/3 top-0 h-1.5 w-px bg-[var(--line)]" />
      <span aria-hidden className="absolute left-2/3 top-0 h-1.5 w-px bg-[var(--line)]" />
      <span aria-hidden className="absolute bottom-0 left-1/3 h-1.5 w-px bg-[var(--line)]" />
      <span aria-hidden className="absolute bottom-0 left-2/3 h-1.5 w-px bg-[var(--line)]" />

      {/* The outer line and the zones between it and the frame. */}
      <div aria-hidden className="pointer-events-none absolute inset-2 border border-[var(--hair)] sm:inset-2.5" />
      <Zones edge="top" />
      <Zones edge="bottom" />
      <Zones edge="left" />
      <Zones edge="right" />
      <Centring />

      <div className="relative border border-[var(--line)]">{children}</div>
    </article>
  );
}

function Zones({ edge }: { edge: 'top' | 'bottom' | 'left' | 'right' }) {
  const x = edge === 'top' || edge === 'bottom';
  const pos =
    edge === 'top' ? 'left-[26px] right-[26px] top-2 h-[18px] sm:left-[30px] sm:right-[30px] sm:top-2.5 sm:h-5'
    : edge === 'bottom' ? 'bottom-2 left-[26px] right-[26px] h-[18px] sm:bottom-2.5 sm:left-[30px] sm:right-[30px] sm:h-5'
    : edge === 'left' ? 'bottom-[26px] left-2 top-[26px] w-[18px] sm:bottom-[30px] sm:left-2.5 sm:top-[30px] sm:w-5'
    : 'bottom-[26px] right-2 top-[26px] w-[18px] sm:bottom-[30px] sm:right-2.5 sm:top-[30px] sm:w-5';
  const marks = x ? NUMBERS : LETTERS;
  return (
    <div aria-hidden data-axis={x ? 'x' : 'y'} data-edge={edge} className={`sheet-zones ${pos} font-mono text-[8.5px] text-muted-foreground`}>
      {/* A phone's sheet is narrow: four zones across, not eight. */}
      {marks.map((m, i) => <span key={m} className={x && i >= 4 ? 'hidden sm:grid' : ''}>{m}</span>)}
    </div>
  );
}

/** Centring marks: a short heavier line at the middle of each side, from the paper's edge into the frame. */
function Centring() {
  const c = 'absolute bg-[var(--line)]';
  return (
    <>
      <span aria-hidden className={`${c} left-1/2 top-0 h-[30px] w-px sm:h-[34px]`} />
      <span aria-hidden className={`${c} bottom-0 left-1/2 h-[30px] w-px sm:h-[34px]`} />
      <span aria-hidden className={`${c} left-0 top-1/2 h-px w-[30px] sm:w-[34px]`} />
      <span aria-hidden className={`${c} right-0 top-1/2 h-px w-[30px] sm:w-[34px]`} />
    </>
  );
}

/** Crop marks just off each corner, on the page rather than the paper, as on a proof. */
function CropMarks() {
  const mark = (pos: string, rotate: number) => (
    <svg aria-hidden viewBox="0 0 24 24" className={`pointer-events-none absolute hidden size-6 overflow-visible text-muted-foreground sm:block ${pos}`} style={{ rotate: `${rotate}deg` }} fill="none" stroke="currentColor" strokeWidth="0.8">
      {/* The paper's corner is this box's bottom right: a line on each edge's line, short of the corner. */}
      <path d="M0 24H15M24 0V15" />
    </svg>
  );
  return (
    <>
      {mark('-left-6 -top-6', 0)}
      {mark('-right-6 -top-6', 90)}
      {mark('-bottom-6 -right-6', 180)}
      {mark('-bottom-6 -left-6', 270)}
    </>
  );
}
