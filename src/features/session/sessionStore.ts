// The daily session's store (docs/mimari.md, "Seans durum makinesi"; docs/planlar/faz-2b.md,
// karar 5). IndexedDB is the source: every action writes first and updates the state after, so a
// screen moves on only once its step is stored. One action runs at a time; a second call while one
// is running (a double tap) is ignored, and an action at the wrong place writes nothing.
import { createStore, type StoreApi } from 'zustand/vanilla';
import { defaultReadingStyle } from '../../domain/readingStyle';
import { isCountedError, readingLevel, toReadingResult } from '../../domain/scoring';
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
  Assessment,
  Book,
  Chapter,
  Child,
  Grade,
  Id,
  LocalDate,
  NarrationRate,
  Parent,
  Passage,
  ReadingOutcome,
  ReadingStyle,
  Session,
  SetupStep,
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

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'setup' | 'error';

/** Where the setup stands (docs/planlar/faz-3.md, karar 2): K1's account, then the parent's step. */
export type SetupPlace = 'account' | SetupStep;

export interface SetupData {
  step: SetupPlace;
  parent: Parent | null;
  child: Child | null;
  /** K3's measurement text: the reader's grade's first one. */
  passage: Passage | null;
  /** K4's starting point: the level check's measurement, or null when it was skipped. */
  baseline: Assessment | null;
  today: LocalDate;
}

export interface SessionData {
  parent: Parent;
  child: Child;
  series: Book;
  /** Today's chapter: the session's, else the next of the series; null when none is written. */
  chapter: Chapter | null;
  /** Every session up to today, in date order; today's included once it exists. */
  sessions: Session[];
  cards: StuckWord[];
  /** Every measurement, the level check first (V4's comparison; V3 in phase 4). */
  assessments: Assessment[];
  today: LocalDate;
  session: Session | null;
}

export interface SessionState {
  status: SessionStatus;
  data: SessionData | null;
  /** The setup still ahead while the status is 'setup'. */
  setup: SetupData | null;
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
  /** K1: the parent's account; the password is never part of it. */
  createAccount: (input: {
    email: string;
    voiceProcessing: boolean;
    weeklyEmail: boolean;
  }) => Promise<void>;
  /** K2: the reader, with the grade's default reading style. */
  saveReader: (input: {
    name: string;
    grade: Grade;
    interests: readonly string[];
  }) => Promise<void>;
  /** K3: the level check, stored as the first measurement. */
  saveBaseline: (
    outcome: ReadingOutcome,
    meta: { startedAt: string; recordingId: Id | null },
  ) => Promise<void>;
  /** K3 without a usable microphone (P14): the level check is skipped. */
  skipBaseline: () => Promise<void>;
  /** K4's "İlk bölüme başla": the setup is done and today's road opens. */
  finishSetup: () => Promise<void>;
  /** V4: the reader's reading style. */
  setReadingStyle: (style: ReadingStyle) => Promise<void>;
  /** P14: the microphone cannot be used, today's session goes on unheard. */
  continueUnheard: () => Promise<void>;
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

    /** Today's data, or the setup still ahead, from the database (docs/planlar/faz-3.md, karar 2). */
    async function readState(): Promise<Pick<SessionState, 'status' | 'data' | 'setup'>> {
      const repository = await services.repository();
      const today = services.today();
      const [parent, child, books, sessions, cards, assessments] = await Promise.all([
        repository.getParent(),
        repository.getChild(),
        repository.listBooks(),
        repository.listSessions(firstDate, today),
        repository.listStuckWords(),
        repository.listAssessments(),
      ]);
      if (parent === null || parent.setup !== undefined || child === null) {
        const step: SetupPlace = parent === null ? 'account' : (parent.setup ?? 'reader');
        const passage =
          step === 'level' && child !== null
            ? ((await repository.listPassages(child.grade))[0] ?? null)
            : null;
        const baseline = step === 'meet' ? (assessments.at(-1) ?? null) : null;
        return {
          status: 'setup',
          data: null,
          setup: { step, parent, child, passage, baseline, today },
        };
      }
      const series = books.find((book) => book.source === 'series');
      if (series === undefined) {
        throw new Error('The series book is missing from the content.');
      }
      const session = sessions.find((each) => each.date === today) ?? null;
      const chapter =
        session === null
          ? chapterOf(series, nextSeriesChapter(sessions, series))
          : chapterOf(series, session.chapterRef.chapter);
      return {
        status: 'ready',
        data: { parent, child, series, chapter, sessions, cards, assessments, today, session },
        setup: null,
      };
    }

    /** The setup's place while the store is in the setup. */
    function settingUp(): SetupData | null {
      const { status, setup } = get();
      return status === 'setup' ? setup : null;
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
      setup: null,
      error: null,
      unheardDone: 0,

      // The screens show the status; loading never rejects.
      load: () =>
        act(undefined, async () => {
          set({ status: 'loading', error: null, unheardDone: 0 });
          publish(await readState());
        }).catch(() => undefined),

      refreshDay: () =>
        act(undefined, async () => {
          const { status, data } = get();
          if (status !== 'ready' || data === null || data.today === services.today()) {
            return;
          }
          publish({ ...(await readState()), unheardDone: 0 });
        }),

      start: () =>
        act(undefined, async () => {
          const loaded = get().data;
          let data = loaded;
          // A page left open past midnight: today's session is the new day's.
          if (loaded !== null && loaded.today !== services.today()) {
            const state = await readState();
            if (state.data === null) {
              publish({ ...state, unheardDone: 0 });
              return;
            }
            data = state.data;
          }
          if (data === null || data.session !== null || data.chapter === null) {
            if (data !== loaded && data !== null) {
              publish({ status: 'ready', data, setup: null, unheardDone: 0 });
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

      createAccount: (input) =>
        act(undefined, async () => {
          if (settingUp()?.step !== 'account') {
            return;
          }
          const repository = await services.repository();
          await repository.saveParent({
            id: services.createId(),
            email: input.email.trim(),
            consent: {
              voiceProcessing: input.voiceProcessing,
              weeklyEmail: input.weeklyEmail,
              ...(input.voiceProcessing ? { grantedAt: services.now().toISOString() } : {}),
            },
            setup: 'reader',
          });
          publish(await readState());
        }),

      saveReader: (input) =>
        act(undefined, async () => {
          const setup = settingUp();
          if (setup?.step !== 'reader' || setup.parent === null) {
            return;
          }
          const repository = await services.repository();
          await repository.saveChild({
            id: setup.child?.id ?? services.createId(),
            name: input.name.trim(),
            grade: input.grade,
            interests: [...input.interests],
            readingStyle: defaultReadingStyle(input.grade),
          });
          await repository.saveParent({
            ...setup.parent,
            setup: setup.parent.consent.voiceProcessing ? 'level' : 'meet',
          });
          publish(await readState());
        }),

      saveBaseline: (outcome, meta) =>
        act(undefined, async () => {
          const setup = settingUp();
          if (
            setup?.step !== 'level' ||
            setup.parent === null ||
            setup.child === null ||
            setup.passage === null
          ) {
            return;
          }
          const repository = await services.repository();
          const result = toReadingResult(outcome, {
            startedAt: meta.startedAt,
            readingStyle: setup.child.readingStyle,
            ...(meta.recordingId === null ? {} : { recordingId: meta.recordingId }),
          });
          await repository.saveAssessment({
            id: services.createId(),
            childId: setup.child.id,
            date: setup.today,
            passageId: setup.passage.id,
            result,
            level: readingLevel(result.accuracy),
          });
          await repository.saveParent({ ...setup.parent, setup: 'meet' });
          publish(await readState());
        }),

      skipBaseline: () =>
        act(undefined, async () => {
          const setup = settingUp();
          if (setup?.step !== 'level' || setup.parent === null) {
            return;
          }
          await (await services.repository()).saveParent({ ...setup.parent, setup: 'meet' });
          publish(await readState());
        }),

      finishSetup: () =>
        act(undefined, async () => {
          const setup = settingUp();
          if (setup?.step !== 'meet' || setup.parent === null) {
            return;
          }
          const parent: Parent = { ...setup.parent };
          delete parent.setup;
          await (await services.repository()).saveParent(parent);
          publish(await readState());
        }),

      setReadingStyle: (style) =>
        act(undefined, async () => {
          const { data } = get();
          if (data === null) {
            return;
          }
          const child = { ...data.child, readingStyle: style };
          await (await services.repository()).saveChild(child);
          publish({ data: { ...data, child } });
        }),

      continueUnheard: () =>
        act(undefined, async () => {
          const current = ready();
          if (
            current === null ||
            current.session.step === 'done' ||
            current.session.unheard === true
          ) {
            return;
          }
          await storeSession(current.data, { ...current.session, unheard: true });
        }),
    };
  });
}
