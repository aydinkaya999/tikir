// Calendar days (docs/planlar/faz-2a.md, karar 16). Day arithmetic runs on UTC midnights, so a
// daylight saving change never moves a date; only localDateOf reads the device's time zone.
import type { LocalDate } from './types';

const dayMs = 24 * 60 * 60 * 1000;
const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

function format(year: number, monthIndex: number, day: number): LocalDate {
  return `${pad(year, 4)}-${pad(monthIndex + 1, 2)}-${pad(day, 2)}`;
}

function utcMidnight(date: LocalDate): number {
  const match = localDatePattern.exec(date);
  if (match === null) {
    throw new RangeError(`Not a calendar day (YYYY-MM-DD): "${date}"`);
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const moment = new Date(utcMidnight(date) + days * dayMs);
  return format(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate());
}

/** to − from, in calendar days. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((utcMidnight(to) - utcMidnight(from)) / dayMs);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: LocalDate): number {
  return new Date(utcMidnight(date)).getUTCDay();
}

/** The moment's day in the device's local calendar. */
export function localDateOf(moment: Date): LocalDate {
  return format(moment.getFullYear(), moment.getMonth(), moment.getDate());
}

/** The Monday of the date's week. */
export function weekStart(date: LocalDate): LocalDate {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}
