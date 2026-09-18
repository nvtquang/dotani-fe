export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 16);
};

export const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
};
