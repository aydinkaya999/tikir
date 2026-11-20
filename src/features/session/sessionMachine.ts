// The daily session's steps (docs/mimari.md, "Seans durum makinesi"; docs/planlar/faz-2b.md,
// karar 3): where a stored session is, and the transitions between its steps. Pure: the store
// writes each new session before the screen moves on.
import type {
  Attempt,
  ChapterRef,
  Id,
  LocalDate,
  ReadingResult,
  Session,
  SessionStep,
  SessionWarmup,
} from '../../domain/types';
import { childPaths, sessionPaths } from './paths';

export type SessionPlace =
  | { step: 'warmup'; card: number; secondAttempt: boolean }
  | { step: 'listen' }
  | { step: 'read'; attempt: Attempt; redo: boolean }
  | { step: 'record' }
  | { step: 'wrapUp'; question: number }
  | { step: 'done' };

const attempts: readonly Attempt[] = [1, 2, 3];
const readingCount = attempts.length;

function warmupOf(session: Session): SessionWarmup {
  return session.warmup ?? { words: [], done: 0, scored: 0 };
}

export function placeOf(session: Session): SessionPlace {
  switch (session.step) {
    case 'warmup': {
      const warmup = warmupOf(session);
      return { step: 'warmup', card: warmup.done, secondAttempt: warmup.scored > warmup.done };
    }
    case 'read': {
      const read = session.readings.length;
      return {
        step: 'read',
        attempt: attempts[Math.min(read, readingCount - 1)] ?? 3,
        redo: read >= readingCount,
      };
    }
    case 'wrapUp':
      return { step: 'wrapUp', question: session.answers.length };
    case 'listen':
    case 'record':
    case 'done':
      return { step: session.step };
  }
}

const stepOfPath = new Map<string, SessionStep>(
  Object.entries(sessionPaths).map(([step, path]) => [path, step as SessionStep]),
);

/**
 * Where a session address leads (docs/ekranlar.md, "Yönlendirme kuralları"): with no session today
 * to the road, otherwise to the current step; passed steps too, so a warmup is never scored twice.
 * null: stay. Addresses outside the session are left alone.
 */
export function sessionRedirect(session: Session | null, pathname: string): string | null {
  if (!stepOfPath.has(pathname)) {
    return null;
  }
  if (session === null) {
    return childPaths.road;
  }
  const target = sessionPaths[session.step];
  return pathname === target ? null : target;
}

export interface NewSession {
  id: Id;
  childId: Id;
  date: LocalDate;
  chapterRef: ChapterRef;
  warmupWords: string[];
  startedAt: string;
}

export function createSession(input: NewSession): Session {
  return {
    id: input.id,
    childId: input.childId,
    date: input.date,
    chapterRef: input.chapterRef,
    step: input.warmupWords.length > 0 ? 'warmup' : 'listen',
    readings: [],
    answers: [],
    tamedToday: [],
    startedAt: input.startedAt,
    warmup: { words: [...input.warmupWords], done: 0, scored: 0 },
  };
}

function expectStep(session: Session, step: SessionStep): void {
  if (session.step !== step) {
    throw new Error(`Not at ${step} (the session is at ${session.step}).`);
  }
}

/** The warmup with `done` cards finished; past the last card the session listens. */
function withWarmup(session: Session, warmup: SessionWarmup): Session {
  return warmup.done >= warmup.words.length
    ? { ...session, warmup, step: 'listen' }
    : { ...session, warmup };
}

/** The current card's first attempt is scored; a correct one also finishes the card. */
export function afterWarmupScore(session: Session, correct: boolean): Session {
  expectStep(session, 'warmup');
  const warmup = warmupOf(session);
  if (warmup.scored > warmup.done) {
    throw new Error('Not at an unscored warmup card.');
  }
  const done = correct ? warmup.done + 1 : warmup.done;
  return withWarmup(session, { ...warmup, done, scored: warmup.done + 1 });
}

/** The current card is finished: after its second attempt, or unscored in an unheard session. */
export function afterWarmupCard(session: Session): Session {
  expectStep(session, 'warmup');
  const warmup = warmupOf(session);
  const done = warmup.done + 1;
  return withWarmup(session, { ...warmup, done, scored: Math.max(warmup.scored, done) });
}

/** "Dinle adımına geç": the cards not reached stay as they are. */
export function skipWarmup(session: Session): Session {
  expectStep(session, 'warmup');
  return { ...session, step: 'listen' };
}

export function afterListen(session: Session): Session {
  expectStep(session, 'listen');
  return { ...session, step: 'read' };
}

/** A heard reading is kept; on a redo the new third reading takes the first take's place. */
export function afterReading(session: Session, reading: ReadingResult): Session {
  expectStep(session, 'read');
  const readings =
    session.readings.length < readingCount
      ? [...session.readings, reading]
      : [...session.readings.slice(0, readingCount - 1), reading];
  return readings.length === readingCount
    ? { ...session, readings, step: 'record' }
    : { ...session, readings };
}

/** An unheard reading leaves nothing behind; after the third the record step is skipped. */
export function afterUnheardReading(session: Session, attempt: Attempt): Session {
  expectStep(session, 'read');
  return attempt === readingCount ? { ...session, step: 'wrapUp' } : session;
}

/** "Baştan kaydet": back to the third reading; the first take stays until the new one is kept. */
export function redoRecording(session: Session): Session {
  expectStep(session, 'record');
  return { ...session, step: 'read' };
}

export function afterRecord(session: Session): Session {
  expectStep(session, 'record');
  return { ...session, step: 'wrapUp' };
}

/** The option chosen, by its place in the content (before shuffling). */
export function afterAnswer(session: Session, option: number): Session {
  expectStep(session, 'wrapUp');
  return { ...session, answers: [...session.answers, option] };
}

export function finishSession(session: Session, completedAt: string): Session {
  expectStep(session, 'wrapUp');
  return { ...session, step: 'done', completedAt };
}
