// The weekly report (V1, V2): weeks, the goal line, session days, error counts and the comment
// (docs/ekranlar.md, "Veli karnesi"; docs/planlar/faz-4.md, kararlar 1, 2, 9 and 11–18).
import { addDays, daysBetween, weekStart } from './date';
import { firstTarget, nextTarget, weeklyGoalStatus } from './goals';
import type { Assessment, GoalChange, LocalDate, Session, WordStatus } from './types';

/** A day on V1's strip: a finished session, one read without listening, or none. */
export type DayMark = 'done' | 'unheard' | 'none';

/** The error types V2 counts, in the design's order. Help and self-corrections are not errors here. */
export const reportErrorTypes = ['misread', 'suffix', 'skipped', 'repeated', 'inserted'] as const;

export type ReportErrorType = (typeof reportErrorTypes)[number];

export type WeekErrors = Record<ReportErrorType, number>;

export type WeekComment =
  | { kind: 'listeningOff' }
  | { kind: 'noMeasurement' }
  | { kind: 'baseline'; target: number }
  | { kind: 'passed'; nextTarget: number }
  | { kind: 'below'; gap: number };

/** The measurements the report counts: a trial week's reading in the tried style is not one. */
function counted(assessments: readonly Assessment[]): Assessment[] {
  return assessments.filter((assessment) => assessment.trial !== true);
}

function byTime(a: Assessment, b: Assessment): number {
  return a.date.localeCompare(b.date) || a.result.startedAt.localeCompare(b.result.startedAt);
}

function isReportError(status: WordStatus): status is ReportErrorType {
  return reportErrorTypes.some((type) => type === status);
}

function inWeek(date: LocalDate, week: LocalDate): boolean {
  return weekStart(date) === week;
}

/** The week's value: its last measurement that is not a trial reading. */
export function weekMeasurement(
  assessments: readonly Assessment[],
  week: LocalDate,
): Assessment | null {
  return (
    counted(assessments)
      .filter((assessment) => inWeek(assessment.date, week))
      .sort(byTime)
      .at(-1) ?? null
  );
}

/** The first measurement that is not a trial reading: the level check or the first weekly one. */
export function baselineOf(assessments: readonly Assessment[]): Assessment | null {
  return counted(assessments).sort(byTime).at(0) ?? null;
}

/** The Mondays of the weeks with a finished session or a measurement, oldest first. */
export function reportWeeks(
  sessions: readonly Session[],
  assessments: readonly Assessment[],
): LocalDate[] {
  const weeks = new Set<LocalDate>();
  for (const session of sessions) {
    if (session.completedAt !== undefined) {
      weeks.add(weekStart(session.date));
    }
  }
  for (const assessment of counted(assessments)) {
    weeks.add(weekStart(assessment.date));
  }
  return [...weeks].sort();
}

/**
 * The week's target: the last goal set before the week's Monday, else the baseline's first target.
 * None before the baseline's week; a goal set inside a week holds from the next one (karar 1).
 */
export function targetForWeek(
  assessments: readonly Assessment[],
  goals: readonly GoalChange[] | undefined,
  week: LocalDate,
): number | null {
  const baseline = baselineOf(assessments);
  if (baseline === null || week < weekStart(baseline.date)) {
    return null;
  }
  const set = (goals ?? [])
    .filter((goal) => daysBetween(goal.setOn, week) > 0)
    .sort((a, b) => a.setOn.localeCompare(b.setOn));
  return set.at(-1)?.targetWcpm ?? firstTarget(baseline.result.wcpm);
}

/** The week's number on the chart, counting calendar weeks from the baseline's, which is week 1. */
export function weekNumber(assessments: readonly Assessment[], week: LocalDate): number | null {
  const baseline = baselineOf(assessments);
  if (baseline === null) {
    return null;
  }
  const weeks = daysBetween(weekStart(baseline.date), week) / 7;
  return weeks < 0 ? null : weeks + 1;
}

/**
 * Monday to Sunday. A finished session is unheard when the microphone was given up (P14) or when
 * it stored no reading, as without the parent's consent (P13); today's consent plays no part (karar 9).
 */
export function sessionDays(sessions: readonly Session[], week: LocalDate): DayMark[] {
  return Array.from({ length: 7 }, (_, offset): DayMark => {
    const day = addDays(week, offset);
    const session = sessions.find((each) => each.date === day);
    if (session?.completedAt === undefined) {
      return 'none';
    }
    return session.unheard === true || session.readings.length === 0 ? 'unheard' : 'done';
  });
}

/** The errors in the week's stored session readings; measurements are not sessions (V2). */
export function weekErrors(sessions: readonly Session[], week: LocalDate): WeekErrors {
  const errors: WeekErrors = { misread: 0, suffix: 0, skipped: 0, repeated: 0, inserted: 0 };
  for (const session of sessions) {
    if (!inWeek(session.date, week)) {
      continue;
    }
    for (const reading of session.readings) {
      for (const word of reading.words) {
        if (isReportError(word.status)) {
          errors[word.status] += 1;
        }
      }
    }
  }
  return errors;
}

/**
 * V1's sentence (karar 15). A measured week is judged by its measurement, whatever today's
 * consent; a week without one says why.
 */
export function weekComment(
  assessments: readonly Assessment[],
  goals: readonly GoalChange[] | undefined,
  week: LocalDate,
  voiceConsent: boolean,
): WeekComment {
  const measurement = weekMeasurement(assessments, week);
  const target = targetForWeek(assessments, goals, week);
  if (measurement === null || target === null) {
    return voiceConsent ? { kind: 'noMeasurement' } : { kind: 'listeningOff' };
  }
  if (measurement.id === baselineOf(assessments)?.id) {
    return { kind: 'baseline', target };
  }
  const status = weeklyGoalStatus(measurement.result.wcpm, target);
  return status.passed
    ? { kind: 'passed', nextTarget: status.nextTarget }
    : { kind: 'below', gap: target - measurement.result.wcpm };
}

/**
 * The target "Hedefi güncelle" offers (karar 2): the next one, when the last measurement passed
 * its week's target and no goal that high is set yet; otherwise none.
 */
export function goalUpdate(
  assessments: readonly Assessment[],
  goals: readonly GoalChange[] | undefined,
): number | null {
  const last = counted(assessments).sort(byTime).at(-1);
  if (last === undefined) {
    return null;
  }
  const target = targetForWeek(assessments, goals, weekStart(last.date));
  if (target === null || last.result.wcpm < target) {
    return null;
  }
  const offered = nextTarget(target);
  const latest = [...(goals ?? [])].sort((a, b) => a.setOn.localeCompare(b.setOn)).at(-1);
  return latest !== undefined && latest.targetWcpm >= offered ? null : offered;
}
