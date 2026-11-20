import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { IndexedDbRepository } from '../../../services/repository/IndexedDbRepository';
import type { SessionStoreServices } from '../../session/sessionStore';
import { prepareSetupStep } from './prepareSetupStep';

const today = '2026-11-21';

async function setup() {
  const repository = await IndexedDbRepository.open();
  let id = 0;
  const services: SessionStoreServices = {
    repository: () => Promise.resolve(repository),
    recorder: { remove: () => Promise.resolve() },
    today: () => today,
    now: () => new Date('2026-11-21T09:00:00.000Z'),
    createId: () => {
      id += 1;
      return `kimlik-${String(id)}`;
    },
  };
  return { repository, services };
}

describe('prepareSetupStep', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('leaves the store empty for the parent account', async () => {
    const { repository, services } = await setup();

    await prepareSetupStep(services, 'hesap', { consent: true });

    expect(await repository.getParent()).toBeNull();
  });

  it('writes the demo profile’s parent for the reader step', async () => {
    const { repository, services } = await setup();

    await prepareSetupStep(services, 'okuyucu', { consent: true });

    expect(await repository.getParent()).toMatchObject({
      email: 'veli@example.com',
      consent: { voiceProcessing: true, weeklyEmail: true },
      setup: 'reader',
    });
    expect(await repository.getChild()).toBeNull();
  });

  it('writes the demo profile’s reader for the level check', async () => {
    const { repository, services } = await setup();

    await prepareSetupStep(services, 'seviye', { consent: true });

    expect(await repository.getChild()).toMatchObject({
      name: 'Deniz',
      grade: 3,
      interests: ['Uzay', 'Futbol', 'Dinozorlar'],
    });
    expect((await repository.getParent())?.setup).toBe('level');
  });

  it('writes the demo profile’s first measurement for meeting Tıkır', async () => {
    const { repository, services } = await setup();

    await prepareSetupStep(services, 'tanisma', { consent: true });

    const [assessment] = await repository.listAssessments();
    expect(assessment).toMatchObject({ passageId: 'olcum-3a', level: 'instructional' });
    expect(assessment?.result.wcpm).toBe(58);
    expect((await repository.getParent())?.setup).toBe('meet');
  });

  it('meets Tıkır without a measurement when the parent did not consent', async () => {
    const { repository, services } = await setup();

    await prepareSetupStep(services, 'tanisma', { consent: false });

    expect(await repository.listAssessments()).toEqual([]);
    expect(await repository.getParent()).toMatchObject({
      consent: { voiceProcessing: false },
      setup: 'meet',
    });
  });
});
