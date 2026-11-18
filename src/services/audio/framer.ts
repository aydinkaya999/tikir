// Cuts a 16-bit sample stream into fixed-size frames (docs/dinleme-hatti.md, section 1: 20 ms,
// 320 samples at 16 kHz). Frames are fresh arrays, so the AudioWorklet can transfer them.

export class Framer {
  private readonly frameSamples: number;
  private readonly partial: Int16Array;
  private filled = 0;

  constructor(frameSamples: number) {
    if (!Number.isInteger(frameSamples) || frameSamples <= 0) {
      throw new RangeError(`Frame size must be a positive integer: ${frameSamples}`);
    }
    this.frameSamples = frameSamples;
    this.partial = new Int16Array(frameSamples);
  }

  /** The frames these samples complete; the rest waits, copied, for the next push. */
  push(samples: Int16Array): Int16Array[] {
    const frames: Int16Array[] = [];
    let offset = 0;
    while (offset < samples.length) {
      const take = Math.min(this.frameSamples - this.filled, samples.length - offset);
      this.partial.set(samples.subarray(offset, offset + take), this.filled);
      this.filled += take;
      offset += take;
      if (this.filled === this.frameSamples) {
        frames.push(this.partial.slice());
        this.filled = 0;
      }
    }
    return frames;
  }

  /** Samples waiting for the next frame. */
  get pending(): number {
    return this.filled;
  }
}
