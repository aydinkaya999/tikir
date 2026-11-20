// The child's progress on G1 and G7 (docs/ekranlar.md; docs/planlar/faz-2a.md, karar 9): today's
// chapter, the days in a row and the gain over the previous session. Never a negative number.
import { addDays } from './date';
import type { Book, Id, LocalDate, Session } from './types';

/** Chapter numbers of the series with a completed session, ascending. */
export function completedSeriesChapters(sessions: readonly Session[], seriesId: Id): number[] {
  const chapters = new Set<number>();
  for (const session of sessions) {
    if (session.completedAt !== undefined && session.chapterRef.bookId === seriesId) {
      chapters.add(session.chapterRef.chapter);
    }
  }
  return [...chapters].sort((a, b) => a - b);
}

/**
 * The chapter after the last completed one; a day spent on a library book does not move the
 * series. null when that chapter is not written yet.
 */
export function nextSeriesChapter(sessions: readonly Session[], series: Book): number | null {
  const completed = completedSeriesChapters(sessions, series.id);
  const next = (completed.at(-1) ?? 0) + 1;
  return series.chapters.some((chapter) => chapter.number === next) ? next : null;
}

/** Days in a row with a completed session, ending today or, if today is still open, yesterday. */
export function streakDays(completedDates: readonly LocalDate[], today: LocalDate): number {
  const dates = new Set(completedDates);
  let day = dates.has(today) ? today : addDays(today, -1);
  let days = 0;
  while (dates.has(day)) {
    days += 1;
    day = addDays(day, -1);
  }
  return days;
}

/** The gain over the previous session's third reading; null unless it is positive. */
export function deltaFromPrevious(todayWcpm: number, previousWcpm: number | null): number | null {
  if (previousWcpm === null) {
    return null;
  }
  const delta = todayWcpm - previousWcpm;
  return delta > 0 ? delta : null;
}

export type TileState = 'done' | 'today' | 'locked';

/** A tile of the chapter road on G1. */
export function chapterTileState(
  chapter: number,
  completed: readonly number[],
  today: number | null,
): TileState {
  if (completed.includes(chapter)) {
    return 'done';
  }
  return chapter === today ? 'today' : 'locked';
}
