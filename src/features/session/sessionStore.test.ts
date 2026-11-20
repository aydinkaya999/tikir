import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chapterTokens, passageChapter } from '../../domain/text';
import type { Chapter, Passage, ReadingOutcome, StuckWord } from '../../domain/types';
import { loadDemoProfile } from '../dev/demo/loadDemoProfile';
import { scenarioSets } from '../../services/listener/scenarios';
import { simulateReading, toWordResults } from '../../services/listener/simulateReading';
import { IndexedDbRepository } from '../../services/repository/IndexedDbRepository';
import { type Repository, RepositoryUnavailableError } from '../../services/repository/Repository';
import { placeOf } from './sessionMachine';
import { createSessionStore } from './sessionStore';

const today = '2026-11-21';

async function demoRepository(): Promise<Repository> {
  const repository = await IndexedDbRepository.open();
  await loadDemoProfile(repository, 'cocuk-sabahi', today);
  return repository;
}

function storeOver(repository: Repository) {
  const remove = vi.fn(() => Promise.resolve());
  let id = 0;
  const store = createSessionStore({
    repository: () => Promise.resolve(repository),
    recorder: { remove },
    today: () => today,
    now: () => new Date('2026-11-21T09:00:00.000Z'),
    createId: () => {
      id += 1;
      return `kimlik-${String(id)}`;
    },
  });
  return { store, remove };
}

/** The typical scenario's reading of a chapter, as the fake listener would end it. */
function typicalOutcome(chapter: Chapter, reading: 0 | 1 | 2): ReadingOutcome {
  const scenario = scenarioSets.typical.readings[reading];
  const simulation = simulateReading(
    chapterTokens(chapter).map((token) => token.spoken),
    scenario,
  );
  return { words: toWordResults(simulation), seconds: simulation.seconds };
}

function cardOf(cards: readonly StuckWord[], word: string): StuckWord | undefined {
  return cards.find((card) => card.word === word);
}

const startedAt = '2026-11-21T09:03:00.000Z';

describe('the session store', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('loads the child, today and the chapter to read', async () => {
    const { store } = storeOver(await demoRepository());

    await store.getState().load();

    const { status, data } = store.getState();
    expect(status).toBe('ready');
    expect(data?.child.name).toBe('Deniz');
    expect(data?.chapter?.number).toBe(4);
    expect(data?.session).toBeNull();
  });

  it('reports a store without a profile and a store that cannot open', async () => {
    const empty = storeOver(await IndexedDbRepository.open()).store;
    await empty.getState().load();
    expect(empty.getState().status).toBe('setup');
    expect(empty.getState().setup?.step).toBe('account');

    const broken = createSessionStore({
      repository: () => Promise.reject(new RepositoryUnavailableError('IndexedDB is missing.')),
      recorder: { remove: vi.fn(() => Promise.resolve()) },
      today: () => today,
      now: () => new Date(),
      createId: () => 'kimlik',
    });
    await broken.getState().load();
    expect(broken.getState().status).toBe('error');
    expect(broken.getState().error?.name).toBe('RepositoryUnavailableError');
  });

  it('starts today with the warmup deck stored, once', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();

    await store.getState().start();
    await store.getState().start();

    const saved = await repository.getSession(today);
    expect(saved?.id).toBe('kimlik-1');
    expect(saved?.step).toBe('warmup');
    expect(saved?.warmup?.words).toEqual(['kıvrılıyordu', 'ağaçlarının', 'belirdiğinde']);
  });

  it('scores each card on its first correct reading and tames the one that is ready', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();

    for (let card = 0; card < 3; card += 1) {
      await store.getState().answerWarmupCard(true);
    }

    const cards = await repository.listStuckWords();
    expect(cardOf(cards, 'kıvrılıyordu')).toMatchObject({ correctStreak: 2, dueOn: '2026-11-25' });
    expect(cardOf(cards, 'ağaçlarının')).toMatchObject({ status: 'tamed', dueOn: null });
    expect(cardOf(cards, 'belirdiğinde')).toMatchObject({ correctStreak: 1, dueOn: '2026-11-23' });
    const saved = await repository.getSession(today);
    expect(saved?.tamedToday).toEqual(['ağaçlarının']);
    expect(saved?.step).toBe('listen');
  });

  it('scores a wrong first attempt once; the second attempt writes no card', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    const saveStuckWords = vi.spyOn(repository, 'saveStuckWords');

    await store.getState().answerWarmupCard(false);
    await store.getState().answerWarmupCard(true);
    await store.getState().nextWarmupCard();

    expect(saveStuckWords).toHaveBeenCalledTimes(1);
    expect(cardOf(await repository.listStuckWords(), 'kıvrılıyordu')).toMatchObject({
      status: 'practicing',
      correctStreak: 0,
      dueOn: '2026-11-22',
    });
    expect((await repository.getSession(today))?.warmup).toMatchObject({ done: 1, scored: 1 });
  });

  it('never scores a card again after a reload in its second attempt', async () => {
    const repository = await demoRepository();
    const first = storeOver(repository).store;
    await first.getState().load();
    await first.getState().start();
    await first.getState().answerWarmupCard(true);
    await first.getState().answerWarmupCard(true);
    await first.getState().answerWarmupCard(false);
    expect(cardOf(await repository.listStuckWords(), 'ağaçlarının')?.status).toBe('tamed');

    const reloaded = storeOver(repository).store;
    await reloaded.getState().load();
    const session = reloaded.getState().data?.session;
    expect(session ? placeOf(session) : null).toEqual({
      step: 'warmup',
      card: 2,
      secondAttempt: true,
    });
    const saveStuckWords = vi.spyOn(repository, 'saveStuckWords');
    await reloaded.getState().answerWarmupCard(false);

    expect(saveStuckWords).not.toHaveBeenCalled();
    expect(cardOf(await repository.listStuckWords(), 'ağaçlarının')?.status).toBe('tamed');
  });

  it('skips the rest of the warmup and leaves those cards alone', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    await store.getState().answerWarmupCard(true);
    const before = await repository.listStuckWords();

    await store.getState().skipWarmup();

    expect((await repository.getSession(today))?.step).toBe('listen');
    expect(cardOf(await repository.listStuckWords(), 'ağaçlarının')).toEqual(
      cardOf(before, 'ağaçlarının'),
    );
    expect(cardOf(await repository.listStuckWords(), 'belirdiğinde')).toEqual(
      cardOf(before, 'belirdiğinde'),
    );
  });

  it('keeps the three typical readings and turns the stumbles into cards', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    await store.getState().skipWarmup();
    await store.getState().finishListening();
    const chapter = store.getState().data?.chapter;
    if (!chapter) {
      throw new Error('no chapter');
    }

    await store
      .getState()
      .saveReading(typicalOutcome(chapter, 0), { startedAt, recordingId: null });
    await store
      .getState()
      .saveReading(typicalOutcome(chapter, 1), { startedAt, recordingId: null });
    await store
      .getState()
      .saveReading(typicalOutcome(chapter, 2), { startedAt, recordingId: 'kayit-1' });

    const saved = await repository.getSession(today);
    expect(saved?.readings.map((reading) => reading.wcpm)).toEqual([64, 68, 71]);
    expect(saved?.readings[2]?.recordingId).toBe('kayit-1');
    expect(saved?.step).toBe('record');
    const cards = await repository.listStuckWords();
    for (const word of ['arasından', 'soluk', 'rüzgârı']) {
      expect(cardOf(cards, word)).toMatchObject({ status: 'wild', misses: 1, dueOn: '2026-11-22' });
    }
  });

  it('records the third reading again and drops the first take only after the new one is kept', async () => {
    const repository = await demoRepository();
    const { store, remove } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    await store.getState().skipWarmup();
    await store.getState().finishListening();
    const chapter = store.getState().data?.chapter;
    if (!chapter) {
      throw new Error('no chapter');
    }
    for (const reading of [0, 1] as const) {
      await store
        .getState()
        .saveReading(typicalOutcome(chapter, reading), { startedAt, recordingId: null });
    }
    await store
      .getState()
      .saveReading(typicalOutcome(chapter, 2), { startedAt, recordingId: 'kayit-1' });

    await store.getState().redoRecording();
    expect((await repository.getSession(today))?.step).toBe('read');
    expect(remove).not.toHaveBeenCalled();
    const saveSession = vi.spyOn(repository, 'saveSession');
    await store
      .getState()
      .saveReading(typicalOutcome(chapter, 2), { startedAt, recordingId: 'kayit-2' });

    const saved = await repository.getSession(today);
    expect(saved?.readings).toHaveLength(3);
    expect(saved?.readings[2]?.recordingId).toBe('kayit-2');
    expect(remove).toHaveBeenCalledWith('kayit-1');
    const sessionWrite = saveSession.mock.invocationCallOrder[0] ?? Infinity;
    expect(sessionWrite).toBeLessThan(remove.mock.invocationCallOrder[0] ?? -1);
  });

  it('passes three unheard readings without a result or a card', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    await store.getState().skipWarmup();
    await store.getState().finishListening();
    const before = await repository.listStuckWords();

    for (let reading = 0; reading < 3; reading += 1) {
      await store.getState().skipUnheardReading();
    }

    const saved = await repository.getSession(today);
    expect(saved?.step).toBe('wrapUp');
    expect(saved?.readings).toEqual([]);
    expect(await repository.listStuckWords()).toEqual(before);
    expect(store.getState().unheardDone).toBe(3);
  });

  it('checks the answers and finishes the session', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    await store.getState().skipWarmup();
    await store.getState().finishListening();
    for (let reading = 0; reading < 3; reading += 1) {
      await store.getState().skipUnheardReading();
    }

    expect(await store.getState().answerQuestion(0)).toBe(true);
    expect(await store.getState().answerQuestion(1)).toBe(false);
    await store.getState().finishSession();

    const saved = await repository.getSession(today);
    expect(saved?.answers).toEqual([0, 1]);
    expect(saved?.step).toBe('done');
    expect(saved?.completedAt).toBe('2026-11-21T09:00:00.000Z');
    expect(store.getState().data?.sessions.at(-1)?.step).toBe('done');
  });

  it('a new store resumes at the same place', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    await store.getState().skipWarmup();
    await store.getState().finishListening();
    const chapter = store.getState().data?.chapter;
    if (!chapter) {
      throw new Error('no chapter');
    }
    await store
      .getState()
      .saveReading(typicalOutcome(chapter, 0), { startedAt, recordingId: null });

    const reloaded = storeOver(repository).store;
    await reloaded.getState().load();

    const session = reloaded.getState().data?.session;
    expect(session ? placeOf(session) : null).toEqual({ step: 'read', attempt: 2, redo: false });
  });

  it('writes once when the same step is finished twice at once', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    await store.getState().skipWarmup();
    const saveSession = vi.spyOn(repository, 'saveSession');

    await Promise.all([store.getState().finishListening(), store.getState().finishListening()]);

    expect(saveSession).toHaveBeenCalledTimes(1);
    const session = store.getState().data?.session;
    expect(session ? placeOf(session) : null).toEqual({ step: 'read', attempt: 1, redo: false });
  });

  it('moves the screen on only once every write of the step is done', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    let cardsWritten = false;
    const saveStuckWords = repository.saveStuckWords.bind(repository);
    vi.spyOn(repository, 'saveStuckWords').mockImplementation(async (cards) => {
      await saveStuckWords(cards);
      cardsWritten = true;
    });
    const seen: boolean[] = [];
    store.subscribe((state) => {
      if (state.data?.session?.warmup?.done === 1) {
        seen.push(cardsWritten);
      }
    });

    await store.getState().answerWarmupCard(true);

    // The next card shows only after its card is stored, so its reading is never refused as a
    // double tap of the one still writing.
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(Boolean)).toBe(true);
  });

  it('takes an action that a screen starts while a step is being published', async () => {
    // G6 opens on a session whose last answer is written and ends it at once (karar 16); React
    // runs the screen's effect inside the store's publish, before the load call has returned.
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().start();
    const started = await repository.getSession(today);
    if (started === null) {
      throw new Error('No session today.');
    }
    await repository.saveSession({ ...started, step: 'wrapUp', answers: [0, 0] });
    const reopened = storeOver(repository).store;
    const finishing: Promise<void>[] = [];
    const unsubscribe = reopened.subscribe((state, previous) => {
      if (state.status === 'ready' && previous.status !== 'ready') {
        finishing.push(state.finishSession());
      }
    });

    await reopened.getState().load();
    unsubscribe();
    // The finish is still writing: a tap now is a double tap and is refused.
    await expect(reopened.getState().answerQuestion(1)).resolves.toBeNull();
    await Promise.all(finishing);

    const session = await repository.getSession(today);
    expect(session?.step).toBe('done');
    expect(session?.answers).toEqual([0, 0]);
  });

  /** A store whose day the test moves, as a page left open past midnight. */
  async function storeOnMovingDay() {
    const repository = await demoRepository();
    const clock = { day: today };
    const store = createSessionStore({
      repository: () => Promise.resolve(repository),
      recorder: { remove: vi.fn(() => Promise.resolve()) },
      today: () => clock.day,
      now: () => new Date(`${clock.day}T09:00:00.000Z`),
      createId: () => 'yeni-seans',
    });
    await store.getState().load();
    return { repository, store, clock };
  }

  it('starts the new day’s session when the day changed after the store loaded', async () => {
    const { repository, store, clock } = await storeOnMovingDay();
    clock.day = '2026-11-22';

    await store.getState().start();

    expect(store.getState().data?.today).toBe('2026-11-22');
    expect(await repository.getSession(today)).toBeNull();
    const session = await repository.getSession('2026-11-22');
    expect(session?.chapterRef.chapter).toBe(4);
    expect(store.getState().data?.session?.date).toBe('2026-11-22');
  });

  it('turns to the new day when asked after midnight, and keeps the same day as it is', async () => {
    const { store, clock } = await storeOnMovingDay();
    const before = store.getState().data;

    await store.getState().refreshDay();
    expect(store.getState().data).toBe(before);

    clock.day = '2026-11-22';
    await store.getState().refreshDay();
    expect(store.getState().data?.today).toBe('2026-11-22');
    expect(store.getState().status).toBe('ready');
  });

  it('rejects and reports the error when a write fails', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    vi.spyOn(repository, 'saveSession').mockRejectedValue(new Error('The disk is full.'));

    await expect(store.getState().start()).rejects.toThrow('The disk is full.');

    expect(store.getState().status).toBe('error');
    expect(store.getState().error?.message).toBe('The disk is full.');
  });
});

describe('the setup in the session store', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  async function emptyStore() {
    const repository = await IndexedDbRepository.open();
    const { store } = storeOver(repository);
    await store.getState().load();
    return { repository, store };
  }

  /** The demo profile's first measurement: 64 words in a minute, six counted errors. */
  function firstMeasurement(passage: Passage): ReadingOutcome {
    const words = chapterTokens(passageChapter(passage)).map((token) => token.spoken);
    const simulation = simulateReading(words, {
      timed: { seconds: 60, wordsRead: 64 },
      miscues: [
        { index: 4, type: 'misread' },
        { index: 8, type: 'suffix' },
        { index: 24, type: 'skipped' },
        { index: 31, type: 'suffix' },
        { index: 43, type: 'misread' },
        { index: 49, type: 'misread' },
      ],
      hesitations: [],
    });
    return { words: toWordResults(simulation), seconds: simulation.seconds };
  }

  async function atLevel(voiceProcessing = true) {
    const { repository, store } = await emptyStore();
    await store
      .getState()
      .createAccount({ email: 'veli@ornek.com', voiceProcessing, weeklyEmail: false });
    await store.getState().saveReader({ name: 'Deniz', grade: 3, interests: ['Uzay'] });
    return { repository, store };
  }

  it('creates the parent account with the consent and moves on to the reader', async () => {
    const { repository, store } = await emptyStore();

    await Promise.all([
      store
        .getState()
        .createAccount({ email: ' veli@ornek.com ', voiceProcessing: true, weeklyEmail: true }),
      store
        .getState()
        .createAccount({ email: 'ikinci@ornek.com', voiceProcessing: true, weeklyEmail: true }),
    ]);

    const parent = await repository.getParent();
    expect(parent).toMatchObject({
      email: 'veli@ornek.com',
      consent: { voiceProcessing: true, weeklyEmail: true, grantedAt: '2026-11-21T09:00:00.000Z' },
      setup: 'reader',
    });
    expect(store.getState().setup?.step).toBe('reader');
  });

  it('writes no consent date without the consent', async () => {
    const { repository, store } = await emptyStore();

    await store
      .getState()
      .createAccount({ email: 'veli@ornek.com', voiceProcessing: false, weeklyEmail: false });

    expect((await repository.getParent())?.consent).toEqual({
      voiceProcessing: false,
      weeklyEmail: false,
    });
  });

  it('writes the reader with the grade’s reading style and opens the level check with its text', async () => {
    const { repository, store } = await atLevel();

    expect(await repository.getChild()).toMatchObject({
      name: 'Deniz',
      grade: 3,
      interests: ['Uzay'],
      readingStyle: { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: false },
    });
    expect(store.getState().setup).toMatchObject({ step: 'level' });
    expect(store.getState().setup?.passage?.id).toBe('olcum-3a');
  });

  it('gives a first grader school letters and skips the level check without the consent', async () => {
    const { repository, store } = await emptyStore();
    await store
      .getState()
      .createAccount({ email: 'veli@ornek.com', voiceProcessing: false, weeklyEmail: false });

    await store.getState().saveReader({ name: ' Ali ', grade: 1, interests: [] });

    expect((await repository.getChild())?.name).toBe('Ali');
    expect((await repository.getChild())?.readingStyle.font).toBe('school');
    expect(store.getState().setup?.step).toBe('meet');
  });

  it('stores the level check as the first measurement and moves on to meeting Tıkır', async () => {
    const { repository, store } = await atLevel();
    const passage = store.getState().setup?.passage;
    if (!passage) {
      throw new Error('No measurement text.');
    }

    await store.getState().saveBaseline(firstMeasurement(passage), {
      startedAt: '2026-11-21T09:00:00.000Z',
      recordingId: 'kayit-1',
    });

    const [assessment] = await repository.listAssessments();
    expect(assessment).toMatchObject({
      date: today,
      passageId: 'olcum-3a',
      level: 'instructional',
      result: { wcpm: 58, recordingId: 'kayit-1', readingStyle: { font: 'clear' } },
    });
    expect(assessment?.result.accuracy).toBeCloseTo(0.906, 3);
    expect(store.getState().setup).toMatchObject({
      step: 'meet',
      baseline: { passageId: 'olcum-3a' },
    });
  });

  it('skips the level check without a measurement', async () => {
    const { repository, store } = await atLevel();

    await store.getState().skipBaseline();

    expect(await repository.listAssessments()).toEqual([]);
    expect(store.getState().setup).toMatchObject({ step: 'meet', baseline: null });
  });

  it('finishes the setup and opens today’s road', async () => {
    const { repository, store } = await atLevel();
    await store.getState().skipBaseline();

    await store.getState().finishSetup();

    expect((await repository.getParent())?.setup).toBeUndefined();
    expect(store.getState().status).toBe('ready');
    expect(store.getState().data?.child.name).toBe('Deniz');
    expect(store.getState().data?.chapter?.number).toBe(1);
  });

  it('keeps the reading style the parent chooses', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    const style = { font: 'school', sizeStep: 3, spacingStep: 2, trialEnabled: true } as const;

    await store.getState().setReadingStyle(style);

    expect((await repository.getChild())?.readingStyle).toEqual(style);
    expect(store.getState().data?.child.readingStyle).toEqual(style);
  });

  it('marks a session in progress as read on unheard, and nothing else', async () => {
    const repository = await demoRepository();
    const { store } = storeOver(repository);
    await store.getState().load();
    await store.getState().continueUnheard();
    expect(await repository.getSession(today)).toBeNull();

    await store.getState().start();
    await store.getState().continueUnheard();

    expect((await repository.getSession(today))?.unheard).toBe(true);
    expect(store.getState().data?.session?.unheard).toBe(true);
  });
});
