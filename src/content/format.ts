const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseYm(ym: string): { year: number; month: number } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym);
  if (!match) throw new Error(`Expected YYYY-MM, got "${ym}"`);
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** "2024-07" → "Jul 2024" */
export function formatMonth(ym: string): string {
  const { year, month } = parseYm(ym);
  return `${MONTHS[month - 1]} ${year}`;
}

/** "2024-07", null → "Jul 2024 – now"; same year → "Jun – Jul 2023". */
export function formatSpan(start: string, end: string | null): string {
  if (end === null) return `${formatMonth(start)} – now`;
  if (start === end) return formatMonth(start);
  const a = parseYm(start);
  const b = parseYm(end);
  if (a.year === b.year) return `${MONTHS[a.month - 1]} – ${formatMonth(end)}`;
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

/** "2020-07", "2024-06" → "2020 – 2024" */
export function formatYearSpan(start: string, end: string): string {
  return `${parseYm(start).year} – ${parseYm(end).year}`;
}

/** "2024-07" → "SINCE JUL 2024" (never goes stale, spec §7 content rules). */
export function experienceSince(ym: string): string {
  return `SINCE ${formatMonth(ym).toUpperCase()}`;
}

/** Whole months from startYm to now; 0 if now is before start. */
export function monthsBetween(startYm: string, now: Date): number {
  const { year, month } = parseYm(startYm);
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return Math.max(0, months);
}
