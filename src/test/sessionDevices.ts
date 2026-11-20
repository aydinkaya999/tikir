// Session devices for screen tests: a hand-driven microphone, a silent narrator, a recorder whose
// calls are recorded, and listeners chosen by the test (docs/planlar/faz-2b.md, Task 7).
import { vi } from 'vitest';
import type { Attempt } from '../domain/types';
import type { ListenerChoice, SessionDevices } from '../features/session/sessionContext';
import { FakeListener } from '../services/listener/FakeListener';
import type { Narrator } from '../services/narrator/Narrator';
import { SilentNarrator } from '../services/narrator/SilentNarrator';
import type { Recorder, RecordingInfo } from '../services/recorder/Recorder';
import { FakeAudioCapture } from './fakeCapture';

export interface TestRecorder extends Recorder {
  start: ReturnType<typeof vi.fn<Recorder['start']>>;
  stop: ReturnType<typeof vi.fn<Recorder['stop']>>;
  play: ReturnType<typeof vi.fn<Recorder['play']>>;
  stopPlayback: ReturnType<typeof vi.fn<Recorder['stopPlayback']>>;
  remove: ReturnType<typeof vi.fn<Recorder['remove']>>;
  get: ReturnType<typeof vi.fn<Recorder['get']>>;
  requestApproval: ReturnType<typeof vi.fn<Recorder['requestApproval']>>;
}

/** A recorder that keeps nothing: stop() hands out the given recording. */
export function testRecorder(
  recording: RecordingInfo = { id: 'kayit', seconds: 52, levels: [] },
): TestRecorder {
  return {
    start: vi.fn<Recorder['start']>(() => Promise.resolve()),
    stop: vi.fn<Recorder['stop']>(() => Promise.resolve(recording)),
    play: vi.fn<Recorder['play']>(() => Promise.resolve()),
    stopPlayback: vi.fn<Recorder['stopPlayback']>(),
    remove: vi.fn<Recorder['remove']>(() => Promise.resolve()),
    get: vi.fn<Recorder['get']>(() => Promise.resolve(recording)),
    requestApproval: vi.fn<Recorder['requestApproval']>(() => Promise.resolve()),
  };
}

export interface TestDevicesOptions {
  audio?: FakeAudioCapture;
  narrator?: Narrator;
  recorder?: Recorder;
  listener?: (kind: 'warmup' | 'reading', attempt: Attempt) => ListenerChoice;
  scenario?: SessionDevices['scenario'];
  random?: () => number;
}

export function testDevices(options: TestDevicesOptions = {}): SessionDevices & {
  audio: FakeAudioCapture;
} {
  const narrator = options.narrator ?? new SilentNarrator({ now: () => Date.now() });
  return {
    audio: options.audio ?? new FakeAudioCapture(),
    narrator: () => Promise.resolve(narrator),
    recorder: options.recorder ?? testRecorder(),
    listener: options.listener ?? (() => ({ listener: new FakeListener() })),
    scenario: options.scenario ?? { ghostWpm: null, layout: 'content' },
    random: options.random ?? (() => 0),
  };
}
