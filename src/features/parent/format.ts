// How the report writes dates (docs/planlar/faz-4.md, karar 39): "16 Kasım", "16 Kasım Pazar",
// "10–16 Kasım". The names are in src/i18n/tr.ts.
import { addDays, weekdayOf } from '../../domain/date';
import type { LocalDate } from '../../domain/types';
import { tr } from '../../i18n/tr';

const copy = tr.dates;

function parts(date: LocalDate): { day: number; month: string } {
  const [, month, day] = date.split('-').map(Number);
  return { day: day ?? 0, month: copy.months[(month ?? 1) - 1] ?? '' };
}

/** "16 Kasım". */
export function formatDayMonth(date: LocalDate): string {
  const { day, month } = parts(date);
  return copy.dayMonth(day, month);
}

/** "16 Kasım Pazar" (V3). */
export function formatLongDate(date: LocalDate): string {
  // weekdayOf counts from Sunday; the names start on Monday.
  return copy.longDate(formatDayMonth(date), copy.weekdays[(weekdayOf(date) + 6) % 7] ?? '');
}

/** The week from its Monday: "10–16 Kasım", or "27 Ekim – 2 Kasım" across two months (V1). */
export function formatWeekRange(monday: LocalDate): string {
  const first = parts(monday);
  const sunday = addDays(monday, 6);
  const last = parts(sunday);
  return first.month === last.month
    ? copy.rangeInMonth(first.day, last.day, last.month)
    : copy.rangeAcross(formatDayMonth(monday), formatDayMonth(sunday));
}
