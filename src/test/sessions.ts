// Session fixtures for domain and service tests.
import type { Attempt, LocalDate, ReadingResult, ReadingStyle, Session } from '../domain/types';

export const testReadingStyle: ReadingStyle = {
  font: 'clear',
  sizeStep: 1,
  spacingStep: 1,
  trialEnabled: false,
};

export function testReading(attempt: Attempt, fields: Partial<ReadingResult> = {}): ReadingResult {
  return {
    attempt,
    startedAt: '2026-11-19T08:00:00.000Z',
    seconds: 90,
    words: [],
    wordsAttempted: 98,
    correctWords: 96,
    wcpm: 64,
    accuracy: 96 / 98,
    readingStyle: testReadingStyle,
    ...fields,
  };
}

/** A completed session of a chapter, with the given readings (all three by default). */
export function testSession(
  date: LocalDate,
  chapter: number,
  fields: Partial<Session> = {},
  bookId = 'kayip-fenerin-izinde',
): Session {
  return {
    id: `seans-${date}`,
    childId: 'cocuk',
    date,
    chapterRef: { bookId, chapter },
    step: 'done',
    readings: [testReading(1), testReading(2), testReading(3)],
    answers: [],
    tamedToday: [],
    startedAt: `${date}T08:00:00.000Z`,
    completedAt: `${date}T08:20:00.000Z`,
    ...fields,
  };
}
