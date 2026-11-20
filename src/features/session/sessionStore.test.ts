import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chapterTokens } from '../../domain/text';
import type { Chapter, ReadingOutcome, StuckWord } from '../../domain/types';
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
    expect(empty.getState().status).toBe('noProfile');

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
