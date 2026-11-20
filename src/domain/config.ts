// Product parameters (docs/kararlar.md P7). Starting values, to be calibrated with a teacher.
import type { Grade } from './types';

export interface GradeLimits {
  maxSyllablesPerWord: number;
  maxWordsPerSentence: number;
}

/** docs/urun.md section 6: upper limits per grade, inclusive. */
export const gradeLimits: Readonly<Record<Grade, Readonly<GradeLimits>>> = {
  1: { maxSyllablesPerWord: 2.2, maxWordsPerSentence: 5 },
  2: { maxSyllablesPerWord: 2.4, maxWordsPerSentence: 6 },
  3: { maxSyllablesPerWord: 2.7, maxWordsPerSentence: 8 },
  4: { maxSyllablesPerWord: 2.9, maxWordsPerSentence: 10 },
};

/** A hesitation this long opens the help bubble (docs/urun.md section 2). */
export const helpThresholdMs = 3000;

/** A hesitation at least this long gets the dotted mark and counts as a stumble. */
export const hesitationMarkMs = 1000;

export const readingsPerSession = 3;

/** The daily session's length in minutes, shown on G1 (docs/urun.md section 3). */
export const sessionMinutes = 12;

/** Cards due for the warmup are capped at this many. */
export const warmupCardLimit = 3;

/** Words per minute the goal rises each week. */
export const goalGainPerWeek = 2;

/** The first goal spans this many weeks. */
export const goalWeeks = 6;

/** Once a goal is reached, the next one is this much higher. */
export const nextGoalStep = 8;

/**
 * The grade average line on V1's chart (docs/urun.md section 2; docs/kararlar.md P8, to be checked
 * against a source). Grades 1 and 2 have none and draw no line.
 */
export const gradeAverageWcpm: Readonly<Partial<Record<Grade, number>>> = { 3: 90, 4: 98 };

/** Days until a card is due again after one, two and three correct warmups in a row. */
export const tamingIntervalsDays = [1, 2, 4] as const;

/** Accuracy floors of the reading levels (docs/kararlar.md P7). */
export const readingLevelFloors = { instructional: 0.9, independent: 0.99 } as const;

/** K2: the reader's name is at most this long (docs/planlar/faz-3.md, karar 12). */
export const readerNameMaxLength = 30;

/** K2: the reader picks at most this many interests (docs/ekranlar.md, K2). */
export const readerInterestLimit = 3;

/** K3: the level check reads for one minute of reading time (docs/ekranlar.md, K3). */
export const assessmentMs = 60_000;

/**
 * K3: a word the child is finishing as the minute ends still counts, as when an adult times the
 * minute; the reading stops this long after it.
 */
export const assessmentGraceMs = 250;

/** K3's measurement text is paged at most this many words a page (docs/planlar/faz-3.md, karar 14). */
export const passagePageWords = 25;

/** Wrong answers before the parent gate makes the next try wait (docs/kararlar.md P11). */
export const parentGateAttempts = 3;

/** The parent gate's wait after the wrong answers. */
export const parentGateWaitMs = 30_000;

/** Measurements each reading style needs before V4 recommends one (docs/urun.md section 7). */
export const trialMeasurementsNeeded = 4;

/** Under this many correct words a minute the two styles' difference is small (docs/urun.md section 7). */
export const trialSmallDifference = 5;
