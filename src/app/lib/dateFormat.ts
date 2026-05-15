function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function formatOrderDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const day = padDatePart(date.getDate());
  const month = padDatePart(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
