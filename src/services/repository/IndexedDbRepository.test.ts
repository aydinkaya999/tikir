import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Assessment, Child, Parent, StuckWord } from '../../domain/types';
import { testReading, testReadingStyle, testSession } from '../../test/sessions';
import { IndexedDbRepository } from './IndexedDbRepository';
import { RepositoryUnavailableError } from './Repository';

const parent: Parent = {
  id: 'veli',
  email: 'veli@example.com',
  consent: { voiceProcessing: true, weeklyEmail: false, grantedAt: '2026-11-01T09:00:00.000Z' },
};

const child: Child = {
  id: 'cocuk',
  name: 'Deniz',
  grade: 3,
  interests: ['uzay'],
  readingStyle: testReadingStyle,
};

function card(word: string, misses = 1): StuckWord {
  return {
    word,
    syllables: [word],
    chain: [],
    misses,
    status: 'wild',
    correctStreak: 0,
    dueOn: '2026-11-22',
  };
}

const assessment: Assessment = {
  id: 'olcum-1',
  childId: 'cocuk',
  date: '2026-11-22',
  passageId: 'olcum-3b',
  result: testReading(1),
  level: 'instructional',
};

describe('IndexedDbRepository', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens with the series book and the passages, and no profile yet', async () => {
    const repository = await IndexedDbRepository.open();

    expect((await repository.listBooks()).map((book) => book.id)).toEqual(['kayip-fenerin-izinde']);
    expect((await repository.listPassages(3)).map((passage) => passage.id)).toEqual([
      'olcum-3a',
      'olcum-3b',
    ]);
    expect(await repository.getParent()).toBeNull();
    expect(await repository.getChild()).toBeNull();
  });

  it('reads back what it saved', async () => {
    const repository = await IndexedDbRepository.open();
    const session = testSession('2026-11-21', 4);
    expect(await repository.getSession('2026-11-21')).toBeNull();

    await repository.saveParent(parent);
    await repository.saveChild(child);
    await repository.saveSession(session);
    await repository.saveStuckWords([card('patika')]);
    await repository.saveAssessment(assessment);
    await repository.saveDrillSuggestion({
      suffixes: ['‑yordu'],
      words: ['kıvrılıyordu'],
      days: 3,
    });

    expect(await repository.getParent()).toEqual(parent);
    expect(await repository.getChild()).toEqual(child);
    expect(await repository.getSession('2026-11-21')).toEqual(session);
    expect(await repository.listStuckWords()).toEqual([card('patika')]);
    expect(await repository.listAssessments()).toEqual([assessment]);
    expect(await repository.getDrillSuggestion()).toEqual({
      suffixes: ['‑yordu'],
      words: ['kıvrılıyordu'],
      days: 3,
    });

    await repository.saveDrillSuggestion(null);
    expect(await repository.getDrillSuggestion()).toBeNull();
  });

  it('keeps the warmup deck of a session and the narration rate of the child', async () => {
    const repository = await IndexedDbRepository.open();
    const session = testSession('2026-11-21', 4, {
      step: 'warmup',
      warmup: { words: ['kıvrılıyordu', 'ağaçlarının'], done: 1, scored: 2 },
    });

    await repository.saveChild({ ...child, narrationRate: 'normal' });
    await repository.saveSession(session);

    expect((await repository.getChild())?.narrationRate).toBe('normal');
    expect((await repository.getSession('2026-11-21'))?.warmup).toEqual({
      words: ['kıvrılıyordu', 'ağaçlarının'],
      done: 1,
      scored: 2,
    });
  });

  it('lists the sessions of a date range, both ends included, in date order', async () => {
    const repository = await IndexedDbRepository.open();
    for (const date of ['2026-11-21', '2026-11-15', '2026-11-16', '2026-11-19', '2026-11-22']) {
      await repository.saveSession(testSession(date, 1));
    }

    const sessions = await repository.listSessions('2026-11-16', '2026-11-21');

    expect(sessions.map((session) => session.date)).toEqual([
      '2026-11-16',
      '2026-11-19',
      '2026-11-21',
    ]);
  });

  it('replaces the whole set of stuck words', async () => {
    const repository = await IndexedDbRepository.open();
    await repository.saveStuckWords([card('patika'), card('rüzgârı')]);

    await repository.saveStuckWords([card('patika', 2)]);

    expect(await repository.listStuckWords()).toEqual([card('patika', 2)]);
  });

  it('clears the user data and loads the content again', async () => {
    const repository = await IndexedDbRepository.open();
    await repository.saveParent(parent);
    await repository.saveChild(child);
    await repository.saveSession(testSession('2026-11-21', 4));
    await repository.saveStuckWords([card('patika')]);
    await repository.saveAssessment(assessment);

    await repository.clearAll();

    expect(await repository.getParent()).toBeNull();
    expect(await repository.getChild()).toBeNull();
    expect(await repository.listSessions('2026-01-01', '2026-12-31')).toEqual([]);
    expect(await repository.listStuckWords()).toEqual([]);
    expect(await repository.listAssessments()).toEqual([]);
    expect((await repository.listBooks()).map((book) => book.id)).toEqual(['kayip-fenerin-izinde']);
    expect(await repository.listPassages(3)).toHaveLength(2);
  });

  it('does not load the content twice when opened again', async () => {
    const first = await IndexedDbRepository.open();
    await first.saveSession(testSession('2026-11-21', 4));

    const second = await IndexedDbRepository.open();

    expect(await second.listBooks()).toHaveLength(1);
    expect(await second.getSession('2026-11-21')).not.toBeNull();
  });

  it('fails with the typed error and closes the database when the content cannot be stored', async () => {
    const quota = new DOMException('The storage quota is used up', 'QuotaExceededError');
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw quota;
    });
    const close = vi.spyOn(IDBDatabase.prototype, 'close');

    const failure = await IndexedDbRepository.open().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RepositoryUnavailableError);
    expect(failure).toMatchObject({ cause: quota });
    expect(close).toHaveBeenCalled();
    put.mockRestore();
    close.mockRestore();
  });

  it('fails with a typed error where IndexedDB is missing or cannot open', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(IndexedDbRepository.open()).rejects.toBeInstanceOf(RepositoryUnavailableError);

    const refused = new DOMException('The user denied storage', 'SecurityError');
    vi.stubGlobal('indexedDB', {
      open: () => {
        throw refused;
      },
    });
    const failure = await IndexedDbRepository.open().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(RepositoryUnavailableError);
    expect(failure).toMatchObject({ name: 'RepositoryUnavailableError', cause: refused });
  });
});
