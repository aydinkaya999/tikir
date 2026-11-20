import { describe, expect, it } from 'vitest';
import { testReading, testSession } from '../test/sessions';
import {
  chapterTileState,
  completedSeriesChapters,
  deltaFromPrevious,
  nextSeriesChapter,
  recordedChapters,
  sessionMinutesSpent,
  streakDays,
} from './progress';
import type { Book } from './types';

const seriesId = 'kayip-fenerin-izinde';

function seriesBook(chapterCount: number): Book {
  return {
    id: seriesId,
    title: 'Kayıp Fenerin İzinde',
    grade: 3,
    source: 'series',
    totalChapters: 12,
    chapters: Array.from({ length: chapterCount }, (_, index) => ({
      number: index + 1,
      title: `Bölüm ${index + 1}`,
      pages: [],
      questions: [],
      chains: {},
    })),
  };
}

const sessions = [
  testSession('2026-11-16', 1, {}, 'uzay-istasyonunda-gizemli-ses'),
  testSession('2026-11-17', 1),
  testSession('2026-11-19', 2),
  testSession('2026-11-20', 3),
  testSession('2026-11-21', 4, { step: 'read', completedAt: undefined }),
];

describe('series chapters', () => {
  it('lists the completed chapters of the series, not library books or open sessions', () => {
    expect(completedSeriesChapters(sessions, seriesId)).toEqual([1, 2, 3]);
  });

  it("makes today's chapter the one after the last completed", () => {
    expect(nextSeriesChapter(sessions, seriesBook(5))).toBe(4);
    expect(nextSeriesChapter([], seriesBook(5))).toBe(1);
  });

  it('gives null when the written chapters run out', () => {
    const allDone = [
      ...sessions.slice(0, 4),
      testSession('2026-11-21', 4),
      testSession('2026-11-22', 5),
    ];
    expect(nextSeriesChapter(allDone, seriesBook(5))).toBeNull();
  });
});

describe('streakDays', () => {
  const today = '2026-11-21';

  it.each([
    [['2026-11-16', '2026-11-17', '2026-11-19', '2026-11-20'], 2],
    [['2026-11-16', '2026-11-17', '2026-11-19', '2026-11-20', '2026-11-21'], 3],
    [['2026-11-19'], 0],
    [['2026-11-21'], 1],
    [[], 0],
  ])('counts %j as %i days in a row', (dates, days) => {
    expect(streakDays(dates, today)).toBe(days);
  });
});

describe('deltaFromPrevious', () => {
  it('gives the gain over the previous session only when it is positive', () => {
    expect(deltaFromPrevious(71, 67)).toBe(4);
    expect(deltaFromPrevious(67, 67)).toBeNull();
    expect(deltaFromPrevious(60, 67)).toBeNull();
    expect(deltaFromPrevious(71, null)).toBeNull();
  });
});

describe('chapterTileState', () => {
  it('marks completed, today and locked chapters', () => {
    expect(chapterTileState(3, [1, 2, 3], 4)).toBe('done');
    expect(chapterTileState(4, [1, 2, 3], 4)).toBe('today');
    expect(chapterTileState(5, [1, 2, 3], 4)).toBe('locked');
    expect(chapterTileState(4, [1, 2, 3], null)).toBe('locked');
  });
});

describe('recordedChapters', () => {
  it('lists the chapters of a book whose third reading has a recording, once each', () => {
    const recorded = [testReading(1), testReading(2), testReading(3, { recordingId: 'kayit' })];
    const sessions = [
      testSession('2026-11-17', 1, { readings: recorded }),
      testSession('2026-11-18', 2),
      testSession('2026-11-19', 3, { readings: recorded }),
      testSession('2026-11-20', 3, { readings: recorded }),
      testSession('2026-11-16', 1, { readings: recorded }, 'uzay-istasyonunda-gizemli-ses'),
    ];

    expect(recordedChapters(sessions, seriesId)).toEqual([1, 3]);
  });
});

describe('sessionMinutesSpent', () => {
  it('rounds the time from start to completion to whole minutes, at least one', () => {
    const at = (time: string) => `2026-11-21T${time}.000Z`;
    const table: [string, string | undefined, number | null][] = [
      ['09:00:00', '09:12:00', 12],
      ['09:00:00', '09:12:31', 13],
      ['09:00:00', '09:00:20', 1],
      ['09:00:00', undefined, null],
    ];
    for (const [start, end, expected] of table) {
      const session = testSession('2026-11-21', 4, {
        startedAt: at(start),
        completedAt: end === undefined ? undefined : at(end),
      });
      expect(sessionMinutesSpent(session)).toBe(expected);
    }
  });
});
