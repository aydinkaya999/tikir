// Scoring a reading (docs/urun.md section 2). Every result in the list is a word the child
// reached; words never reached are not in the list.
import { readingLevelFloors } from './config';
import type {
  Attempt,
  ChapterRef,
  Id,
  MiscueType,
  ReadingLevel,
  ReadingOutcome,
  ReadingResult,
  ReadingStyle,
  WordResult,
  WordStatus,
} from './types';

const countedErrors: ReadonlySet<WordStatus> = new Set<WordStatus>([
  'misread',
  'suffix',
  'skipped',
  'helped',
]);

/** Deducted from the correct words. Repetitions, insertions and self-corrections are not. */
export function isCountedError(status: WordStatus): boolean {
  return countedErrors.has(status);
}

export interface ReadingScore {
  wordsAttempted: number;
  countedErrors: number;
  correctWords: number;
  wcpm: number;
  /** Unrounded; the screen rounds. */
  accuracy: number;
}

export function scoreReading(words: readonly WordResult[], seconds: number): ReadingScore {
  const wordsAttempted = words.length;
  const errors = words.filter((word) => isCountedError(word.status)).length;
  const correctWords = wordsAttempted - errors;
  return {
    wordsAttempted,
    countedErrors: errors,
    correctWords,
    wcpm: seconds > 0 ? Math.round((correctWords * 60) / seconds) : 0,
    accuracy: wordsAttempted > 0 ? correctWords / wordsAttempted : 0,
  };
}

/** Decided on the unrounded accuracy. */
export function readingLevel(accuracy: number): ReadingLevel {
  if (accuracy >= readingLevelFloors.independent) {
    return 'independent';
  }
  return accuracy >= readingLevelFloors.instructional ? 'instructional' : 'frustration';
}

export function countMiscues(words: readonly WordResult[]): Record<MiscueType, number> {
  const counts: Record<MiscueType, number> = {
    misread: 0,
    suffix: 0,
    skipped: 0,
    repeated: 0,
    inserted: 0,
    selfCorrected: 0,
    helped: 0,
  };
  for (const word of words) {
    if (word.status !== 'correct') {
      counts[word.status] += 1;
    }
  }
  return counts;
}

/** What a reading result carries besides the listener's outcome. */
export interface ReadingMeta {
  chapterRef?: ChapterRef;
  attempt?: Attempt;
  startedAt: string;
  readingStyle: ReadingStyle;
  recordingId?: Id;
}

export function toReadingResult(outcome: ReadingOutcome, meta: ReadingMeta): ReadingResult {
  const score = scoreReading(outcome.words, outcome.seconds);
  const result: ReadingResult = {
    startedAt: meta.startedAt,
    seconds: outcome.seconds,
    words: outcome.words,
    wordsAttempted: score.wordsAttempted,
    correctWords: score.correctWords,
    wcpm: score.wcpm,
    accuracy: score.accuracy,
    readingStyle: meta.readingStyle,
  };
  if (meta.chapterRef !== undefined) {
    result.chapterRef = meta.chapterRef;
  }
  if (meta.attempt !== undefined) {
    result.attempt = meta.attempt;
  }
  if (outcome.prosodyScore !== undefined) {
    result.prosodyScore = outcome.prosodyScore;
  }
  if (meta.recordingId !== undefined) {
    result.recordingId = meta.recordingId;
  }
  return result;
}
