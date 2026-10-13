import { useState, type ReactNode } from 'react';
import { cn } from '../../components/ui';

/*
 * Small single-series charts in plain HTML: one hue (brand), thin bars with a rounded data end anchored
 * at the baseline, recessive grid, text in ink colours, a tooltip on hover/focus, and a table next to
 * every chart (the accessible view). Single series, so the chart title names it and no legend is drawn.
 */

export type BarDatum = { key: string; label: string; value: number; display?: string; detail?: ReactNode };

/** Horizontal bars, for comparing categories (members per TDP, age groups). */
export const BarList = ({ data, label, emptyText = 'Chưa có dữ liệu' }: { data: BarDatum[]; label: string; emptyText?: string }) => {
  const max = Math.max(0, ...data.map((item) => item.value));
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-600">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5" aria-label={label}>
      {data.map((item) => (
        <li key={item.key} className="grid grid-cols-[minmax(6rem,10rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-slate-700" title={item.label}>
            {item.label}
          </span>
          <span className="h-3 rounded-r-[4px] bg-slate-100" aria-hidden="true">
            <span
              className="block h-full rounded-r-[4px] bg-brand-600 transition-[width] duration-300"
              style={{ width: max > 0 ? `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` : '0%' }}
            />
          </span>
          <span className="min-w-12 text-right font-semibold text-slate-900 tabular-nums">{item.display ?? item.value.toLocaleString('vi-VN')}</span>
        </li>
      ))}
    </ul>
  );
};

/** Vertical columns over time (one per month or quarter); values are 0..1 rates or null (no data). */
export const RateColumns = ({ data, label }: { data: Array<Omit<BarDatum, 'value'> & { value: number | null }>; label: string }) => {
  const [active, setActive] = useState<string | null>(null);
  const gridLines = [1, 0.75, 0.5, 0.25, 0];

  return (
    <figure aria-label={label} className="relative">
      <div className="flex gap-2">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-[11px] text-slate-500 tabular-nums" aria-hidden="true">
          {gridLines.map((line) => (
            <span key={line} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {line * 100}%
            </span>
          ))}
        </div>
        <div className="relative h-48 flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
            {gridLines.map((line) => (
              <span key={line} className={cn('border-t', line === 0 ? 'border-slate-400' : 'border-slate-100')} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-stretch gap-[2px]">
            {data.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className="group relative flex min-w-0 flex-1 flex-col items-center justify-end pb-6 focus-visible:outline-none"
                  onMouseEnter={() => setActive(item.key)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(item.key)}
                  onBlur={() => setActive(null)}
                  aria-label={`${item.label}: ${item.display ?? 'không có dữ liệu'}`}
                >
                  <span
                    className={cn(
                      'w-full max-w-7 rounded-t-[4px] transition-colors',
                      item.value === null ? 'bg-transparent' : isActive ? 'bg-brand-800' : 'bg-brand-600',
                      'group-focus-visible:ring-2 group-focus-visible:ring-brand-600 group-focus-visible:ring-offset-2',
                    )}
                    style={{ height: item.value === null ? 0 : `${Math.max(item.value * 100, item.value > 0 ? 1 : 0)}%` }}
                  />
                  <span className="absolute bottom-0 h-6 truncate pt-1 text-[11px] text-slate-600">{item.label.replace(/^(Tháng|Quý) /, (m) => (m.startsWith('Q') ? 'Q' : 'T'))}</span>
                  {isActive && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full z-10 mb-1 w-max max-w-48 rounded-lg bg-slate-900 px-2.5 py-1.5 text-left text-xs text-white shadow-overlay"
                    >
                      <span className="block font-semibold">{item.label}</span>
                      <span className="block">{item.display ?? 'Không có sự kiện'}</span>
                      {item.detail && <span className="block text-slate-300">{item.detail}</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </figure>
  );
};

/** Big number with a caption, for headline figures. */
export const StatTile = ({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) => (
  <div className="rounded-card border border-slate-200 bg-surface p-4 shadow-card">
    <p className="text-sm text-slate-600">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-slate-600">{hint}</p>}
  </div>
);

/** Collapsible table under a chart: the same numbers, readable by screen readers and for printing. */
export const DataTable = ({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) => (
  <details className="mt-3 text-sm">
    <summary className="inline-flex min-h-10 items-center font-medium text-brand-700">Xem dạng bảng</summary>
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-600">
            {head.map((cell, index) => (
              <th key={cell} scope="col" className={cn('py-2 pr-3 font-medium', index > 0 && 'text-right')}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100">
              {row.map((cell, index) => (
                <td key={index} className={cn('py-2 pr-3 text-slate-800', index > 0 && 'text-right tabular-nums')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);

/** Downloads rows as a UTF-8 CSV that Excel opens with Vietnamese characters intact. */
export const downloadCsv = (fileName: string, head: string[], rows: Array<Array<string | number | null | undefined>>) => {
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [head, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
