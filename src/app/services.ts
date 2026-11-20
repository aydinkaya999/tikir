// Which implementation each service uses (docs/mimari.md, "Servisler"). The developer pages import
// this module lazily. TODO(phase 2b): when a product screen imports appRepository, move
// audioLabServices into a developer-only module so the audio lab stays out of the production build.
import type { AudioLabServices } from '../features/dev/audio/AudioLabPage';
import type { SessionStoreServices } from '../features/session/sessionStore';
import { localDateOf } from '../domain/date';
import { browserCaptureEnvironment } from '../services/audio/browserCaptureEnvironment';
import { type WavPlayer, WebAudioWavPlayer } from '../services/audio/WavPlayer';
import { WebAudioCapture } from '../services/audio/WebAudioCapture';
import { readEnvironment, readMicrophonePermission } from '../services/device/environment';
import { pageWebSocketUrl, WebSocketEchoProbe } from '../services/echo/WebSocketEchoProbe';
import { saveFile } from '../services/files';
import { createId } from '../services/id';
import { PcmRecorder } from '../services/recorder/PcmRecorder';
import type { Recorder } from '../services/recorder/Recorder';
import { IndexedDbRecordingStore, type RecordingStore } from '../services/recorder/RecordingStore';
import { IndexedDbRepository } from '../services/repository/IndexedDbRepository';
import type { Repository } from '../services/repository/Repository';
import { devEndpoints } from './routes';

const player: WavPlayer = new WebAudioWavPlayer();

export const audioLabServices: AudioLabServices = {
  createCapture: (settings) => new WebAudioCapture(settings, browserCaptureEnvironment()),
  player,
  saveFile,
  createEchoProbe: () => new WebSocketEchoProbe(),
  defaultEchoUrl: () => pageWebSocketUrl(devEndpoints.echo),
  readEnvironment,
  readMicrophonePermission,
};

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
