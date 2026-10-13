// The API exchanges instants as ISO-8601 UTC strings (e.g. "2026-12-01T17:30:00Z").
// Everything shown to or typed by the user is in the browser's local time (Vietnam).

const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const pad = (value: number) => value.toString().padStart(2, '0');

const parse = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "T6, 30/10" — the year is added only when it is not the current one. */
export const formatDate = (value?: string | Date | null) => {
  const date = parse(value);
  if (!date) {
    return '-';
  }
  const year = date.getFullYear() === new Date().getFullYear() ? '' : `/${date.getFullYear()}`;
  return `${weekdays[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}${year}`;
};

/** "14:46" */
export const formatTime = (value?: string | Date | null) => {
  const date = parse(value);
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '-';
};

/** "T6, 30/10 · 14:46" */
export const formatDateTime = (value?: string | Date | null) => {
  const date = parse(value);
  return date ? `${formatDate(date)} · ${formatTime(date)}` : '-';
};

/** Full form for tooltips: "Thứ Sáu, 30/10/2026 14:46". */
export const formatFull = (value?: string | Date | null) => {
  const date = parse(value);
  if (!date) {
    return '';
  }
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeStyle: 'short' }).format(date);
};

/**
 * "vừa xong", "5 phút trước", "2 giờ trước", "3 giờ nữa"; older/farther than a day falls back
 * to formatDateTime, yesterday to "Hôm qua · 14:46".
 */
export const formatRelative = (value?: string | Date | null, now: Date = new Date()) => {
  const date = parse(value);
  if (!date) {
    return '-';
  }
  const diffMinutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  const abs = Math.abs(diffMinutes);
  const suffix = diffMinutes >= 0 ? 'trước' : 'nữa';

  if (abs < 1) return 'vừa xong';
  if (abs < 60) return `${abs} phút ${suffix}`;
  if (abs < 24 * 60) return `${Math.round(abs / 60)} giờ ${suffix}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Hôm qua · ${formatTime(date)}`;
  return formatDateTime(date);
};

export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

/** Label for a chat day separator: "Hôm nay", "Hôm qua", or "T6, 30/10". */
export const formatDayLabel = (value?: string | Date | null, now: Date = new Date()) => {
  const date = parse(value);
  if (!date) {
    return '';
  }
  if (isSameDay(date, now)) return 'Hôm nay';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Hôm qua';
  return formatDate(date);
};

/** Local calendar date (YYYY-MM-DD) of an instant, for `<input type="date">`. */
export const toLocalDateInput = (value?: string | Date | null) => {
  const date = parse(value);
  return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '';
};

/** Local date-time (YYYY-MM-DDTHH:mm) of an instant, for `<input type="datetime-local">`. */
export const toLocalDateTimeInput = (value?: string | Date | null) => {
  const date = parse(value);
  return date ? `${toLocalDateInput(date)}T${formatTime(date)}` : '';
};

/** UTC instant for a local date (YYYY-MM-DD) at a local time (HH:mm), e.g. the end of a day: '23:59'. */
export const localDateToIso = (date: string, time = '00:00') => new Date(`${date}T${time}:00`).toISOString();
