// lib/eventDate.ts — Event date parsing/formatting + upcoming/past helpers
//
// Event dates are stored as ISO strings ("YYYY-MM-DD"), picked via DatePickerModal.
// Events created before this feature shipped may carry a free-text `date`
// (e.g. "12 septembre 2026") that won't match ISO_RE — callers should treat those
// as "date unspecified" rather than crash or silently drop the event.

export const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type EventDateLang = 'fr' | 'en';

/** Number of days in a given month (1-indexed month, matching DatePickerModal). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Parses "YYYY-MM-DD" into a local Date at midnight. Returns null for anything else (free text, empty, malformed). */
export function parseEventDate(value?: string | null): Date | null {
  if (!value) return null;
  const m = ISO_RE.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(year, month - 1, day);
  // Reject calendar rollovers (e.g. "2026-02-30" silently becoming March 2).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Formats a single ISO date as "12 septembre 2026" (fr) or "September 12, 2026" (en). Empty string if unparseable. */
export function formatEventDate(value?: string | null, lang: EventDateLang = 'fr'): string {
  const date = parseEventDate(value);
  if (!date) return '';
  const months = lang === 'en' ? MONTHS_EN : MONTHS_FR;
  return lang === 'en'
    ? `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    : `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Formats a date range for multi-day events, collapsing the shared parts:
 * "11 - 14 août 2026" (same month), "28 août - 2 septembre 2026" (same year),
 * "30 décembre 2026 - 2 janvier 2027" (crosses years).
 * Falls back to formatEventDate(start) when there's no end date or it equals the start.
 */
export function formatEventDateRange(start?: string | null, end?: string | null, lang: EventDateLang = 'fr'): string {
  const startDate = parseEventDate(start);
  if (!startDate) return '';
  const endDate = parseEventDate(end);
  if (!endDate || sameDay(startDate, endDate)) return formatEventDate(start, lang);

  const months = lang === 'en' ? MONTHS_EN : MONTHS_FR;
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

  if (lang === 'en') {
    if (sameMonth) return `${months[startDate.getMonth()]} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
    if (sameYear) return `${months[startDate.getMonth()]} ${startDate.getDate()} - ${months[endDate.getMonth()]} ${endDate.getDate()}, ${startDate.getFullYear()}`;
    return `${formatEventDate(start, lang)} - ${formatEventDate(end, lang)}`;
  }

  if (sameMonth) return `${startDate.getDate()} - ${endDate.getDate()} ${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
  if (sameYear) return `${startDate.getDate()} ${months[startDate.getMonth()]} - ${endDate.getDate()} ${months[endDate.getMonth()]} ${startDate.getFullYear()}`;
  return `${formatEventDate(start, lang)} - ${formatEventDate(end, lang)}`;
}

/** True when the ISO date is strictly before the end of the reference day (defaults to now). Unparseable input is never "past". */
export function isPastDate(value?: string | null, reference: Date = new Date()): boolean {
  const date = parseEventDate(value);
  if (!date) return false;
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return endOfDay.getTime() < reference.getTime();
}

/**
 * The ISO date that determines whether an event has fully ended: `endDate` when set and
 * parseable, otherwise `date`. Returns null when neither parses (e.g. legacy free-text date),
 * signaling "date unspecified" to callers rather than a fake past/upcoming status.
 */
export function getEventEndReference(event: { date?: string | null; endDate?: string | null }): string | null {
  if (event.endDate && parseEventDate(event.endDate)) return event.endDate;
  if (event.date && parseEventDate(event.date)) return event.date;
  return null;
}
