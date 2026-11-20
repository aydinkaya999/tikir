// Which implementation each service uses (docs/mimari.md, "Servisler"): one place for the whole
// app. The audio lab's services live in devServices.ts, loaded with its developer route only.
import type { SessionStoreServices } from '../features/session/sessionStore';
import { localDateOf } from '../domain/date';
import { WebAudioWavPlayer } from '../services/audio/WavPlayer';
import { createId } from '../services/id';
import { PcmRecorder } from '../services/recorder/PcmRecorder';
import type { Recorder } from '../services/recorder/Recorder';
import { IndexedDbRecordingStore, type RecordingStore } from '../services/recorder/RecordingStore';
import { IndexedDbRepository } from '../services/repository/IndexedDbRepository';
import type { Repository } from '../services/repository/Repository';

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
