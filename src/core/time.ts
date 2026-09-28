/**
 * Canonical date helpers.
 * Records are always stored as local-timezone `YYYY-MM-DD` strings so that
 * "today" never shifts across day boundaries in different time zones
 * (the previous `new Date().toISOString().split('T')[0]` used UTC).
 */

/** Convert a Date to a local-timezone `YYYY-MM-DD` string. */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a stored date value as local time.
 * - Canonical `YYYY-MM-DD` -> local midnight (no UTC drift).
 * - Legacy values (e.g. `2026/9/27`) -> native parse.
 * - Unparseable -> null, so callers can show a fallback instead of NaN/blanks.
 */
export function parseISODate(value: string): Date | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
