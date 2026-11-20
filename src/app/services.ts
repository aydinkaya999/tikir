// Which implementation each service uses (docs/mimari.md, "Servisler"): one place for the whole
// app. The audio lab's services live in devServices.ts, loaded with its developer route only.
import type { SessionDevices } from '../features/session/sessionContext';
import type { SessionStoreServices } from '../features/session/sessionStore';
import { localDateOf } from '../domain/date';
import { defaultCaptureSettings } from '../services/audio/AudioCapture';
import { browserCaptureEnvironment } from '../services/audio/browserCaptureEnvironment';
import { WebAudioWavPlayer } from '../services/audio/WavPlayer';
import { WebAudioCapture } from '../services/audio/WebAudioCapture';
import { createId } from '../services/id';
import { FakeListener } from '../services/listener/FakeListener';
import { type ScenarioName, scenarioNames, scenarioSets } from '../services/listener/scenarios';
import { createNarrator } from '../services/narrator/createNarrator';
import type { Narrator } from '../services/narrator/Narrator';
import { PcmRecorder } from '../services/recorder/PcmRecorder';
import type { Recorder } from '../services/recorder/Recorder';
import { IndexedDbRecordingStore, type RecordingStore } from '../services/recorder/RecordingStore';
import { IndexedDbRepository } from '../services/repository/IndexedDbRepository';
import type { Repository } from '../services/repository/Repository';
import { BrowserShareService } from '../services/share/ShareService';
import { readTabSetting, tabSettingKeys } from '../services/tabSettings';

let repository: Promise<Repository> | null = null;

/** The page's one repository. A failed open is not kept, so a later call tries again. */
export function appRepository(): Promise<Repository> {
  repository ??= IndexedDbRepository.open().catch((error: unknown) => {
    repository = null;
    throw error;
  });
  return repository;
}

const recordingStore: RecordingStore = new IndexedDbRecordingStore();
let recorder: Recorder | null = null;

/** Where the page's recordings are kept (the recordings store of IndexedDB). */
export function appRecordingStore(): RecordingStore {
  return recordingStore;
}

/** The page's one recorder; its player starts inside the child's tap (iPhone). */
export function appRecorder(): Recorder {
  recorder ??= new PcmRecorder(recordingStore, new WebAudioWavPlayer());
  return recorder;
}

/** What the session store needs: the repository, the recorder, today and the clock. */
export function sessionStoreServices(): SessionStoreServices {
  return {
    repository: appRepository,
    recorder: appRecorder(),
    today: () => localDateOf(new Date()),
    now: () => new Date(),
    createId,
  };
}

/**
 * The developer listener setting (&senaryo=, docs/planlar/faz-2b.md, karar 7), read once when the
 * page starts. The check stays inline so production drops it: there the readings are typical.
 */
function developerListener(): string | null {
  return import.meta.env.MODE !== 'production' ? readTabSetting(tabSettingKeys.listener) : null;
}

/**
 * The session's devices: one microphone, one narrator, the recorder, and a new fake listener per
 * reading (the only listener until phase 6, so it is part of the product build).
 */
export function sessionDevices(): SessionDevices {
  const setting = developerListener();
  const manual = setting === 'elle';
  const scenarioName: ScenarioName = scenarioNames.find((name) => name === setting) ?? 'typical';
  const scenarios = scenarioSets[scenarioName];
  let narrator: Promise<Narrator> | null = null;
  return {
    audio: new WebAudioCapture(defaultCaptureSettings, browserCaptureEnvironment()),
    narrator: () => (narrator ??= createNarrator()),
    recorder: appRecorder(),
    listener: (kind, attempt) => {
      if (manual) {
        const listener = new FakeListener({ kind: 'manual' });
        return {
          listener,
          mark: (mark) => {
            listener.mark(mark);
          },
        };
      }
      if (kind === 'warmup') {
        return { listener: new FakeListener() };
      }
      if (kind === 'assessment') {
        return { listener: new FakeListener({ kind: 'scenario', scenario: scenarios.assessment }) };
      }
      return {
        listener: new FakeListener({ kind: 'scenario', scenario: scenarios.readings[attempt - 1] }),
      };
    },
    scenario: { ghostWpm: scenarios.ghostWpm ?? null, layout: scenarios.layout ?? 'content' },
    random: () => Math.random(),
    share: new BrowserShareService(),
  };
}
