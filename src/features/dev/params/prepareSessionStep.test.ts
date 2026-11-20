import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { sessionMinutesSpent } from '../../../domain/progress';
import type { Session } from '../../../domain/types';
import { IndexedDbRecordingStore } from '../../../services/recorder/RecordingStore';
import { IndexedDbRepository } from '../../../services/repository/IndexedDbRepository';
import type { Repository } from '../../../services/repository/Repository';
import { placeOf } from '../../session/sessionMachine';
import type { SessionStoreServices } from '../../session/sessionStore';
import { loadDemoProfile } from '../demo/loadDemoProfile';
import { prepareSessionStep } from './prepareSessionStep';

const today = '2026-11-21';

async function setup() {
  const repository = await IndexedDbRepository.open();
  await loadDemoProfile(repository, 'cocuk-sabahi', today);
  let id = 0;
  const services: SessionStoreServices = {
    repository: () => Promise.resolve(repository),
    recorder: { remove: () => Promise.resolve() },
    today: () => today,
    now: () => new Date('2026-11-21T09:20:00.000Z'),
    createId: () => {
      id += 1;
      return `kimlik-${String(id)}`;
    },
  };
  return { repository, services, recordings: new IndexedDbRecordingStore() };
}

async function sessionOf(repository: Repository): Promise<Session> {
  const session = await repository.getSession(today);
  if (session === null) {
    throw new Error('no session today');
  }
  return session;
}

describe('prepareSessionStep', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('opens the warmup at its first card', async () => {
    const { repository, services, recordings } = await setup();

    await prepareSessionStep(services, 'warmup', 'typical', recordings);

    expect(placeOf(await sessionOf(repository))).toEqual({
      step: 'warmup',
      card: 0,
      secondAttempt: false,
    });
  });

  it('brings the session to the second reading after a typical first one', async () => {
    const { repository, services, recordings } = await setup();

    await prepareSessionStep(services, 'read-2', 'typical', recordings);

    const session = await sessionOf(repository);
    expect(placeOf(session)).toEqual({ step: 'read', attempt: 2, redo: false });
    expect(session.readings.map((reading) => reading.wcpm)).toEqual([64]);
  });

  it('reads the design scenario first as the typical one', async () => {
    const { repository, services, recordings } = await setup();

    await prepareSessionStep(services, 'read-2', 'design', recordings);

    const reading = (await sessionOf(repository)).readings[0];
    expect(reading?.wcpm).toBe(64);
    expect(
      reading?.words.filter((word) => word.status !== 'correct').map((word) => word.index),
    ).toEqual([15, 35, 40]);
  });

  it('records the third reading with a 52-second recording', async () => {
    const { repository, services, recordings } = await setup();

    await prepareSessionStep(services, 'record', 'typical', recordings);

    const session = await sessionOf(repository);
    expect(session.step).toBe('record');
    expect(session.readings).toHaveLength(3);
    const recordingId = session.readings[2]?.recordingId;
    const recording = recordingId === undefined ? null : await recordings.get(recordingId);
    expect(recording?.seconds).toBe(52);
    expect(recording?.levels).toHaveLength(64);
  });

  it('finishes the session twelve minutes after it started', async () => {
    const { repository, services, recordings } = await setup();

    await prepareSessionStep(services, 'done', 'typical', recordings);

    const session = await sessionOf(repository);
    expect(session.step).toBe('done');
    expect(session.tamedToday).toEqual(['ağaçlarının']);
    expect(sessionMinutesSpent(session)).toBe(12);
  });
});
