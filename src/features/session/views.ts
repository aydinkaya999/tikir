// What the session screens show, from the session store's data (docs/ekranlar.md, G1 and G7).
// Pure: the screens draw it.
import type { TilePattern } from '../../components/illustrations';
import {
  chapterTileState,
  completedSeriesChapters,
  nextSeriesChapter,
  streakDays,
  type TileState,
} from '../../domain/progress';
import type { Book } from '../../domain/types';
import type { SessionData } from './sessionStore';

export interface ChapterLine {
  number: number;
  title: string;
}

export interface RoadView {
  state: 'start' | 'resume' | 'done' | 'seriesEnd';
  childName: string;
  /** Days in a row; null below two (docs/ekranlar.md, G1). */
  streak: number | null;
  /** Today's chapter; null when the series has no chapter left to read. */
  chapter: ChapterLine | null;
  /** Tomorrow's chapter once today's session is done, if it is written. */
  tomorrow: ChapterLine | null;
  completed: number;
  totalChapters: number;
  bookTitle: string;
  tiles: { chapter: number; state: TileState; pattern: TilePattern }[];
}

const tilePatterns: readonly TilePattern[] = [1, 2, 3, 4, 5, 6];

/** A chapter's tile pattern: the six patterns in turn (cini-1 … cini-6). */
export function chapterPattern(chapter: number): TilePattern {
  return tilePatterns[(chapter - 1) % tilePatterns.length] ?? 1;
}

function chapterLine(book: Book, number: number | null): ChapterLine | null {
  const chapter = book.chapters.find((each) => each.number === number);
  return chapter === undefined ? null : { number: chapter.number, title: chapter.title };
}

export function roadView(data: SessionData): RoadView {
  const { series, sessions, session, today } = data;
  const completed = completedSeriesChapters(sessions, series.id);
  const completedDates = sessions
    .filter((each) => each.completedAt !== undefined)
    .map((each) => each.date);
  const streak = streakDays(completedDates, today);
  const doneToday = session?.completedAt !== undefined;
  const chapter =
    session === null
      ? chapterLine(series, nextSeriesChapter(sessions, series))
      : chapterLine(series, session.chapterRef.chapter);
  const state =
    chapter === null ? 'seriesEnd' : session === null ? 'start' : doneToday ? 'done' : 'resume';
  const todayTile = state === 'start' || state === 'resume' ? (chapter?.number ?? null) : null;
  return {
    state,
    childName: data.child.name,
    streak: streak >= 2 ? streak : null,
    chapter,
    tomorrow: doneToday ? chapterLine(series, nextSeriesChapter(sessions, series)) : null,
    completed: completed.length,
    totalChapters: series.totalChapters,
    bookTitle: series.title,
    tiles: Array.from({ length: series.totalChapters }, (_, index) => {
      const number = index + 1;
      return {
        chapter: number,
        state: chapterTileState(number, completed, todayTile),
        pattern: chapterPattern(number),
      };
    }),
  };
}
