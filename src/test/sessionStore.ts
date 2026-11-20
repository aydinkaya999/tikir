// A session store over a fresh fake IndexedDB with the demo profile, optionally brought to a step
// with the developer step parameter's own code (docs/planlar/faz-2b.md, Task 6).
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { vi } from 'vitest';
import type { LocalDate } from '../domain/types';
import type { DevStep } from '../features/dev/params/devParams';
import { prepareSessionStep } from '../features/dev/params/prepareSessionStep';
import { type DemoMode, loadDemoProfile } from '../features/dev/demo/loadDemoProfile';
import { createSessionStore, type SessionStoreServices } from '../features/session/sessionStore';
import type { ScenarioName } from '../services/listener/scenarios';
import { IndexedDbRecordingStore } from '../services/recorder/RecordingStore';
import { IndexedDbRepository } from '../services/repository/IndexedDbRepository';

/** The demo profile's day 0, a Saturday. */
export const testToday = '2026-11-21';

export interface DemoSessionOptions {
  mode?: DemoMode;
  step?: DevStep;
  scenario?: ScenarioName;
  consent?: boolean;
  /** The store's day; testToday unless a test moves it. */
  today?: () => LocalDate;
}

export async function demoSessionStore(options: DemoSessionOptions = {}) {
  globalThis.indexedDB = new IDBFactory();
  const repository = await IndexedDbRepository.open();
  await loadDemoProfile(repository, options.mode ?? 'cocuk-sabahi', testToday);
  if (options.consent === false) {
    const parent = await repository.getParent();
    if (parent !== null) {
      await repository.saveParent({
        ...parent,
        consent: { ...parent.consent, voiceProcessing: false },
      });
    }
  }
  let id = 0;
  const services: SessionStoreServices = {
    repository: () => Promise.resolve(repository),
    recorder: { remove: vi.fn(() => Promise.resolve()) },
    today: options.today ?? (() => testToday),
    now: () => new Date('2026-11-21T09:20:00.000Z'),
    createId: () => {
      id += 1;
      return `kimlik-${String(id)}`;
    },
  };
  const recordings = new IndexedDbRecordingStore();
  if (options.step !== undefined) {
    await prepareSessionStep(services, options.step, options.scenario ?? 'typical', recordings);
  }
  return { repository, recordings, services, store: createSessionStore(services) };
}
