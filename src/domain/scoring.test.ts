import { describe, expect, it } from 'vitest';
import {
  countMiscues,
  isCountedError,
  readingLevel,
  scoreReading,
  toReadingResult,
  type ReadingMeta,
} from './scoring';
import type { ReadingStyle, WordResult, WordStatus } from './types';

function results(statuses: readonly WordStatus[]): WordResult[] {
  return statuses.map((status, index) => ({
    index,
    status,
    tStart: index * 500,
    tEnd: index * 500 + 400,
  }));
}

function repeat(status: WordStatus, times: number): WordStatus[] {
  return Array.from({ length: times }, () => status);
}

const readingStyle: ReadingStyle = {
  font: 'clear',
  sizeStep: 1,
  spacingStep: 1,
  trialEnabled: false,
};

describe('scoreReading', () => {
  it('scores the V3 example: 76 read, 5 counted errors, 71 correct words in a minute', () => {
    const words = results([...repeat('misread', 3), 'suffix', 'skipped', ...repeat('correct', 71)]);
    const score = scoreReading(words, 60);

    expect(score).toMatchObject({
      wordsAttempted: 76,
      countedErrors: 5,
      correctWords: 71,
      wcpm: 71,
    });
    expect(Math.round(score.accuracy * 100)).toBe(93);
    expect(readingLevel(score.accuracy)).toBe('instructional');
  });

  it('counts repetitions, insertions and self-corrections without deducting them', () => {
    const score = scoreReading(
      results(['repeated', 'inserted', 'selfCorrected', ...repeat('correct', 7)]),
      10,
    );

    expect(score.correctWords).toBe(10);
    expect(score.accuracy).toBe(1);
    expect(score.wcpm).toBe(60);
  });

  it('deducts a helped word', () => {
    const score = scoreReading(results(['helped', 'correct', 'correct', 'correct']), 6);

    expect(score.countedErrors).toBe(1);
    expect(score.correctWords).toBe(3);
    expect(score.accuracy).toBe(0.75);
  });

  it('gives zeros, never NaN, for an empty reading or zero seconds', () => {
    expect(scoreReading([], 0)).toEqual({
      wordsAttempted: 0,
      countedErrors: 0,
      correctWords: 0,
      wcpm: 0,
      accuracy: 0,
    });
    expect(scoreReading(results(['correct']), 0).wcpm).toBe(0);
  });
});

describe('isCountedError', () => {
  it('deducts misread, suffix, skipped and helped words only', () => {
    const statuses: WordStatus[] = [
      'correct',
      'misread',
      'suffix',
      'skipped',
      'repeated',
      'inserted',
      'selfCorrected',
      'helped',
    ];
    expect(statuses.filter(isCountedError)).toEqual(['misread', 'suffix', 'skipped', 'helped']);
  });
});

describe('readingLevel', () => {
  it.each([
    [0.8999, 'frustration'],
    [0.9, 'instructional'],
    [0.9899, 'instructional'],
    [0.99, 'independent'],
    [1, 'independent'],
  ] as const)('reads accuracy %s as %s', (accuracy, level) => {
    expect(readingLevel(accuracy)).toBe(level);
  });
});

describe('countMiscues', () => {
  it('counts every miscue type separately and leaves correct words out', () => {
    const counts = countMiscues(
      results([
        ...repeat('misread', 9),
        ...repeat('suffix', 7),
        ...repeat('skipped', 6),
        ...repeat('repeated', 5),
        ...repeat('inserted', 3),
        'helped',
        ...repeat('correct', 40),
      ]),
    );

    expect(counts).toEqual({
      misread: 9,
      suffix: 7,
      skipped: 6,
      repeated: 5,
      inserted: 3,
      selfCorrected: 0,
      helped: 1,
    });
  });
});

describe('toReadingResult', () => {
  it('carries the meta fields and the score, and passes the prosody score through', () => {
    const words = results(['correct', 'misread', 'correct', 'correct']);
    const meta: ReadingMeta = {
      chapterRef: { bookId: 'kayip-fenerin-izinde', chapter: 4 },
      attempt: 2,
      startedAt: '2026-11-19T08:00:00.000Z',
      readingStyle,
      recordingId: 'kayit-1',
    };

    expect(toReadingResult({ words, seconds: 3, prosodyScore: 3 }, meta)).toEqual({
      chapterRef: { bookId: 'kayip-fenerin-izinde', chapter: 4 },
      attempt: 2,
      startedAt: '2026-11-19T08:00:00.000Z',
      seconds: 3,
      words,
      wordsAttempted: 4,
      correctWords: 3,
      wcpm: 60,
      accuracy: 0.75,
      prosodyScore: 3,
      recordingId: 'kayit-1',
      readingStyle,
    });
  });

  it('leaves out what the reading does not have', () => {
    const result = toReadingResult(
      { words: results(['correct']), seconds: 1 },
      { startedAt: '2026-11-19T08:00:00.000Z', readingStyle },
    );

    expect(Object.keys(result).sort()).toEqual([
      'accuracy',
      'correctWords',
      'readingStyle',
      'seconds',
      'startedAt',
      'wcpm',
      'words',
      'wordsAttempted',
    ]);
  });
});
