// What the AudioWorklet does with each render quantum (docs/dinleme-hatti.md, section 1):
// resample to 16 kHz, measure the level, convert to 16-bit PCM and cut 20 ms frames.
import { Framer } from './framer';
import { LevelMeter } from './levelMeter';
import { toInt16 } from './pcm';
import { Resampler } from './resampler';

/** 16 kHz mono frames of 320 samples (20 ms); a level every 800 samples (20 a second). */
export const captureFormat = {
  sampleRate: 16_000,
  frameSamples: 320,
  levelWindowSamples: 800,
} as const;

export interface ChainOutput {
  frames: Int16Array[];
  levels: number[];
}

export class CaptureChain {
  private readonly resampler: Resampler;
  private readonly meter = new LevelMeter(captureFormat.levelWindowSamples);
  private readonly framer = new Framer(captureFormat.frameSamples);

  constructor(inputRate: number) {
    this.resampler = new Resampler(inputRate, captureFormat.sampleRate);
  }

  process(input: Float32Array): ChainOutput {
    return this.consume(this.resampler.push(input));
  }

  /** Ends the stream: the resampler's tail becomes frames; a partial frame is dropped. */
  flush(): ChainOutput {
    return this.consume(this.resampler.flush());
  }

  private consume(samples: Float32Array): ChainOutput {
    return {
      frames: this.framer.push(toInt16(samples)),
      levels: this.meter.push(samples),
    };
  }
}
