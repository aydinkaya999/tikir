// A session store over a fresh fake IndexedDB with the demo profile, optionally brought to a step
// with the developer step parameter's own code (docs/planlar/faz-2b.md, Task 6).
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { vi } from 'vitest';
import type { LocalDate } from '../domain/types';
import type { DevStep, SetupParam } from '../features/dev/params/devParams';
import { prepareSessionStep } from '../features/dev/params/prepareSessionStep';
import { prepareSetupStep } from '../features/dev/params/prepareSetupStep';
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
  /** An empty store brought to a setup step instead of the demo profile (Faz 3, karar 5). */
  setup?: SetupParam;
}

export async function demoSessionStore(options: DemoSessionOptions = {}) {
  globalThis.indexedDB = new IDBFactory();
  const repository = await IndexedDbRepository.open();
  if (options.setup === undefined) {
    await loadDemoProfile(repository, options.mode ?? 'cocuk-sabahi', testToday);
  }
  if (options.consent === false && options.setup === undefined) {
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
  if (options.setup !== undefined) {
    await prepareSetupStep(services, options.setup, { consent: options.consent !== false });
  }
  if (options.step !== undefined) {
    await prepareSessionStep(services, options.step, options.scenario ?? 'typical', recordings);
  }
  return { repository, recordings, services, store: createSessionStore(services) };
}
