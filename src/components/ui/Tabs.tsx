import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

export type TabItem<T extends string> = { value: T; label: ReactNode; count?: number };

type TabsProps<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  /** id prefix; the panel should use aria-labelledby={`${idPrefix}-${value}`} */
  idPrefix?: string;
};

/** Horizontal tabs (WAI-ARIA tabs pattern): arrow keys move, Home/End jump; scrolls sideways on narrow screens. */
export const Tabs = <T extends string>({ items, value, onChange, label, className, idPrefix = 'tab' }: TabsProps<T>) => {
  const listRef = useRef<HTMLDivElement>(null);

  const focusTab = (index: number) => {
    const next = items[(index + items.length) % items.length];
    onChange(next.value);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      focusTab(moves[event.key]);
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cn('-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0', className)}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={`${idPrefix}-${item.value}`}
            data-value={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              '-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors',
              selected ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900',
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-700">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
