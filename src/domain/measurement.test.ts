import { describe, expect, it } from 'vitest';
import { testAssessment } from '../test/sessions';
import {
  lastMeasurement,
  measurementDue,
  measurementReadings,
  nextMeasurementOn,
} from './measurement';
import { trialReadingStyle } from './readingStyle';
import type { Assessment, Passage, ReadingStyle } from './types';

// 2026-11-09 is a Monday and 2026-11-15 the Sunday of its week.

const style: ReadingStyle = { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: false };
const trialOn: ReadingStyle = { ...style, trialEnabled: true };
const tried = trialReadingStyle(trialOn);

function passage(id: string): Passage {
  return { id, grade: 3, title: id, sentences: ['Bir cümle.'] };
}

/** Grade 3 has two texts, listed out of order to show that the ids set the order. */
const gradeThree = [passage('olcum-3b'), passage('olcum-3a')];
const gradeTwo = [passage('olcum-2a')];

function on(date: string, passageId: string, trial = false): Assessment {
  return testAssessment(date, 60, {
    passageId,
    ...(trial ? { trial: true, readingStyle: tried } : { readingStyle: trialOn }),
  });
}

describe('lastMeasurement', () => {
  it('is the latest measurement that is not a trial reading, by day and start time', () => {
    const sameDay = [
      testAssessment('2026-11-15', 71, { startedAt: '2026-11-15T09:05:00.000Z' }),
      testAssessment('2026-11-15', 69, { startedAt: '2026-11-15T09:00:00.000Z' }),
      testAssessment('2026-11-15', 74, { trial: true, startedAt: '2026-11-15T09:10:00.000Z' }),
      testAssessment('2026-11-08', 67),
    ];
    expect(lastMeasurement(sameDay)?.result.wcpm).toBe(71);
    expect(lastMeasurement([])).toBeNull();
  });
});

describe('nextMeasurementOn', () => {
  it('is seven days after the last measurement that is not a trial reading', () => {
    expect(nextMeasurementOn([])).toBeNull();
    expect(
      nextMeasurementOn([on('2026-11-08', 'olcum-3a'), on('2026-11-15', 'olcum-3b', true)]),
    ).toBe('2026-11-15');
  });
});

describe('measurementDue', () => {
  it('never opens without the parent’s consent', () => {
    expect(measurementDue([], style, '2026-11-15', false)).toBe(false);
  });

  it('is open at once when there is no measurement yet', () => {
    expect(measurementDue([], style, '2026-11-15', true)).toBe(true);
  });

  it('opens seven days after the last measurement and stays open until it is made', () => {
    const last = [on('2026-11-08', 'olcum-3a')];
    expect(measurementDue(last, style, '2026-11-14', true)).toBe(false);
    expect(measurementDue(last, style, '2026-11-15', true)).toBe(true);
    expect(measurementDue(last, style, '2026-11-17', true)).toBe(true);
  });

  it('stays open in a trial week until both readings are made', () => {
    const currentOnly = [on('2026-11-15', 'olcum-3b')];
    expect(measurementDue(currentOnly, trialOn, '2026-11-15', true)).toBe(true);
    const both = [...currentOnly, on('2026-11-15', 'olcum-3a', true)];
    expect(measurementDue(both, trialOn, '2026-11-15', true)).toBe(false);
  });
});

describe('measurementReadings', () => {
  it('starts with the first text by id', () => {
    expect(measurementReadings(gradeThree, [], style, '2026-11-15')).toEqual([
      { passageId: 'olcum-3a', style, trial: false },
    ]);
  });

  it('never gives the last measurement’s text again when the grade has another', () => {
    expect(
      measurementReadings(gradeThree, [on('2026-11-08', 'olcum-3a')], style, '2026-11-15'),
    ).toEqual([{ passageId: 'olcum-3b', style, trial: false }]);
    expect(
      measurementReadings(gradeThree, [on('2026-11-08', 'olcum-3b')], style, '2026-11-15'),
    ).toEqual([{ passageId: 'olcum-3a', style, trial: false }]);
  });

  it('gives a one-text grade its text every week', () => {
    expect(
      measurementReadings(gradeTwo, [on('2026-11-08', 'olcum-2a')], style, '2026-11-15'),
    ).toEqual([{ passageId: 'olcum-2a', style, trial: false }]);
  });

  it('is empty until the measurement is due', () => {
    expect(
      measurementReadings(gradeThree, [on('2026-11-12', 'olcum-3a')], style, '2026-11-15'),
    ).toEqual([]);
  });

  it('reads both styles in a trial week, the current one first in the first trial week', () => {
    expect(
      measurementReadings(gradeThree, [on('2026-11-08', 'olcum-3a')], trialOn, '2026-11-15'),
    ).toEqual([
      { passageId: 'olcum-3b', style: trialOn, trial: false },
      { passageId: 'olcum-3a', style: tried, trial: true },
    ]);
  });

  it('turns the order with each earlier trial week', () => {
    const oneTrialWeek = [
      on('2026-11-01', 'olcum-3a'),
      on('2026-11-01', 'olcum-3b', true),
      on('2026-11-08', 'olcum-3b'),
    ];
    expect(measurementReadings(gradeThree, oneTrialWeek, trialOn, '2026-11-15')).toEqual([
      { passageId: 'olcum-3b', style: tried, trial: true },
      { passageId: 'olcum-3a', style: trialOn, trial: false },
    ]);
    const twoTrialWeeks = [
      on('2026-10-25', 'olcum-3b'),
      on('2026-10-25', 'olcum-3a', true),
      ...oneTrialWeek,
    ];
    expect(measurementReadings(gradeThree, twoTrialWeeks, trialOn, '2026-11-15')).toEqual([
      { passageId: 'olcum-3a', style: trialOn, trial: false },
      { passageId: 'olcum-3b', style: tried, trial: true },
    ]);
  });

  it('reads the same text in both styles in a one-text grade', () => {
    expect(
      measurementReadings(gradeTwo, [on('2026-11-08', 'olcum-2a')], trialOn, '2026-11-15'),
    ).toEqual([
      { passageId: 'olcum-2a', style: trialOn, trial: false },
      { passageId: 'olcum-2a', style: tried, trial: true },
    ]);
  });

  it('leaves only the missing reading of a half-done trial week', () => {
    const currentRead = [on('2026-11-08', 'olcum-3a'), on('2026-11-15', 'olcum-3b')];
    expect(measurementReadings(gradeThree, currentRead, trialOn, '2026-11-15')).toEqual([
      { passageId: 'olcum-3a', style: tried, trial: true },
    ]);
    // After one earlier trial week the tried style goes first.
    const triedRead = [
      on('2026-11-01', 'olcum-3a'),
      on('2026-11-01', 'olcum-3b', true),
      on('2026-11-08', 'olcum-3b'),
      on('2026-11-15', 'olcum-3b', true),
    ];
    expect(measurementReadings(gradeThree, triedRead, trialOn, '2026-11-15')).toEqual([
      { passageId: 'olcum-3a', style: trialOn, trial: false },
    ]);
  });

  it('drops a half-done trial week once its week is over', () => {
    const currentReadOnSunday = [on('2026-11-01', 'olcum-3a'), on('2026-11-08', 'olcum-3b')];
    expect(measurementReadings(gradeThree, currentReadOnSunday, trialOn, '2026-11-09')).toEqual([]);
    expect(measurementDue(currentReadOnSunday, trialOn, '2026-11-09', true)).toBe(false);
  });
});
