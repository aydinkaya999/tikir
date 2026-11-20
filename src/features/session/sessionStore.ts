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
  /**
   * A page left open past midnight turns to the new day: the data is read again when the day has
   * changed since it was loaded (G1 asks; a session step keeps its own day).
   */
  refreshDay: () => Promise<void>;
  /** Starts today's session; on a new day it reads the new day's data first. */
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
  // The action that runs now. A publish ends it (see publish); an older action's end never clears
  // a newer one.
  let running: object | null = null;

  return createStore<SessionState>()((set, get) => {
    /**
     * Runs one action at a time. A failure is reported in the state and rejects the call, so a
     * screen that awaits a write never moves on after a failed one.
     */
    async function act<T>(ignored: T, action: () => Promise<T>): Promise<T> {
      if (running !== null) {
        return ignored;
      }
      const token = {};
      running = token;
      try {
        return await action();
      } catch (cause) {
        const error = errorOf(cause);
        set({ status: 'error', error });
        throw error;
      } finally {
        if (running === token) {
          running = null;
        }
      }
    }

    /**
     * Publishes an action's result as its last step, so the action is over: a screen that opens on
     * the new state may act at once, and React runs its effects inside this very call (G6 ends a
     * session whose last answer is written as it opens).
     */
    function publish(state: Partial<SessionState>): void {
      running = null;
      set(state);
    }

    /** Today's data from the database; null when there is no profile yet. */
    async function readData(): Promise<SessionData | null> {
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
        return null;
      }
      const session = sessions.find((each) => each.date === today) ?? null;
      const chapter =
        session === null
          ? chapterOf(series, nextSeriesChapter(sessions, series))
          : chapterOf(series, session.chapterRef.chapter);
      return { parent, child, series, chapter, sessions, cards, today, session };
    }

    function readyState(data: SessionData | null): Pick<SessionState, 'status' | 'data'> {
      return data === null ? { status: 'noProfile', data: null } : { status: 'ready', data };
    }

    function ready(): { data: SessionData; session: Session; chapter: Chapter } | null {
      const { data } = get();
      const session = data?.session ?? null;
      const chapter = data?.chapter ?? null;
      return data !== null && session !== null && chapter !== null
        ? { data, session, chapter }
        : null;
    }

    /**
     * Writes the step (the session first, then the cards) and publishes it only once every write
     * is done: a screen moves on when the action is over, so its next action is never refused as
     * a double tap of this one.
     */
    async function storeSession(
      data: SessionData,
      session: Session,
      cards: StuckWord[] | null = null,
      afterWrites: () => Promise<void> = () => Promise.resolve(),
      alongside: Partial<Pick<SessionState, 'unheardDone'>> = {},
    ): Promise<void> {
      const repository = await services.repository();
      await repository.saveSession(session);
      if (cards !== null) {
        await repository.saveStuckWords(cards);
      }
      await afterWrites();
      publish({
        ...alongside,
        data: {
          ...data,
          session,
          sessions: withSession(data.sessions, session),
          cards: cards ?? data.cards,
        },
      });
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
          publish(readyState(await readData()));
        }).catch(() => undefined),

      refreshDay: () =>
        act(undefined, async () => {
          const { status, data } = get();
          if (status !== 'ready' || data === null || data.today === services.today()) {
            return;
          }
          publish({ ...readyState(await readData()), unheardDone: 0 });
        }),

      start: () =>
        act(undefined, async () => {
          const loaded = get().data;
          // A page left open past midnight: today's session is the new day's.
          const data =
            loaded !== null && loaded.today !== services.today() ? await readData() : loaded;
          if (data === null || data.session !== null || data.chapter === null) {
            if (data !== loaded) {
              publish({ ...readyState(data), unheardDone: 0 });
            }
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
          await storeSession(
            data,
            session,
            null,
            undefined,
            data === loaded ? {} : { unheardDone: 0 },
          );
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
          const cards =
            card === null || scored === null
              ? null
              : data.cards.map((each) => (each.word === card.word ? scored : each));
          await storeSession(data, next, cards);
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
          const missed = missedWords(chapter, outcome);
          const cards = missed.length > 0 ? recordMisses(data.cards, missed, data.today) : null;
          const oldRecording = firstTake?.recordingId;
          await storeSession(data, afterReading(session, reading), cards, async () => {
            // The first take goes only once the new third reading is stored.
            if (oldRecording !== undefined && oldRecording !== meta.recordingId) {
              await services.recorder.remove(oldRecording);
            }
          });
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
          if (next === session) {
            publish({ unheardDone: done + 1 });
          } else {
            await storeSession(data, next, null, undefined, { unheardDone: done + 1 });
          }
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
          publish({ data: { ...data, child } });
        }),
    };
  });
}
