// Streaming sample-rate converter for the capture chain (docs/dinleme-hatti.md, section 1;
// docs/planlar/faz-1.md, decision 7). Windowed-sinc interpolation with a Blackman window, cut off
// at 0.9 × the lower Nyquist rate, 16 zero crossings on each side. Works for any pair of rates:
// 44.1 and 48 kHz devices, 16 and 24 kHz Bluetooth headsets, 8 kHz up to 16 kHz.

const zeroCrossings = 16;
const cutoffRatio = 0.9;

interface Kernel {
  /** Offset of the first tap from floor(position). */
  first: number;
  /** Weights normalised to sum to 1, so a constant signal keeps its level. */
  weights: Float64Array;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function sinc(x: number): number {
  return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
}

/** Blackman window on [-1, 1]; 0 outside. */
function blackman(u: number): number {
  return Math.abs(u) >= 1
    ? 0
    : 0.42 + 0.5 * Math.cos(Math.PI * u) + 0.08 * Math.cos(2 * Math.PI * u);
}

export class Resampler {
  readonly inputRate: number;
  readonly outputRate: number;
  private readonly passthrough: boolean;
  /** Cut-off in cycles per input sample. */
  private readonly cutoff: number;
  /** Half the kernel length, in input samples. */
  private readonly halfWidth: number;
  /** Output sample n sits at input position n × stepIn / stepOut (the reduced rate ratio). */
  private readonly stepIn: number;
  private readonly stepOut: number;
  /** One kernel per distinct fractional position, keyed by (n × stepIn) mod stepOut. */
  private readonly kernels = new Map<number, Kernel>();
  private buffer = new Float32Array(4096);
  /** Absolute input index of buffer[0]. */
  private bufferStart = 0;
  /** Absolute input index after the last received sample. */
  private received = 0;
  /** Index of the next output sample. */
  private next = 0;

  /** Rates are rounded to whole hertz; AudioContext reports whole rates in practice. */
  constructor(inputRate: number, outputRate: number) {
    this.inputRate = Math.round(inputRate);
    this.outputRate = Math.round(outputRate);
    if (!(this.inputRate > 0) || !(this.outputRate > 0)) {
      throw new RangeError(`Sample rates must be positive: ${inputRate} → ${outputRate}`);
    }
    this.passthrough = this.inputRate === this.outputRate;
    const divisor = greatestCommonDivisor(this.inputRate, this.outputRate);
    this.stepIn = this.inputRate / divisor;
    this.stepOut = this.outputRate / divisor;
    const cutoffHz = (cutoffRatio * Math.min(this.inputRate, this.outputRate)) / 2;
    this.cutoff = cutoffHz / this.inputRate;
    this.halfWidth = zeroCrossings / (2 * this.cutoff);
  }

  /** The output samples that the input so far completes. */
  push(input: Float32Array): Float32Array {
    if (this.passthrough) {
      return input.slice();
    }
    this.append(input);
    return this.produce(false);
  }

  /** The remaining output samples, reading the input as silence past its end. Ends the stream. */
  flush(): Float32Array {
    return this.passthrough ? new Float32Array(0) : this.produce(true);
  }

  private kernel(fraction: number): Kernel {
    const cached = this.kernels.get(fraction);
    if (cached !== undefined) {
      return cached;
    }
    const offset = fraction / this.stepOut;
    const first = Math.ceil(offset - this.halfWidth);
    const last = Math.floor(offset + this.halfWidth);
    const weights = new Float64Array(last - first + 1);
    let sum = 0;
    for (let tap = first; tap <= last; tap += 1) {
      const distance = tap - offset;
      const weight = sinc(2 * this.cutoff * distance) * blackman(distance / this.halfWidth);
      weights[tap - first] = weight;
      sum += weight;
    }
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] = (weights[index] ?? 0) / sum;
    }
    const kernel = { first, weights };
    this.kernels.set(fraction, kernel);
    return kernel;
  }

  private produce(final: boolean): Float32Array {
    const out: number[] = [];
    // Output n exists while its position n × stepIn / stepOut lies inside the input.
    while (this.next * this.stepIn < this.received * this.stepOut) {
      const scaled = this.next * this.stepIn;
      const fraction = scaled % this.stepOut;
      const base = (scaled - fraction) / this.stepOut;
      const kernel = this.kernel(fraction);
      const firstTap = base + kernel.first;
      if (!final && firstTap + kernel.weights.length > this.received) {
        break; // the kernel still needs input that has not arrived
      }
      out.push(this.apply(firstTap, kernel.weights));
      this.next += 1;
    }
    this.discardUnneeded();
    return Float32Array.from(out);
  }

  /** Weighted sum of the input from firstTap on; input before the start or past the end is 0. */
  private apply(firstTap: number, weights: Float64Array): number {
    let sum = 0;
    for (let index = 0; index < weights.length; index += 1) {
      const position = firstTap + index;
      if (position >= this.bufferStart && position < this.received) {
        sum += (this.buffer[position - this.bufferStart] ?? 0) * (weights[index] ?? 0);
      }
    }
    return sum;
  }

  private append(input: Float32Array): void {
    const kept = this.received - this.bufferStart;
    if (kept + input.length > this.buffer.length) {
      const grown = new Float32Array(Math.max(this.buffer.length * 2, kept + input.length));
      grown.set(this.buffer.subarray(0, kept));
      this.buffer = grown;
    }
    this.buffer.set(input, kept);
    this.received += input.length;
  }

  /** Keeps only the input the next output's kernel can reach. */
  private discardUnneeded(): void {
    const nextBase = Math.floor((this.next * this.stepIn) / this.stepOut);
    const keepFrom = Math.max(this.bufferStart, nextBase - Math.ceil(this.halfWidth) - 1);
    const drop = Math.min(keepFrom, this.received) - this.bufferStart;
    if (drop > 0) {
      this.buffer.copyWithin(0, drop, this.received - this.bufferStart);
      this.bufferStart += drop;
    }
  }
}
