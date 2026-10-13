import { useMemo, useRef, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, cn } from '../../components/ui';
import type { Event } from '../../types/event';
import { formatDate, isSameDay, toLocalDateInput } from '../../utils/dateTime';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** First day of the month containing `date`. */
export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

/** The 6x7 grid shown for a month, starting on Monday. */
export const calendarRange = (month: Date) => {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 42);
  return { start, end };
};

type EventCalendarProps = {
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  events: Event[];
  isLoading?: boolean;
};

/** Month grid. Days with events show titles on wide screens and dots on phones; arrow keys move between days. */
export const EventCalendar = ({ month, onMonthChange, selectedDay, onSelectDay, events, isLoading }: EventCalendarProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const { start } = calendarRange(month);
  const today = new Date();

  const startKey = start.getTime();
  const days = useMemo(() => {
    const first = new Date(startKey);
    return Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index));
  }, [startKey]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((event) => {
      const key = toLocalDateInput(event.startTime);
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [events]);

  const moveFocus = (day: Date) => {
    if (day.getMonth() !== month.getMonth()) {
      onMonthChange(startOfMonth(day));
    }
    onSelectDay(day);
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toLocalDateInput(day)}"]`)?.focus());
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in steps) {
      event.preventDefault();
      moveFocus(new Date(day.getFullYear(), day.getMonth(), day.getDate() + steps[event.key]));
    }
  };

  const monthLabel = `Tháng ${month.getMonth() + 1}, ${month.getFullYear()}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <h2 className="flex-1 text-base font-semibold text-slate-900" aria-live="polite">
          {monthLabel}
        </h2>
        <Button variant="secondary" size="sm" onClick={() => {
          onMonthChange(startOfMonth(today));
          onSelectDay(today);
        }}>
          Hôm nay
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Tháng trước">
          <ChevronLeft size={20} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Tháng sau">
          <ChevronRight size={20} aria-hidden="true" />
        </Button>
      </div>

      <div ref={gridRef} role="group" aria-label={monthLabel} aria-busy={isLoading} className="grid grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} aria-hidden="true" className="border-b border-slate-200 py-1.5 text-center text-xs font-semibold text-slate-600">
            {weekday}
          </div>
        ))}
        {days.map((day) => {
          const key = toLocalDateInput(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = day.getMonth() === month.getMonth();
          const selected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={key}
              type="button"
              data-day={key}
              aria-pressed={selected}
              aria-label={`${formatDate(day)}${dayEvents.length ? `, ${dayEvents.length} sự kiện` : ''}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelectDay(day)}
              onKeyDown={(event) => onKeyDown(event, day)}
              className={cn(
                'flex min-h-14 flex-col items-stretch gap-0.5 border-r border-b border-slate-100 p-1 text-left align-top sm:min-h-24',
                !inMonth && 'bg-slate-50 text-slate-500',
                selected && 'bg-brand-50 ring-2 ring-brand-600 ring-inset',
              )}
            >
              <span
                className={cn(
                  'mx-auto flex size-7 items-center justify-center rounded-full text-sm sm:mx-0',
                  isToday ? 'bg-brand-600 font-bold text-white' : inMonth ? 'text-slate-900' : '',
                )}
              >
                {day.getDate()}
              </span>
              {/* phones: dots */}
              {dayEvents.length > 0 && (
                <span className="flex justify-center gap-0.5 sm:hidden" aria-hidden="true">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span key={event.id} className={cn('size-1.5 rounded-full', event.status === 'CANCELLED' ? 'bg-slate-400' : 'bg-accent-600')} />
                  ))}
                </span>
              )}
              {/* wider screens: titles */}
              {dayEvents.slice(0, 2).map((event) => (
                <span
                  key={event.id}
                  aria-hidden="true"
                  className={cn(
                    'hidden truncate rounded px-1 text-[11px] leading-5 font-medium sm:block',
                    event.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 line-through' : 'bg-brand-100 text-brand-800',
                  )}
                >
                  {event.title}
                </span>
              ))}
              {dayEvents.length > 2 && <span className="hidden px-1 text-[11px] text-slate-600 sm:block" aria-hidden="true">+{dayEvents.length - 2} khác</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
