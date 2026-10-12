// The API exchanges instants as ISO-8601 UTC strings (e.g. "2026-12-01T17:30:00Z").
// Everything shown to or typed by the user is in the browser's local time (Vietnam).

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const pad = (value: number) => value.toString().padStart(2, '0');

/** Local calendar date (YYYY-MM-DD) of an instant, for `<input type="date">`. */
export const toLocalDateInput = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** UTC instant for a local date (YYYY-MM-DD) at a local time (HH:mm), e.g. the end of a day: '23:59'. */
export const localDateToIso = (date: string, time = '00:00') => new Date(`${date}T${time}:00`).toISOString();
