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

/** Days until a card is due again after one, two and three correct warmups in a row. */
export const tamingIntervalsDays = [1, 2, 4] as const;

/** Accuracy floors of the reading levels (docs/kararlar.md P7). */
export const readingLevelFloors = { instructional: 0.9, independent: 0.99 } as const;

/** Measurements each reading style needs before V4 recommends one (docs/urun.md section 7). */
export const trialMeasurementsNeeded = 4;

/** Under this many correct words a minute the two styles' difference is small (docs/urun.md section 7). */
export const trialSmallDifference = 5;
