// The ghost ("dünkü sen"): docs/urun.md section 3, docs/planlar/faz-2a.md karar 8. It moves
// through today's text at the pace of the latest earlier reading with the same attempt.
import { daysBetween } from './date';
import type { Attempt, LocalDate, ReadingResult, Session } from './types';

/** The same attempt in the latest session before today, or null. */
export function previousReading(
  sessions: readonly Session[],
  today: LocalDate,
  attempt: Attempt,
): ReadingResult | null {
  const earlier = sessions
    .filter((session) => daysBetween(session.date, today) > 0)
    .sort((a, b) => daysBetween(a.date, b.date));
  for (const session of earlier) {
    const reading = session.readings.find((item) => item.attempt === attempt);
    if (reading !== undefined) {
      return reading;
    }
  }
  return null;
}

/** Words attempted per minute; null without a timed reading. */
export function ghostPace(reading: ReadingResult | null): number | null {
  if (reading === null || reading.seconds <= 0) {
    return null;
  }
  return (reading.wordsAttempted * 60) / reading.seconds;
}

/** The word the ghost is on after elapsedMs of reading (pauses excluded); wordCount at the end. */
export function ghostIndex(paceWpm: number, elapsedMs: number, wordCount: number): number {
  const index = Math.floor((paceWpm * elapsedMs) / 60000);
  return Math.min(Math.max(index, 0), wordCount);
}

/** How many words the child is ahead; never a negative comparison (docs/urun.md section 4). */
export function raceLead(childIndex: number, ghost: number | null): number | null {
  if (ghost === null) {
    return null;
  }
  const lead = childIndex - ghost;
  return lead > 0 ? lead : null;
}
