import { describe, expect, it } from 'vitest';
import { seededRandom, sine, zeroCrossingHz } from '../../test/signal';
import { rms } from './pcm';
import { Resampler } from './resampler';

/** Everything the resampler gives for an input fed in the given chunk sizes, flush included. */
function resample(
  inputRate: number,
  outputRate: number,
  input: Float32Array,
  chunkSize: () => number = () => input.length,
): Float32Array {
  const resampler = new Resampler(inputRate, outputRate);
  const parts: Float32Array[] = [];
  for (let offset = 0; offset < input.length;) {
    const size = Math.max(1, chunkSize());
    parts.push(resampler.push(input.subarray(offset, offset + size)));
    offset += size;
  }
  parts.push(resampler.flush());
  const out = new Float32Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function noise(length: number, seed: number): Float32Array {
  const random = seededRandom(seed);
  return Float32Array.from({ length }, () => random() * 2 - 1);
}

/** Drops 20 ms at each end, where the filter starts up and winds down. */
function steady(samples: Float32Array, sampleRate: number): Float32Array {
  const edge = Math.round(0.02 * sampleRate);
  return samples.subarray(edge, samples.length - edge);
}

describe('Resampler', () => {
  it.each([
    [48000, 16000, 48000, 16000],
    [44100, 16000, 44100, 16000],
    [44100, 16000, 1000, 363],
    [48000, 16000, 1, 1],
    [24000, 16000, 2400, 1600],
    [8000, 16000, 800, 1600],
  ])('turns %i Hz into %i Hz: %i samples in, %i out', (inputRate, outputRate, length, expected) => {
    expect(resample(inputRate, outputRate, noise(length, 1))).toHaveLength(expected);
  });

  it.each([48000, 44100, 24000, 8000])(
    'holds back at most 40 output samples before flush (%i Hz in)',
    (inputRate) => {
      const resampler = new Resampler(inputRate, 16000);
      const input = noise(inputRate / 10, 2);
      let produced = 0;
      for (let offset = 0; offset < input.length; offset += 128) {
        produced += resampler.push(input.subarray(offset, offset + 128)).length;
      }
      const due = Math.ceil((input.length * 16000) / inputRate);

      expect(due - produced).toBeGreaterThanOrEqual(0);
      expect(due - produced).toBeLessThanOrEqual(40);
    },
  );

  it.each([48000, 44100])('does not depend on how the input is chunked (%i Hz in)', (rate) => {
    const input = noise(48000, 3);
    const random = seededRandom(4);

    const whole = resample(rate, 16000, input);
    const chunked = resample(rate, 16000, input, () => 1 + Math.floor(random() * 300));

    expect(chunked).toHaveLength(whole.length);
    let largest = 0;
    whole.forEach((value, index) => {
      largest = Math.max(largest, Math.abs(value - (chunked[index] ?? 0)));
    });
    expect(largest).toBeLessThan(1e-6);
  });

  it.each([48000, 44100, 24000, 8000])('keeps a 1 kHz sine (%i Hz in)', (rate) => {
    const tone = sine({ hz: 1000, sampleRate: rate, seconds: 1, amplitude: 0.5 });

    const out = steady(resample(rate, 16000, tone), 16000);

    expect(Math.abs(rms(out) - 0.3536)).toBeLessThanOrEqual(0.3536 * 0.01);
    expect(Math.abs(zeroCrossingHz(out, 16000) - 1000)).toBeLessThanOrEqual(2);
  });

  it.each([48000, 44100])('passes 3 kHz within ±0.5 dB (%i Hz in)', (rate) => {
    const tone = sine({ hz: 3000, sampleRate: rate, seconds: 1, amplitude: 0.5 });

    const ratio = rms(steady(resample(rate, 16000, tone), 16000)) / rms(tone);

    expect(ratio).toBeGreaterThanOrEqual(10 ** (-0.5 / 20));
    expect(ratio).toBeLessThanOrEqual(10 ** (0.5 / 20));
  });

  // 9 kHz sits just past the new 8 kHz Nyquist rate, where an unwindowed kernel leaks: speech
  // fricatives live there and would fold back to 7 kHz.
  it.each([
    [48000, 12000],
    [44100, 11000],
    [48000, 9000],
    [44100, 9000],
  ])('suppresses a tone above the new Nyquist rate by 40 dB (%i Hz in, %i Hz tone)', (rate, hz) => {
    const tone = sine({ hz, sampleRate: rate, seconds: 1, amplitude: 0.5 });

    const out = steady(resample(rate, 16000, tone), 16000);

    expect(rms(out)).toBeLessThan(rms(tone) * 0.01);
  });

  it('passes samples through unchanged when the rates match', () => {
    const input = noise(1000, 5);

    expect(Array.from(resample(16000, 16000, input))).toEqual(Array.from(input));
  });
});
