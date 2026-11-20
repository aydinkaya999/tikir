import { describe, expect, it } from 'vitest';
import {
  defaultReadingStyle,
  sameReadingStyle,
  trialComparison,
  trialReadingStyle,
} from './readingStyle';
import type { Assessment, LocalDate, ReadingStyle } from './types';

const current: ReadingStyle = { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: true };
const tried: ReadingStyle = { ...current, spacingStep: 1 };

let nextId = 0;

/** A measurement on a day, with its pace and the reading style it was read in. */
function measured(date: LocalDate, wcpm: number, style: ReadingStyle, trial = false): Assessment {
  nextId += 1;
  return {
    id: `olcum-${String(nextId)}`,
    childId: 'cocuk',
    date,
    passageId: 'olcum-3a',
    level: 'instructional',
    ...(trial ? { trial: true } : {}),
    result: {
      startedAt: `${date}T09:00:00.000Z`,
      seconds: 60,
      words: [],
      wordsAttempted: wcpm,
      correctWords: wcpm,
      wcpm,
      accuracy: 0.95,
      readingStyle: style,
    },
  };
}

/** Two weeks with both styles (68/71, 70/73) and two weeks with the current style only. */
const demoLike = [
  measured('2026-10-26', 60, current),
  measured('2026-11-02', 62, current),
  measured('2026-11-09', 68, current),
  measured('2026-11-10', 71, tried, true),
  measured('2026-11-16', 70, current),
  measured('2026-11-17', 73, tried, true),
];

/** `count` trial weeks from 2026-09-07, the current style reading `base` and the tried `base + gain`. */
function trialWeeks(count: number, base: number, gain: number): Assessment[] {
  return Array.from({ length: count }, (_, week) => {
    const monday = new Date(Date.UTC(2026, 8, 7 + week * 7)).toISOString().slice(0, 10);
    return [measured(monday, base, current), measured(monday, base + gain, tried, true)];
  }).flat();
}

describe('defaultReadingStyle', () => {
  it.each([
    [1, 'school'],
    [2, 'school'],
    [3, 'clear'],
    [4, 'clear'],
  ] as const)(
    'gives grade %i the %s letters at the middle size and normal spacing',
    (grade, font) => {
      expect(defaultReadingStyle(grade)).toEqual({
        font,
        sizeStep: 1,
        spacingStep: 0,
        trialEnabled: false,
      });
    },
  );
});

describe('trialReadingStyle', () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 1],
  ] as const)('tries spacing %i one step away: %i', (spacingStep, tried) => {
    const style: ReadingStyle = { font: 'school', sizeStep: 3, spacingStep, trialEnabled: true };

    expect(trialReadingStyle(style)).toEqual({ ...style, spacingStep: tried });
  });
});

describe('sameReadingStyle', () => {
  it('compares the font, the size and the spacing, not the trial switch', () => {
    expect(sameReadingStyle(current, { ...current, trialEnabled: false })).toBe(true);
    expect(sameReadingStyle(current, { ...current, sizeStep: 2 })).toBe(false);
    expect(sameReadingStyle(current, { ...current, font: 'school' })).toBe(false);
    expect(sameReadingStyle(current, tried)).toBe(false);
  });
});

describe('trialComparison', () => {
  it('averages the weeks read in both styles, as the demo profile', () => {
    expect(trialComparison(demoLike, current)).toEqual({
      current: { style: current, average: 69, count: 2 },
      trial: { style: tried, average: 72, count: 2 },
      state: 'collecting',
      remaining: 2,
      better: null,
    });
  });

  it('has nothing to compare without a week read in both styles', () => {
    const comparison = trialComparison(demoLike.slice(0, 2), current);

    expect(comparison.state).toBe('none');
    expect(comparison.current).toEqual({ style: current, average: null, count: 0 });
    expect(comparison.trial).toEqual({ style: tried, average: null, count: 0 });
  });

  it('calls a difference under five words small after four weeks', () => {
    const comparison = trialComparison(trialWeeks(4, 70, 3), current);

    expect(comparison.state).toBe('smallDifference');
    expect(comparison.remaining).toBe(0);
    expect(comparison.better).toBeNull();
  });

  it('recommends the better style after four weeks and a difference of five or more', () => {
    const comparison = trialComparison(trialWeeks(4, 70, 6), current);

    expect(comparison.state).toBe('recommend');
    expect(comparison.better).toBe('trial');
    expect(comparison.current.average).toBe(70);
    expect(comparison.trial.average).toBe(76);
  });

  it('starts again when the style changes: other sizes do not count', () => {
    const larger: ReadingStyle = { ...current, sizeStep: 2 };

    expect(trialComparison(demoLike, larger).state).toBe('none');
  });
});
