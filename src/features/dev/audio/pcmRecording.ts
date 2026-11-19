// A take on the audio lab: frames collected up to a count, not a clock, so ten seconds are
// exactly 500 frames (docs/planlar/faz-1.md, decision 10).
import { captureFormat } from '../../../services/audio/captureChain';
import { rms, rmsToDbfs, toFloat32 } from '../../../services/audio/pcm';

/** Ten seconds of 20 ms frames. */
export const recordingFrames = 500;

export interface RecordingSummary {
  seconds: number;
  frames: number;
  /** Level of the whole take; minus infinity when it is silent. */
  levelDbfs: number;
}

export class PcmRecording {
  private readonly maxFrames: number;
  private readonly frames: Int16Array[] = [];

  constructor(maxFrames: number) {
    this.maxFrames = maxFrames;
  }

  /** Adds a frame unless the take is full; true once it is. */
  append(frame: Int16Array): boolean {
    if (this.frames.length < this.maxFrames) {
      this.frames.push(frame);
    }
    return this.frames.length >= this.maxFrames;
  }

  get frameCount(): number {
    return this.frames.length;
  }

  get seconds(): number {
    return (this.frames.length * captureFormat.frameSamples) / captureFormat.sampleRate;
  }

  toSamples(): Int16Array {
    const samples = new Int16Array(this.frames.length * captureFormat.frameSamples);
    this.frames.forEach((frame, index) => {
      samples.set(frame, index * captureFormat.frameSamples);
    });
    return samples;
  }
}

export function summarizeRecording(recording: PcmRecording): RecordingSummary {
  return {
    seconds: recording.seconds,
    frames: recording.frameCount,
    levelDbfs: rmsToDbfs(rms(toFloat32(recording.toSamples()))),
  };
}
