// Recording the third reading (docs/urun.md section 3; docs/kararlar.md T21). The child listens to
// it on G5 and may record it again.
import type { Id } from '../../domain/types';
import type { AudioCapture } from '../audio/AudioCapture';

/** 'pending' once the child sent it from G5; 'approved' once the parent approved it on V2. */
export type RecordingApproval = 'pending' | 'approved';

export interface RecordingInfo {
  id: Id;
  seconds: number;
  /** The waveform on G5: 0 to 1, the loudest bar 1. */
  levels: number[];
  approval?: RecordingApproval;
}

/** A recording on the account page and in V2's approval list: when it was made. */
export interface RecordingEntry extends RecordingInfo {
  createdAt: string;
}

/** A part of a recording, in milliseconds from its start (the reading's word times). */
export interface PlaybackRange {
  fromMs: number;
  toMs: number;
}

export interface Recorder {
  /** Throws if the microphone is not capturing. */
  start(audio: AudioCapture): Promise<void>;
  stop(): Promise<RecordingInfo>;
  /** The frames that come while paused are left out: the reading's pauses are not recorded. */
  pause(): void;
  resume(): void;
  /**
   * Call from the tap: it prepares the player before its first await (iPhone's gesture rule).
   * With a range, only that part plays (V2: one word of a reading).
   */
  play(id: Id, range?: PlaybackRange): Promise<void>;
  stopPlayback(): void;
  remove(id: Id): Promise<void>;
  get(id: Id): Promise<RecordingInfo | null>;
  /** G5's "Gönder": the recording waits for the parent's approval. Rejects for an unknown id. */
  requestApproval(id: Id): Promise<void>;
  /**
   * V2's "Onayla": the parent approves the recording. It stays on the device until the backend
   * shares it with the family (phase 6). Rejects for an unknown id.
   */
  approve(id: Id): Promise<void>;
  /** Every recording, newest first, without its sound (the account page, V2's approvals). */
  list(): Promise<RecordingEntry[]>;
}
