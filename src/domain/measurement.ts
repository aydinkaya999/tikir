// The weekly one-minute measurement (docs/kararlar.md P16; docs/planlar/faz-4.md, kararlar 28–31).
import { measurementIntervalDays } from './config';
import { addDays, daysBetween, weekStart } from './date';
import { trialReadingStyle } from './readingStyle';
import type { Assessment, Id, LocalDate, Passage, ReadingStyle } from './types';

/** One reading of the open measurement: its text, the style it is read in, and whether it is the trial. */
export interface PlannedReading {
  passageId: Id;
  style: ReadingStyle;
  trial: boolean;
}

function lastMeasurement(assessments: readonly Assessment[]): Assessment | null {
  return (
    assessments
      .filter((assessment) => assessment.trial !== true)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.result.startedAt.localeCompare(b.result.startedAt),
      )
      .at(-1) ?? null
  );
}

/** Seven days after the last measurement that is not a trial reading; none before the first. */
export function nextMeasurementOn(assessments: readonly Assessment[]): LocalDate | null {
  const last = lastMeasurement(assessments);
  return last === null ? null : addDays(last.date, measurementIntervalDays);
}

/** The weeks before `week` in which both styles were read. */
function trialWeeksBefore(assessments: readonly Assessment[], week: LocalDate): number {
  const weeks = new Map<LocalDate, { current: boolean; trial: boolean }>();
  for (const assessment of assessments) {
    const start = weekStart(assessment.date);
    if (start >= week) {
      continue;
    }
    const entry = weeks.get(start) ?? { current: false, trial: false };
    if (assessment.trial === true) {
      entry.trial = true;
    } else {
      entry.current = true;
    }
    weeks.set(start, entry);
  }
  return [...weeks.values()].filter((entry) => entry.current && entry.trial).length;
}

/**
 * The trial flags of the readings still to make, in reading order; none when nothing is open.
 * A due measurement is open until made. In a trial week the style read first turns with each
 * earlier trial week, and a reading already made this week is not asked again. A trial week left
 * half done stays open for its missing reading until the week is over.
 */
function openReadings(
  assessments: readonly Assessment[],
  style: ReadingStyle,
  today: LocalDate,
): boolean[] {
  const week = weekStart(today);
  const thisWeek = assessments.filter((assessment) => weekStart(assessment.date) === week);
  const trialMade = thisWeek.some((assessment) => assessment.trial === true);
  const due = nextMeasurementOn(assessments);
  if (due === null || daysBetween(due, today) >= 0) {
    const order = !style.trialEnabled
      ? [false]
      : trialWeeksBefore(assessments, week) % 2 === 0
        ? [false, true]
        : [true, false];
    return order.filter((trial) => !(trial && trialMade));
  }
  const currentMade = thisWeek.some((assessment) => assessment.trial !== true);
  return style.trialEnabled && currentMade && !trialMade ? [true] : [];
}

/** Whether G1 shows the measurement card: never without the parent's consent (karar 28). */
export function measurementDue(
  assessments: readonly Assessment[],
  style: ReadingStyle,
  today: LocalDate,
  voiceConsent: boolean,
): boolean {
  return voiceConsent && openReadings(assessments, style, today).length > 0;
}

function textAfter(ids: readonly Id[], id: Id | undefined): Id | undefined {
  const position = id === undefined ? -1 : ids.indexOf(id);
  return ids[(position + 1) % ids.length];
}

/**
 * The open measurement's readings (karar 30): the grade's texts in id order, the one after the
 * last measurement's, and for the trial reading the one after that; a one-text grade reads its
 * text twice.
 */
export function measurementReadings(
  passages: readonly Passage[],
  assessments: readonly Assessment[],
  style: ReadingStyle,
  today: LocalDate,
): PlannedReading[] {
  const ids = passages.map((passage) => passage.id).sort();
  const last = lastMeasurement(assessments);
  // A half-done trial week already has this week's current-style reading.
  const current =
    last !== null && weekStart(last.date) === weekStart(today)
      ? last.passageId
      : textAfter(ids, last?.passageId);
  const trialText = textAfter(ids, current);
  if (current === undefined || trialText === undefined) {
    return [];
  }
  return openReadings(assessments, style, today).map((trial) =>
    trial
      ? { passageId: trialText, style: trialReadingStyle(style), trial }
      : { passageId: current, style, trial },
  );
}
