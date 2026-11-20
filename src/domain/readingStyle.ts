// The child's reading style (docs/urun.md section 7; docs/planlar/faz-3.md, karar 22): the default
// for a grade, the style tried beside the current one, and V4's comparison of the two.
import { trialMeasurementsNeeded, trialSmallDifference } from './config';
import { weekStart } from './date';
import type { Assessment, Grade, LocalDate, ReadingStyle } from './types';

/** Grades 1–2 read school letters, 3–4 clear letters; the middle size and normal spacing. */
export function defaultReadingStyle(grade: Grade): ReadingStyle {
  return {
    font: grade <= 2 ? 'school' : 'clear',
    sizeStep: 1,
    spacingStep: 0,
    trialEnabled: false,
  };
}

/** The style measured beside the current one: one spacing step wider, or narrower at the widest. */
export function trialReadingStyle(style: ReadingStyle): ReadingStyle {
  return { ...style, spacingStep: style.spacingStep === 0 ? 1 : style.spacingStep === 1 ? 2 : 1 };
}

/** Two styles read alike: the same font, size and spacing (the trial switch aside). */
export function sameReadingStyle(a: ReadingStyle, b: ReadingStyle): boolean {
  return a.font === b.font && a.sizeStep === b.sizeStep && a.spacingStep === b.spacingStep;
}

export interface StyleAverage {
  style: ReadingStyle;
  average: number | null;
  count: number;
}

export type TrialState = 'none' | 'collecting' | 'smallDifference' | 'recommend';

export interface TrialComparison {
  current: StyleAverage;
  trial: StyleAverage;
  state: TrialState;
  /** Measurements still needed before a decision ('collecting'). */
  remaining: number;
  /** The style that reads better, only when one is recommended. */
  better: 'current' | 'trial' | null;
}

function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * V4's "Hangi ayar daha iyi?": only the weeks read in both styles count, the current style's
 * ordinary measurement against the tried style's trial one (docs/planlar/faz-3.md, karar 22).
 * Another current style (font, size or spacing) starts the comparison again.
 */
export function trialComparison(
  assessments: readonly Assessment[],
  style: ReadingStyle,
): TrialComparison {
  const tried = trialReadingStyle(style);
  const weeks = new Map<LocalDate, { current: number[]; trial: number[] }>();
  for (const assessment of assessments) {
    const week = weekStart(assessment.date);
    const entry = weeks.get(week) ?? { current: [], trial: [] };
    const read = assessment.result.readingStyle;
    if (assessment.trial === true) {
      if (sameReadingStyle(read, tried)) {
        entry.trial.push(assessment.result.wcpm);
      }
    } else if (sameReadingStyle(read, style)) {
      entry.current.push(assessment.result.wcpm);
    }
    weeks.set(week, entry);
  }
  const paired = [...weeks.values()].filter(
    (week) => week.current.length > 0 && week.trial.length > 0,
  );
  const currentValues = paired.flatMap((week) => week.current);
  const trialValues = paired.flatMap((week) => week.trial);
  const currentMean = mean(currentValues);
  const trialMean = mean(trialValues);
  const count = Math.min(currentValues.length, trialValues.length);
  const result = {
    current: {
      style,
      average: currentMean === null ? null : Math.round(currentMean),
      count: currentValues.length,
    },
    trial: {
      style: tried,
      average: trialMean === null ? null : Math.round(trialMean),
      count: trialValues.length,
    },
    remaining: Math.max(0, trialMeasurementsNeeded - count),
  };
  if (count === 0 || currentMean === null || trialMean === null) {
    return { ...result, state: 'none', better: null };
  }
  if (count < trialMeasurementsNeeded) {
    return { ...result, state: 'collecting', better: null };
  }
  if (Math.abs(trialMean - currentMean) < trialSmallDifference) {
    return { ...result, state: 'smallDifference', better: null };
  }
  return { ...result, state: 'recommend', better: trialMean > currentMean ? 'trial' : 'current' };
}
