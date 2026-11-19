// Signal helpers for tests: generated tones, a frequency estimate and a seeded random source.
// Unit tests and the e2e suite (the fake microphone's tone file) share them.

export function sine({
  hz,
  sampleRate,
  seconds,
  amplitude = 1,
}: {
  hz: number;
  sampleRate: number;
  seconds: number;
  amplitude?: number;
}): Float32Array {
  const length = Math.round(seconds * sampleRate);
  const samples = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    samples[index] = amplitude * Math.sin((2 * Math.PI * hz * index) / sampleRate);
  }
  return samples;
}

/**
 * Frequency of a tone from its zero crossings. Each crossing is placed between two samples by
 * linear interpolation; the estimate spans the first to the last crossing. 0 with fewer than two.
 */
export function zeroCrossingHz(samples: ArrayLike<number>, sampleRate: number): number {
  let first: number | null = null;
  let last = 0;
  let crossings = 0;
  for (let index = 0; index + 1 < samples.length; index += 1) {
    const current = samples[index] ?? 0;
    const next = samples[index + 1] ?? 0;
    if (current < 0 !== next < 0) {
      const position = index + current / (current - next);
      first ??= position;
      last = position;
      crossings += 1;
    }
  }
  if (first === null || crossings < 2) {
    return 0;
  }
  return (crossings - 1) / (2 * ((last - first) / sampleRate));
}

/** Deterministic random numbers in [0, 1) (mulberry32), so random chunkings repeat. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The strongest frequency in a range (Goertzel scan). Unlike zero crossings, it is not fooled by
 * the dropped samples of Chromium's file-fed fake microphone, which runs about 2 % fast (measured
 * in phase 1: zero crossings read 449 Hz where the spectral peak is 440.5 Hz).
 */
export function peakFrequency(
  samples: ArrayLike<number>,
  sampleRate: number,
  range: { from: number; to: number; step: number },
): number {
  let bestHz = range.from;
  let bestPower = -1;
  for (let hz = range.from; hz <= range.to + 1e-9; hz += range.step) {
    const coefficient = 2 * Math.cos((2 * Math.PI * hz) / sampleRate);
    let previous = 0;
    let beforePrevious = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const current = (samples[index] ?? 0) + coefficient * previous - beforePrevious;
      beforePrevious = previous;
      previous = current;
    }
    const power =
      previous * previous +
      beforePrevious * beforePrevious -
      coefficient * previous * beforePrevious;
    if (power > bestPower) {
      bestPower = power;
      bestHz = hz;
    }
  }
  return bestHz;
}
