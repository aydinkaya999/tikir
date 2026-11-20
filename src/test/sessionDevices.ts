// Session devices for screen tests: a hand-driven microphone, a silent narrator, a recorder whose
// calls are recorded, and listeners chosen by the test (docs/planlar/faz-2b.md, Task 7).
import { vi } from 'vitest';
import type { Attempt } from '../domain/types';
import type {
  ListenerChoice,
  ListenerKind,
  SessionDevices,
} from '../features/session/sessionContext';
import type { BookGenerator } from '../services/books/BookGenerator';
import { MockBookGenerator } from '../services/books/MockBookGenerator';
import { FakeListener } from '../services/listener/FakeListener';
import type { Narrator } from '../services/narrator/Narrator';
import { SilentNarrator } from '../services/narrator/SilentNarrator';
import type { Recorder, RecordingInfo } from '../services/recorder/Recorder';
import type { ShareService } from '../services/share/ShareService';
import { FakeAudioCapture } from './fakeCapture';

export interface TestRecorder extends Recorder {
  start: ReturnType<typeof vi.fn<Recorder['start']>>;
  stop: ReturnType<typeof vi.fn<Recorder['stop']>>;
  pause: ReturnType<typeof vi.fn<Recorder['pause']>>;
  resume: ReturnType<typeof vi.fn<Recorder['resume']>>;
  play: ReturnType<typeof vi.fn<Recorder['play']>>;
  stopPlayback: ReturnType<typeof vi.fn<Recorder['stopPlayback']>>;
  remove: ReturnType<typeof vi.fn<Recorder['remove']>>;
  get: ReturnType<typeof vi.fn<Recorder['get']>>;
  requestApproval: ReturnType<typeof vi.fn<Recorder['requestApproval']>>;
  approve: ReturnType<typeof vi.fn<Recorder['approve']>>;
  list: ReturnType<typeof vi.fn<Recorder['list']>>;
}

/** A recorder that keeps nothing: stop() hands out the given recording. */
export function testRecorder(
  recording: RecordingInfo = { id: 'kayit', seconds: 52, levels: [] },
): TestRecorder {
  return {
    start: vi.fn<Recorder['start']>(() => Promise.resolve()),
    stop: vi.fn<Recorder['stop']>(() => Promise.resolve(recording)),
    pause: vi.fn<Recorder['pause']>(),
    resume: vi.fn<Recorder['resume']>(),
    play: vi.fn<Recorder['play']>(() => Promise.resolve()),
    stopPlayback: vi.fn<Recorder['stopPlayback']>(),
    remove: vi.fn<Recorder['remove']>(() => Promise.resolve()),
    get: vi.fn<Recorder['get']>(() => Promise.resolve(recording)),
    requestApproval: vi.fn<Recorder['requestApproval']>(() => Promise.resolve()),
    approve: vi.fn<Recorder['approve']>(() => Promise.resolve()),
    list: vi.fn<Recorder['list']>(() => Promise.resolve([])),
  };
}

export interface TestShare extends ShareService {
  canShare: ReturnType<typeof vi.fn<ShareService['canShare']>>;
  share: ReturnType<typeof vi.fn<ShareService['share']>>;
}

/** A share service whose calls are recorded; it shares unless the test says otherwise. */
export function testShare(): TestShare {
  return {
    canShare: vi.fn<ShareService['canShare']>(() => true),
    share: vi.fn<ShareService['share']>(() => Promise.resolve('shared')),
  };
}

/**
 * A recorder whose playback lasts until it is stopped, as a real recording does, and which keeps
 * the approval sent from G5. null: the recording cannot be found.
 */
export function heldPlaybackRecorder(
  recording: Omit<RecordingInfo, 'id'> | null = { seconds: 52, levels: [] },
): TestRecorder {
  const recorder = testRecorder();
  let current = recording;
  let endPlayback: (() => void) | null = null;
  recorder.get.mockImplementation((id) => Promise.resolve(current && { ...current, id }));
  recorder.play.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        endPlayback = resolve;
      }),
  );
  recorder.stopPlayback.mockImplementation(() => {
    endPlayback?.();
    endPlayback = null;
  });
  recorder.requestApproval.mockImplementation(() => {
    current = current && { ...current, approval: 'pending' };
    return Promise.resolve();
  });
  return recorder;
}

export interface TestDevicesOptions {
  audio?: FakeAudioCapture;
  narrator?: Narrator;
  recorder?: Recorder;
  listener?: (kind: ListenerKind, attempt: Attempt) => ListenerChoice;
  scenario?: SessionDevices['scenario'];
  random?: () => number;
  share?: ShareService;
  books?: BookGenerator;
}

/** The devices, with the hand-driven microphone typed as such for the tests' assertions. */
export type TestDevices = Omit<SessionDevices, 'audio'> & { audio: FakeAudioCapture };

export function testDevices(options: TestDevicesOptions = {}): TestDevices {
  const narrator = options.narrator ?? new SilentNarrator({ now: () => Date.now() });
  return {
    audio: options.audio ?? new FakeAudioCapture(),
    narrator: () => Promise.resolve(narrator),
    recorder: options.recorder ?? testRecorder(),
    listener: options.listener ?? (() => ({ listener: new FakeListener() })),
    scenario: options.scenario ?? { ghostWpm: null, layout: 'content' },
    random: options.random ?? (() => 0),
    share: options.share ?? testShare(),
    // The real mock generator, without its wait.
    books: options.books ?? new MockBookGenerator({ delayMs: 0 }),
  };
}
