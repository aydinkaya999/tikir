// The daily session's store (docs/mimari.md, "Seans durum makinesi"; docs/planlar/faz-2b.md,
// karar 5). IndexedDB is the source: every action writes first and updates the state after, so a
// screen moves on only once its step is stored. One action runs at a time; a second call while one
// is running (a double tap) is ignored, and an action at the wrong place writes nothing.
import { createStore, type StoreApi } from 'zustand/vanilla';
import { isCountedError, toReadingResult } from '../../domain/scoring';
import {
  applyWarmupResult,
  type MissedWord,
  recordMisses,
  stuckKey,
  warmupDeck,
  warmupItems,
  type WarmupSource,
} from '../../domain/stuckWords';
import { nextSeriesChapter } from '../../domain/progress';
import { chapterTokens } from '../../domain/text';
import type {
  Book,
  Chapter,
  Child,
  Id,
  LocalDate,
  NarrationRate,
  Parent,
  ReadingOutcome,
  Session,
  StuckWord,
} from '../../domain/types';
import type { Recorder } from '../../services/recorder/Recorder';
import type { Repository } from '../../services/repository/Repository';
import {
  afterAnswer,
  afterListen,
  afterReading,
  afterRecord,
  afterUnheardReading,
  afterWarmupCard,
  afterWarmupScore,
  createSession,
  finishSession,
  placeOf,
  redoRecording,
  skipWarmup,
} from './sessionMachine';

export interface SessionStoreServices {
  repository: () => Promise<Repository>;
  recorder: Pick<Recorder, 'remove'>;
  today: () => LocalDate;
  now: () => Date;
  createId: () => Id;
}

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'noProfile' | 'error';

export interface SessionData {
  parent: Parent;
  child: Child;
  series: Book;
  /** Today's chapter: the session's, else the next of the series; null when none is written. */
  chapter: Chapter | null;
  /** Every session up to today, in date order; today's included once it exists. */
  sessions: Session[];
  cards: StuckWord[];
  today: LocalDate;
  session: Session | null;
}

export interface SessionState {
  status: SessionStatus;
  data: SessionData | null;
  error: Error | null;
  /** Unheard readings done on this page: they are not stored (docs/planlar/faz-2b.md, karar 3). */
  unheardDone: number;
  load: () => Promise<void>;
  start: () => Promise<void>;
  /** The current card's first attempt: the session (scored) is written first, then the card. */
  answerWarmupCard: (correct: boolean) => Promise<void>;
  /** The current card is finished: after its second attempt, or unscored when unheard. */
  nextWarmupCard: () => Promise<void>;
  skipWarmup: () => Promise<void>;
  finishListening: () => Promise<void>;
  saveReading: (
    outcome: ReadingOutcome,
    meta: { startedAt: string; recordingId: Id | null },
  ) => Promise<void>;
  skipUnheardReading: () => Promise<void>;
  redoRecording: () => Promise<void>;
  finishRecording: () => Promise<void>;
  /** true when the option is correct; null when the call was ignored (wrong place, double tap). */
  answerQuestion: (option: number) => Promise<boolean | null>;
  finishSession: () => Promise<void>;
  setNarrationRate: (rate: NarrationRate) => Promise<void>;
}

/** Every date sorts after this one: the lower end of "all the sessions". */
const firstDate = '0000-01-01';

function errorOf(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

function chapterOf(book: Book, number: number | null): Chapter | null {
  return number === null
    ? null
    : (book.chapters.find((chapter) => chapter.number === number) ?? null);
}

function sourceOf(chapter: Chapter): WarmupSource {
  return {
    words: chapterTokens(chapter).map((token) => ({ word: token.word, spoken: token.spoken })),
    chains: chapter.chains,
  };
}

function withSession(sessions: readonly Session[], session: Session): Session[] {
  return [...sessions.filter((each) => each.date !== session.date), session].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

/** The stumbles of a reading as cards to record: each word of the text once. */
function missedWords(chapter: Chapter, outcome: ReadingOutcome): MissedWord[] {
  const tokens = chapterTokens(chapter);
  return outcome.words
    .filter((result) => isCountedError(result.status))
    .flatMap((result) => {
      const token = tokens[result.index];
      if (token === undefined) {
        return [];
      }
      const chain = chapter.chains[token.word] ?? chapter.chains[stuckKey(token.word)] ?? [];
      return [{ word: token.word, spoken: token.spoken, chain }];
    });
}

export function createSessionStore(services: SessionStoreServices): StoreApi<SessionState> {
  let busy = false;

  return createStore<SessionState>()((set, get) => {
    /**
     * Runs one action at a time. A failure is reported in the state and rejects the call, so a
     * screen that awaits a write never moves on after a failed one.
     */
    async function act<T>(ignored: T, action: () => Promise<T>): Promise<T> {
      if (busy) {
        return ignored;
      }
      busy = true;
      try {
        return await action();
      } catch (cause) {
        const error = errorOf(cause);
        set({ status: 'error', error });
        throw error;
      } finally {
        busy = false;
      }
    }

    function ready(): { data: SessionData; session: Session; chapter: Chapter } | null {
      const { data } = get();
      const session = data?.session ?? null;
      const chapter = data?.chapter ?? null;
      return data !== null && session !== null && chapter !== null
        ? { data, session, chapter }
        : null;
    }

    async function storeSession(data: SessionData, session: Session): Promise<void> {
      await (await services.repository()).saveSession(session);
      set({ data: { ...data, session, sessions: withSession(data.sessions, session) } });
    }

    return {
      status: 'idle',
      data: null,
      error: null,
      unheardDone: 0,

      // The screens show the status; loading never rejects.
      load: () =>
        act(undefined, async () => {
          set({ status: 'loading', error: null, unheardDone: 0 });
          const repository = await services.repository();
          const today = services.today();
          const [parent, child, books, sessions, cards] = await Promise.all([
            repository.getParent(),
            repository.getChild(),
            repository.listBooks(),
            repository.listSessions(firstDate, today),
            repository.listStuckWords(),
          ]);
          const series = books.find((book) => book.source === 'series');
          if (parent === null || child === null || series === undefined) {
            set({ status: 'noProfile', data: null });
            return;
          }
          const session = sessions.find((each) => each.date === today) ?? null;
          const chapter =
            session === null
              ? chapterOf(series, nextSeriesChapter(sessions, series))
              : chapterOf(series, session.chapterRef.chapter);
          set({
            status: 'ready',
            data: { parent, child, series, chapter, sessions, cards, today, session },
          });
        }).catch(() => undefined),

      start: () =>
        act(undefined, async () => {
          const { data } = get();
          if (data === null || data.session !== null || data.chapter === null) {
            return;
          }
          const deck = warmupDeck(data.cards, data.today, sourceOf(data.chapter));
          const session = createSession({
            id: services.createId(),
            childId: data.child.id,
            date: data.today,
            chapterRef: { bookId: data.series.id, chapter: data.chapter.number },
            warmupWords: deck.map((item) => item.word),
            startedAt: services.now().toISOString(),
          });
          await storeSession(data, session);
        }),

      answerWarmupCard: (correct) =>
        act(undefined, async () => {
          const current = ready();
          if (current === null) {
            return;
          }
          const { data, session, chapter } = current;
          const place = placeOf(session);
          if (place.step !== 'warmup' || place.secondAttempt) {
            return;
          }
          const item = warmupItems(session.warmup?.words ?? [], data.cards, sourceOf(chapter))[
            place.card
          ];
          const card = item?.card ?? null;
          const scored = card === null ? null : applyWarmupResult(card, correct, data.today);
          const tamed =
            scored !== null && scored.status === 'tamed' && card?.status !== 'tamed'
              ? [...session.tamedToday, scored.word]
              : session.tamedToday;
          const next = { ...afterWarmupScore(session, correct), tamedToday: tamed };
          await storeSession(data, next);
          if (card !== null && scored !== null) {
            const cards = data.cards.map((each) => (each.word === card.word ? scored : each));
            await (await services.repository()).saveStuckWords(cards);
            const latest = get().data;
            if (latest !== null) {
              set({ data: { ...latest, cards } });
            }
          }
        }),

      nextWarmupCard: () =>
        act(undefined, async () => {
          const current = ready();
          if (current?.session.step !== 'warmup') {
            return;
          }
          await storeSession(current.data, afterWarmupCard(current.session));
        }),

      skipWarmup: () =>
        act(undefined, async () => {
          const current = ready();
          if (current?.session.step !== 'warmup') {
            return;
          }
          await storeSession(current.data, skipWarmup(current.session));
        }),

      finishListening: () =>
        act(undefined, async () => {
          const current = ready();
          if (current?.session.step !== 'listen') {
            return;
          }
          await storeSession(current.data, afterListen(current.session));
        }),

      saveReading: (outcome, meta) =>
        act(undefined, async () => {
          const current = ready();
          if (current === null) {
            return;
          }
          const { data, session, chapter } = current;
          const place = placeOf(session);
          if (place.step !== 'read') {
            return;
          }
          const firstTake = place.redo ? session.readings[2] : undefined;
          const reading = toReadingResult(outcome, {
            chapterRef: session.chapterRef,
            attempt: place.attempt,
            startedAt: meta.startedAt,
            readingStyle: data.child.readingStyle,
            ...(meta.recordingId === null ? {} : { recordingId: meta.recordingId }),
          });
          await storeSession(data, afterReading(session, reading));
          const missed = missedWords(chapter, outcome);
          if (missed.length > 0) {
            const cards = recordMisses(data.cards, missed, data.today);
            await (await services.repository()).saveStuckWords(cards);
            const latest = get().data;
            if (latest !== null) {
              set({ data: { ...latest, cards } });
            }
          }
          const oldRecording = firstTake?.recordingId;
          if (oldRecording !== undefined && oldRecording !== meta.recordingId) {
            await services.recorder.remove(oldRecording);
          }
        }),

      skipUnheardReading: () =>
        act(undefined, async () => {
          const current = ready();
          if (current?.session.step !== 'read') {
            return;
          }
          const { session, data } = current;
          const done = get().unheardDone;
          const attempt = Math.min(session.readings.length + done + 1, 3);
          const next = afterUnheardReading(session, attempt === 1 ? 1 : attempt === 2 ? 2 : 3);
          if (next !== session) {
            await storeSession(data, next);
          }
          set({ unheardDone: done + 1 });
        }),

      redoRecording: () =>
        act(undefined, async () => {
          const current = ready();
          if (current?.session.step !== 'record') {
            return;
          }
          await storeSession(current.data, redoRecording(current.session));
        }),

      finishRecording: () =>
        act(undefined, async () => {
          const current = ready();
          if (current?.session.step !== 'record') {
            return;
          }
          await storeSession(current.data, afterRecord(current.session));
        }),

      answerQuestion: (option) =>
        act<boolean | null>(null, async () => {
          const current = ready();
          if (current === null) {
            return null;
          }
          const { data, session, chapter } = current;
          const place = placeOf(session);
          if (place.step !== 'wrapUp') {
            return null;
          }
          const question = chapter.questions[place.question];
          if (question === undefined) {
            return null;
          }
          await storeSession(data, afterAnswer(session, option));
          return question.correctIndex === option;
        }),

      finishSession: () =>
        act(undefined, async () => {
          const current = ready();
          if (current?.session.step !== 'wrapUp') {
            return;
          }
          await storeSession(
            current.data,
            finishSession(current.session, services.now().toISOString()),
          );
        }),

      setNarrationRate: (rate) =>
        act(undefined, async () => {
          const { data } = get();
          if (data === null || data.child.narrationRate === rate) {
            return;
          }
          const child = { ...data.child, narrationRate: rate };
          await (await services.repository()).saveChild(child);
          set({ data: { ...data, child } });
        }),
    };
  });
}
