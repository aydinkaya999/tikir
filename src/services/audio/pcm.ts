// 16-bit PCM conversions and signal levels (docs/dinleme-hatti.md, section 1). The capture chain
// runs them inside the AudioWorklet, so they stay free of browser APIs.

/**
 * A float sample in [-1, 1] as a 16-bit sample. The scale is 32768 both ways (see toFloat32), so
 * the round trip stays within one step; +1 clips to 32767, NaN becomes silence.
 */
export function floatToInt16(sample: number): number {
  if (Number.isNaN(sample)) {
    return 0;
  }
  return Math.max(-32768, Math.min(32767, Math.round(sample * 32768)));
}

export function toInt16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    out[index] = floatToInt16(samples[index] ?? 0);
  }
  return out;
}

export function toFloat32(samples: Int16Array): Float32Array {
  const out = new Float32Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    out[index] = (samples[index] ?? 0) / 32768;
  }
  return out;
}

/** Root mean square of float samples; 0 for none. */
export function rms(samples: ArrayLike<number>): number {
  if (samples.length === 0) {
    return 0;
  }
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const value = samples[index] ?? 0;
    sum += value * value;
  }
  return Math.sqrt(sum / samples.length);
}

/** A linear level in decibels relative to full scale; silence is minus infinity. */
export function rmsToDbfs(value: number): number {
  return value > 0 ? 20 * Math.log10(value) : Number.NEGATIVE_INFINITY;
}

/** True when every sample is exactly zero: a capture that delivers frames but no sound. */
export function isSilent(samples: Int16Array): boolean {
  return samples.every((sample) => sample === 0);
}
