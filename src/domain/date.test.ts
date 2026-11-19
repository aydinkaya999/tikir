import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, localDateOf, weekdayOf } from './date';

describe('addDays', () => {
  it('moves back and forward across months, years and leap days', () => {
    expect(addDays('2026-11-21', -5)).toBe('2026-11-16');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('is not shifted by daylight saving changes', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });
});

describe('calendar day input', () => {
  it('rejects a value that is not a calendar day', () => {
    expect(() => addDays('2026-11-1', 1)).toThrow(RangeError);
    expect(() => daysBetween('19.11.2026', '2026-11-20')).toThrow(RangeError);
  });
});

describe('daysBetween', () => {
  it('counts calendar days from the first date to the second', () => {
    expect(daysBetween('2026-11-16', '2026-11-21')).toBe(5);
    expect(daysBetween('2026-11-21', '2026-11-16')).toBe(-5);
  });
});

describe('weekdayOf', () => {
  it('numbers the days from Sunday', () => {
    expect(weekdayOf('2026-11-22')).toBe(0);
    expect(weekdayOf('2026-11-19')).toBe(4);
  });
});

describe('localDateOf', () => {
  it('reads the local calendar day of a moment', () => {
    expect(localDateOf(new Date(2026, 10, 19, 23, 59))).toBe('2026-11-19');
    expect(localDateOf(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });
});
