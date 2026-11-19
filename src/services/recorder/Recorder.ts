// Recording the third reading (docs/urun.md section 3; docs/kararlar.md T21). The child listens to
// it on G5 and may record it again.
import type { Id } from '../../domain/types';
import type { AudioCapture } from '../audio/AudioCapture';

export interface RecordingInfo {
  id: Id;
  seconds: number;
  /** The waveform on G5: 0 to 1, the loudest bar 1. */
  levels: number[];
}

export interface Recorder {
  /** Throws if the microphone is not capturing. */
  start(audio: AudioCapture): Promise<void>;
  stop(): Promise<RecordingInfo>;
  /** Call from the tap: it prepares the player before its first await (iPhone's gesture rule). */
  play(id: Id): Promise<void>;
  stopPlayback(): void;
  remove(id: Id): Promise<void>;
  get(id: Id): Promise<RecordingInfo | null>;
}
