import { describe, expect, it } from 'vitest';
import { formatDayMonth, formatLongDate, formatWeekRange } from './format';

describe('the report’s dates', () => {
  it('writes a day with its month', () => {
    expect(formatDayMonth('2026-11-16')).toBe('16 Kasım');
    expect(formatDayMonth('2027-01-03')).toBe('3 Ocak');
  });

  it('adds the weekday to a long date (V3)', () => {
    expect(formatLongDate('2026-11-15')).toBe('15 Kasım Pazar');
    expect(formatLongDate('2026-11-16')).toBe('16 Kasım Pazartesi');
  });

  it('writes a week from its Monday to its Sunday, across months and years (V1)', () => {
    expect(formatWeekRange('2026-11-09')).toBe('9–15 Kasım');
    expect(formatWeekRange('2026-10-26')).toBe('26 Ekim – 1 Kasım');
    expect(formatWeekRange('2026-12-28')).toBe('28 Aralık – 3 Ocak');
  });
});
