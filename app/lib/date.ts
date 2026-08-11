// The database and every date input store/compare dates as ISO "YYYY-MM-DD"
// strings (so lexicographic sort/comparison keeps working). This only
// reformats for display as MM/DD/YYYY — never use it on a value that still
// needs to be sorted, compared, or fed back into a date input.
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
}
