import { describe, expect, it } from 'vitest';
import { testAssessment, testReading, testSession } from '../test/sessions';
import {
  baselineOf,
  goalUpdate,
  reportWeeks,
  sessionDays,
  targetForWeek,
  weekComment,
  weekErrors,
  weekMeasurement,
  weekNumber,
} from './report';
import type { Assessment, GoalChange, ReadingResult, WordResult, WordStatus } from './types';

// 2026-11-09 is a Monday and 2026-11-15 the Sunday of its week.

/** The demo profile's measurements: the level check, four weeks, and two trial weeks. */
const demoLike: Assessment[] = [
  testAssessment('2026-10-11', 58),
  testAssessment('2026-10-18', 60),
  testAssessment('2026-10-25', 63),
  testAssessment('2026-11-01', 65),
  testAssessment('2026-11-08', 70, { trial: true }),
  testAssessment('2026-11-08', 67),
  testAssessment('2026-11-15', 74, { trial: true }),
  testAssessment('2026-11-15', 71),
];

function words(statuses: WordStatus[]): WordResult[] {
  return statuses.map((status, index) => ({
    index,
    status,
    tStart: index * 500,
    tEnd: index * 500 + 400,
  }));
}

function reading(statuses: WordStatus[]): ReadingResult {
  return testReading(1, { words: words(statuses) });
}

describe('weekMeasurement', () => {
  it('counts a Sunday measurement in its own week', () => {
    const sunday = [testAssessment('2026-11-15', 71)];
    expect(weekMeasurement(sunday, '2026-11-09')?.result.wcpm).toBe(71);
    expect(weekMeasurement(sunday, '2026-11-16')).toBeNull();
  });

  it('never takes the trial reading as the week’s value', () => {
    expect(weekMeasurement(demoLike, '2026-11-09')?.result.wcpm).toBe(71);
    expect(
      weekMeasurement([testAssessment('2026-11-15', 74, { trial: true })], '2026-11-09'),
    ).toBeNull();
  });

  it('takes the week’s last measurement', () => {
    const twice = [testAssessment('2026-11-15', 65), testAssessment('2026-11-09', 60)];
    expect(weekMeasurement(twice, '2026-11-09')?.result.wcpm).toBe(65);
  });
});

describe('baselineOf', () => {
  it('is the first measurement that is not a trial', () => {
    const withEarlyTrial = [testAssessment('2026-10-04', 61, { trial: true }), ...demoLike];
    expect(baselineOf(withEarlyTrial)?.result.wcpm).toBe(58);
    expect(baselineOf([])).toBeNull();
  });
});

describe('reportWeeks', () => {
  it('gives the Mondays of the weeks with a finished session or a measurement, oldest first', () => {
    const sessions = [
      testSession('2026-11-12', 3),
      testSession('2026-11-17', 4, { step: 'read', completedAt: undefined }),
    ];
    const assessments = [testAssessment('2026-10-11', 58)];
    expect(reportWeeks(sessions, assessments)).toEqual(['2026-10-05', '2026-11-09']);
  });

  it('crosses months and years', () => {
    const sessions = [testSession('2026-12-31', 5), testSession('2027-01-04', 6)];
    const assessments = [testAssessment('2027-01-03', 70), testAssessment('2026-11-01', 65)];
    expect(reportWeeks(sessions, assessments)).toEqual(['2026-10-26', '2026-12-28', '2027-01-04']);
  });

  it('leaves out a week with only a trial reading', () => {
    expect(reportWeeks([], [testAssessment('2026-11-15', 74, { trial: true })])).toEqual([]);
  });
});

describe('targetForWeek', () => {
  it('is null without a measurement and before the baseline’s week', () => {
    expect(targetForWeek([], undefined, '2026-11-09')).toBeNull();
    expect(targetForWeek(demoLike, undefined, '2026-09-28')).toBeNull();
  });

  it('is the baseline’s first target until a goal is set', () => {
    expect(targetForWeek(demoLike, undefined, '2026-10-05')).toBe(70);
    expect(targetForWeek(demoLike, [], '2026-11-09')).toBe(70);
  });

  it('applies a goal from the week after the one it was set in', () => {
    const setOnSunday: GoalChange[] = [{ targetWcpm: 78, setOn: '2026-11-15' }];
    expect(targetForWeek(demoLike, setOnSunday, '2026-11-09')).toBe(70);
    expect(targetForWeek(demoLike, setOnSunday, '2026-11-16')).toBe(78);
    const setOnMonday: GoalChange[] = [{ targetWcpm: 78, setOn: '2026-11-16' }];
    expect(targetForWeek(demoLike, setOnMonday, '2026-11-16')).toBe(70);
    expect(targetForWeek(demoLike, setOnMonday, '2026-11-23')).toBe(78);
  });

  it('takes the latest goal set before the week', () => {
    const goals: GoalChange[] = [
      { targetWcpm: 78, setOn: '2026-11-15' },
      { targetWcpm: 86, setOn: '2026-11-22' },
    ];
    expect(targetForWeek(demoLike, goals, '2026-11-16')).toBe(78);
    expect(targetForWeek(demoLike, goals, '2026-11-23')).toBe(86);
  });
});

describe('weekNumber', () => {
  it('counts calendar weeks from the baseline’s week, which is week 1', () => {
    expect(weekNumber(demoLike, '2026-10-05')).toBe(1);
    expect(weekNumber(demoLike, '2026-11-09')).toBe(6);
    expect(weekNumber(demoLike, '2026-09-28')).toBeNull();
    expect(weekNumber([], '2026-11-09')).toBeNull();
  });
});

describe('sessionDays', () => {
  it('marks the days from Monday to Sunday as done, read unheard or empty', () => {
    const sessions = [
      testSession('2026-11-08', 1),
      testSession('2026-11-09', 2),
      testSession('2026-11-10', 3, { unheard: true }),
      // Without the parent's consent no reading is stored (docs/kararlar.md P13).
      testSession('2026-11-11', 4, { readings: [] }),
      testSession('2026-11-12', 5, { step: 'read', completedAt: undefined }),
      testSession('2026-11-14', 6),
      testSession('2026-11-16', 7),
    ];
    expect(sessionDays(sessions, '2026-11-09')).toEqual([
      'done',
      'unheard',
      'unheard',
      'none',
      'none',
      'done',
      'none',
    ]);
  });
});

describe('weekErrors', () => {
  it('counts the five error types in the week’s session readings, not help or self-corrections', () => {
    const sessions = [
      testSession('2026-11-09', 2, {
        readings: [
          reading(['correct', 'misread', 'suffix', 'helped', 'selfCorrected', 'misread']),
          reading(['skipped', 'repeated', 'correct', 'inserted', 'helped']),
        ],
      }),
      testSession('2026-11-12', 3, {
        step: 'read',
        completedAt: undefined,
        readings: [reading(['suffix', 'correct'])],
      }),
      testSession('2026-11-16', 4, { readings: [reading(['misread', 'skipped'])] }),
    ];
    expect(weekErrors(sessions, '2026-11-09')).toEqual({
      misread: 2,
      suffix: 2,
      skipped: 1,
      repeated: 1,
      inserted: 1,
    });
    expect(weekErrors([], '2026-11-09')).toEqual({
      misread: 0,
      suffix: 0,
      skipped: 0,
      repeated: 0,
      inserted: 0,
    });
  });
});

describe('weekComment', () => {
  it('says the target was passed, with the next target (docs/ekranlar.md, V1)', () => {
    expect(weekComment(demoLike, undefined, '2026-11-09', true)).toEqual({
      kind: 'passed',
      nextTarget: 78,
    });
  });

  it('counts reaching the target exactly as passing it', () => {
    const exactly = [testAssessment('2026-10-11', 58), testAssessment('2026-11-15', 70)];
    expect(weekComment(exactly, undefined, '2026-11-09', true)).toEqual({
      kind: 'passed',
      nextTarget: 78,
    });
  });

  it('says how far the target is when the week is below it', () => {
    expect(weekComment(demoLike, undefined, '2026-11-02', true)).toEqual({
      kind: 'below',
      gap: 3,
    });
  });

  it('says the first measurement was made in the baseline’s week', () => {
    expect(weekComment(demoLike, undefined, '2026-10-05', true)).toEqual({
      kind: 'baseline',
      target: 70,
    });
  });

  it('says no measurement was made, or that listening is off', () => {
    expect(weekComment(demoLike, undefined, '2026-11-16', true)).toEqual({
      kind: 'noMeasurement',
    });
    expect(weekComment(demoLike, undefined, '2026-11-16', false)).toEqual({
      kind: 'listeningOff',
    });
  });

  it('keeps a measured week’s comment after the consent is withdrawn', () => {
    expect(weekComment(demoLike, undefined, '2026-11-09', false)).toEqual({
      kind: 'passed',
      nextTarget: 78,
    });
  });
});

describe('goalUpdate', () => {
  it('offers the next target when the last measurement passed its week’s target', () => {
    expect(goalUpdate(demoLike, undefined)).toBe(78);
    const withLaterTrial = [...demoLike, testAssessment('2026-11-22', 90, { trial: true })];
    expect(goalUpdate(withLaterTrial, undefined)).toBe(78);
  });

  it('offers nothing when the last measurement is below its week’s target', () => {
    expect(goalUpdate([...demoLike, testAssessment('2026-11-22', 69)], undefined)).toBeNull();
    const higherBefore: GoalChange[] = [{ targetWcpm: 72, setOn: '2026-10-20' }];
    expect(goalUpdate(demoLike, higherBefore)).toBeNull();
    expect(goalUpdate([], undefined)).toBeNull();
  });

  it('offers nothing once that target or a higher one is set', () => {
    expect(goalUpdate(demoLike, [{ targetWcpm: 78, setOn: '2026-11-15' }])).toBeNull();
    expect(goalUpdate(demoLike, [{ targetWcpm: 90, setOn: '2026-11-15' }])).toBeNull();
  });

  it('offers the following target after the new one is passed', () => {
    const nextWeek = [...demoLike, testAssessment('2026-11-22', 80)];
    expect(goalUpdate(nextWeek, [{ targetWcpm: 78, setOn: '2026-11-15' }])).toBe(86);
  });
});
