// Signal level for the meter around the microphone button (docs/dinleme-hatti.md, section 1:
// about 20 RMS values a second).

export class LevelMeter {
  private readonly windowSamples: number;
  private sum = 0;
  private count = 0;

  constructor(windowSamples: number) {
    if (!Number.isInteger(windowSamples) || windowSamples <= 0) {
      throw new RangeError(`Window size must be a positive integer: ${windowSamples}`);
    }
    this.windowSamples = windowSamples;
  }

  /** One RMS value for every window these samples complete. */
  push(samples: Float32Array): number[] {
    const levels: number[] = [];
    for (const sample of samples) {
      this.sum += sample * sample;
      this.count += 1;
      if (this.count === this.windowSamples) {
        levels.push(Math.sqrt(this.sum / this.windowSamples));
        this.sum = 0;
        this.count = 0;
      }
    }
    return levels;
  }
}
