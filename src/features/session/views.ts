// What the session screens show, from the session store's data (docs/ekranlar.md, G1 and G7).
// Pure: the screens draw it.
import type { MonsterKind, TilePattern } from '../../components/illustrations';
import { previousReading } from '../../domain/ghost';
import {
  chapterTileState,
  completedSeriesChapters,
  deltaFromPrevious,
  nextSeriesChapter,
  sessionMinutesSpent,
  streakDays,
  type TileState,
} from '../../domain/progress';
import type { WarmupItem, WarmupSource } from '../../domain/stuckWords';
import type { ChapterToken } from '../../domain/text';
import { chapterTokens } from '../../domain/text';
import type { Book, Chapter, Id } from '../../domain/types';
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

/** Today's words and chains, where the warmup finds a word of the text and its chain. */
export function chapterWarmupSource(chapter: Chapter): WarmupSource {
  return {
    words: chapterTokens(chapter).map((token) => ({ word: token.word, spoken: token.spoken })),
    chains: chapter.chains,
  };
}

/** A warmup word as the one token of a single-word reading. */
export function warmupToken(item: WarmupItem): ChapterToken {
  return {
    word: item.word,
    spoken: item.spoken,
    leading: '',
    trailing: '',
    spaceAfter: false,
    index: 0,
    page: 0,
  };
}

const letter = /\p{L}/gu;

/**
 * Which of the two monsters a word gets, the same on every screen: by its letter count, so the
 * designs' "kıvrılıyordu" (12) and "ağaçlarının" (11) get the two kinds they show.
 */
export function monsterKindOf(word: string): MonsterKind {
  return (word.match(letter)?.length ?? 0) % 2 === 0 ? 1 : 2;
}

/**
 * Whether today's session listens to the child (docs/kararlar.md P13, P14): with the parent's
 * consent, unless the microphone could not be used and the child went on unheard.
 */
export function sessionListens(data: Pick<SessionData, 'parent' | 'session'>): boolean {
  return data.parent.consent.voiceProcessing && data.session?.unheard !== true;
}

/** G7's summary of the finished day (docs/planlar/faz-2b.md, karar 17). */
export interface DoneView {
  minutes: number;
  /** The third reading's pace; null after an unheard session. */
  wcpm: number | null;
  /** The gain over the previous session's third reading; null unless it is positive. */
  delta: number | null;
  tamed: string[];
  /** The next chapter of the series; null when none is written yet. */
  tomorrow: ChapterLine | null;
  childName: string;
}

export function doneView(data: SessionData): DoneView {
  const { session, sessions, series, today } = data;
  const wcpm = session?.readings.find((reading) => reading.attempt === 3)?.wcpm ?? null;
  const previous = previousReading(sessions, today, 3);
  return {
    minutes: (session === null ? null : sessionMinutesSpent(session)) ?? 1,
    wcpm,
    delta: wcpm === null ? null : deltaFromPrevious(wcpm, previous?.wcpm ?? null),
    tamed: session?.tamedToday ?? [],
    tomorrow: chapterLine(series, nextSeriesChapter(sessions, series)),
    childName: data.child.name,
  };
}

/** A recorded chapter in the studio (docs/planlar/faz-2b.md, karar 18). */
export interface StudioRow {
  chapter: number;
  title: string;
  recordingId: Id;
}

/** The series' recorded chapters in chapter order; a chapter read again keeps its latest take. */
export function studioRows(data: SessionData): StudioRow[] {
  const { series } = data;
  const rows = new Map<number, StudioRow>();
  for (const session of data.sessions) {
    const recordingId = session.readings[2]?.recordingId;
    const chapter = series.chapters.find((each) => each.number === session.chapterRef.chapter);
    if (session.chapterRef.bookId === series.id && recordingId !== undefined && chapter) {
      rows.set(chapter.number, { chapter: chapter.number, title: chapter.title, recordingId });
    }
  }
  return [...rows.values()].sort((a, b) => a.chapter - b.chapter);
}
