// The microphone, as the rest of the app sees it (docs/mimari.md, "Servisler";
// docs/dinleme-hatti.md, section 1). WebAudioCapture is the first implementation; a native
// Capacitor plugin would be the second, with the same interface and diagnostics.
import type { Unsubscribe } from '../types';

export type CaptureState = 'idle' | 'starting' | 'capturing' | 'denied' | 'unavailable' | 'error';

/** Browser audio processing; which of them helps recognition is measured in phase 1. */
export interface CaptureSettings {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

/** All three on, as browsers default (docs/kararlar.md, T18). */
export const defaultCaptureSettings: Readonly<CaptureSettings> = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/** What the device actually applied (MediaStreamTrack.getSettings()); fields may be missing. */
export interface AppliedTrackSettings {
  /** Newer browsers report a mode instead of true: 'all' or 'remote-only' (kept as reported). */
  echoCancellation?: boolean | string;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
  channelCount?: number;
  latency?: number;
}

export interface CaptureFailure {
  name: string;
  message: string;
}

export interface CaptureDiagnostics {
  requested: CaptureSettings;
  applied: AppliedTrackSettings | null;
  deviceLabel: string | null;
  inputSampleRate: number | null;
  framesDelivered: number;
  /** Frames the input never produced (empty render quanta) plus frames lost on the way. */
  framesDropped: number;
  /** Frames whose samples are all zero: a microphone that delivers no sound. */
  framesSilent: number;
  failure: CaptureFailure | null;
}

export interface AudioCapture {
  readonly state: CaptureState;
  /** Called from a user gesture. Never rejects: a failure becomes a state. */
  start(): Promise<void>;
  /** Safe in any state and when repeated. */
  stop(): Promise<void>;
  /** 16 kHz mono 16-bit PCM, 320 samples (20 ms) per frame. */
  onFrame(callback: (pcm16: Int16Array) => void): Unsubscribe;
  /** RMS level of the 16 kHz signal, about 20 times a second. */
  onLevel(callback: (rms: number) => void): Unsubscribe;
  onStateChange(callback: (state: CaptureState) => void): Unsubscribe;
  diagnostics(): CaptureDiagnostics;
}

/**
 * A thrown value as a name and a message. Read from the fields, because a DOMException is not an
 * Error in every engine (jsdom, older WebKit).
 */
export function toFailure(error: unknown): CaptureFailure {
  if (typeof error === 'object' && error !== null) {
    const { name, message } = error as { name?: unknown; message?: unknown };
    if (typeof name === 'string' && typeof message === 'string') {
      return { name, message };
    }
  }
  return { name: 'Error', message: String(error) };
}
