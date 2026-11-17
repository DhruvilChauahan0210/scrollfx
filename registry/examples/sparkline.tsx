import { Sparkline } from '@/registry/ui/sparkline';
import type { Pen } from './types';

function StatCards(pen: Pen) {
  const stats = [
    { label: 'Revenue', value: '$48.2k', change: '+12%', data: [21, 24, 22, 27, 26, 31, 30, 34, 37, 36, 41, 45] },
    { label: 'Active users', value: '3,904', change: '+4%', data: [310, 330, 325, 340, 338, 352, 349, 361, 358, 372, 380, 390] },
    { label: 'Churn', value: '1.8%', change: '−0.3%', data: [2.6, 2.5, 2.6, 2.3, 2.4, 2.2, 2.1, 2.2, 2.0, 1.9, 1.9, 1.8] },
  ];
  return (
    <div className="@container">
      <div className="grid gap-4 @2xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[3px] border bg-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="font-serif text-3xl tracking-[-0.02em] tabular-nums">{s.value}</p>
              <Sparkline color={pen.accent} trigger={pen.trigger} data={s.data} variant="area" className="h-10 w-24" label={`${s.label}, last 12 months`} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{s.change} on last month</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InATable(pen: Pen) {
  const rows = [
    { name: 'svg-scroll-draw', downloads: '18.4k', data: [8, 9, 11, 10, 13, 15, 14, 17, 19, 18] },
    { name: 'plotter', downloads: '6.1k', data: [7, 6, 7, 8, 7, 9, 8, 9, 10, 11] },
    { name: 'chart', downloads: '2.7k', data: [2, 3, 3, 5, 4, 6, 7, 6, 8, 9] },
    { name: 'flow-field', downloads: '1.2k', data: [9, 8, 8, 7, 8, 6, 6, 5, 6, 5] },
  ];
  return (
    <table className="w-full text-sm">
      <thead className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <tr className="border-b">
          <th className="py-3 text-left font-normal">Package</th>
          <th className="py-3 text-right font-normal">Weekly</th>
          <th className="py-3 pl-6 text-right font-normal">Ten weeks</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.name}>
            <td className="py-3 font-mono text-[13px]">{r.name}</td>
            <td className="py-3 text-right tabular-nums">{r.downloads}</td>
            <td className="py-3 pl-6 text-right">
              <Sparkline color={pen.accent} trigger={pen.trigger} data={r.data} curve="linear" label={`${r.name}, weekly downloads over ten weeks`} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const examples = [
  { name: 'default', title: 'In stat cards', description: 'variant="area" hatches under the line; size it with className.', Component: StatCards },
  { name: 'table', title: 'In a table', description: 'A line and an end dot, one per row, each drawn as its row reaches the middle of the screen.', Component: InATable },
];
