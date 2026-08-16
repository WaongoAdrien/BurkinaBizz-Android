// lib/openingHours.ts — Business opening-hours model + live open/closed status
//
// Africa/Ouagadougou is UTC+0 year-round (no DST), so the device's UTC clock
// fields ARE Ouagadougou local time — no timezone library needed. Using
// getUTCHours()/getUTCDay() instead of the local getHours()/getDay() means
// the status is correct even for diaspora users on other timezones.

import { DayKey, DayHours, OpeningHours } from '../types';

// Index-aligned with Date#getUTCDay() (0 = Sunday ... 6 = Saturday).
export const DAY_KEYS_BY_UTC_INDEX: DayKey[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

// Display order for the hours editor / list (Monday first).
export const DAYS_MONDAY_FIRST: DayKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const DAY_LABELS_FR: Record<DayKey, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

export const DAY_LABELS_SHORT_FR: Record<DayKey, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Jeu',
  friday: 'Ven',
  saturday: 'Sam',
  sunday: 'Dim',
};

export function emptyOpeningHours(): OpeningHours {
  return {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '13:00', closed: false },
    sunday: { open: '08:00', close: '18:00', closed: true },
  };
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(t?: string): number | null {
  if (!t || !TIME_RE.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatDayHours(day?: DayHours): string {
  if (!day || day.closed) return 'Fermé';
  if (!day.open || !day.close) return 'Fermé';
  return `${day.open} - ${day.close}`;
}

export interface BusinessOpenStatus {
  isOpen: boolean;
  label: 'Ouvert' | 'Fermé';
}

/**
 * Computes live open/closed status from Africa/Ouagadougou time.
 * Returns null when no opening hours are set at all (caller should hide the badge
 * or show "Horaires non renseignés").
 */
export function getOpenStatus(hours: OpeningHours | undefined | null, now: Date = new Date()): BusinessOpenStatus | null {
  if (!hours) return null;

  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const todayIndex = now.getUTCDay();
  const todayKey = DAY_KEYS_BY_UTC_INDEX[todayIndex];
  const yesterdayKey = DAY_KEYS_BY_UTC_INDEX[(todayIndex + 6) % 7];

  const today = hours[todayKey];
  const yesterday = hours[yesterdayKey];

  // Still inside yesterday's overnight window (e.g. Fri 20:00–02:00, checked at Sat 01:00).
  if (yesterday && !yesterday.closed) {
    const yOpen = toMinutes(yesterday.open);
    const yClose = toMinutes(yesterday.close);
    if (yOpen !== null && yClose !== null && yClose < yOpen && nowMinutes < yClose) {
      return { isOpen: true, label: 'Ouvert' };
    }
  }

  if (today && !today.closed) {
    const tOpen = toMinutes(today.open);
    const tClose = toMinutes(today.close);
    if (tOpen !== null && tClose !== null) {
      if (tClose > tOpen) {
        // Ordinary same-day window.
        if (nowMinutes >= tOpen && nowMinutes < tClose) return { isOpen: true, label: 'Ouvert' };
      } else if (tClose < tOpen) {
        // Spans midnight — open from tOpen through the end of this calendar day.
        if (nowMinutes >= tOpen) return { isOpen: true, label: 'Ouvert' };
      }
      // tClose === tOpen is an invalid/empty range — falls through to closed.
    }
  }

  return { isOpen: false, label: 'Fermé' };
}

/** True when hours has at least one usable day entry (so it's worth showing/saving). */
export function hasAnyOpeningHours(hours?: OpeningHours | null): boolean {
  if (!hours) return false;
  return DAYS_MONDAY_FIRST.some(key => {
    const d = hours[key];
    return d && (d.closed || (toMinutes(d.open) !== null && toMinutes(d.close) !== null));
  });
}
