/** Lower-case and strip Vietnamese diacritics, so "su kien" matches "Sự kiện". */
export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

export const excerpt = (value: string | null | undefined, length = 180) => {
  if (!value) {
    return '';
  }
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > length ? `${flat.slice(0, length).trimEnd()}…` : flat;
};
