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
