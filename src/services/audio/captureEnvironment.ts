// The seam between WebAudioCapture and the browser. browserCaptureEnvironment() is the real one;
// tests pass a fake, so the capture's state machine is tested without a microphone.
import type { Unsubscribe } from '../types';
import type { AppliedTrackSettings, CaptureFailure, CaptureSettings } from './AudioCapture';

/** What the AudioWorklet processor posts to the main thread. */
export type WorkletMessage =
  | { type: 'frame'; seq: number; samples: Int16Array }
  | { type: 'level'; rms: number }
  /** 16 kHz samples the processor could not produce since its previous message (no input). */
  | { type: 'missed'; samples: number };

/** An open microphone: stream, audio context and processor, released together by close(). */
export interface CaptureGraph {
  readonly sampleRate: number;
  readonly trackSettings: AppliedTrackSettings;
  readonly deviceLabel: string;
  onMessage(callback: (message: WorkletMessage) => void): void;
  /** The track ended or the audio context was interrupted or closed by someone else. */
  onInterrupted(callback: (failure: CaptureFailure) => void): void;
  /** Stops the track, disconnects the nodes and closes the context. */
  close(): Promise<void>;
}

export interface CaptureEnvironment {
  /** getUserMedia exists (a secure context in a browser that has it). */
  readonly supported: boolean;
  /** Rejects with the browser's own error (a DOMException with a name). */
  open(settings: CaptureSettings): Promise<CaptureGraph>;
  /** The tab was hidden or the page is going away. */
  onPageHidden(callback: () => void): Unsubscribe;
}
