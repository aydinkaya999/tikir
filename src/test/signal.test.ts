import { describe, expect, it } from 'vitest';
import { peakFrequency, seededRandom, sine, zeroCrossingHz } from './signal';

// The frequency checks of the resampler and the e2e recording rest on these helpers, so they are
// checked against hand-derived values rather than against each other.

describe('sine', () => {
  it('samples one period of a 1 Hz tone at 4 Hz as 0, 1, 0, -1', () => {
    const samples = Array.from(sine({ hz: 1, sampleRate: 4, seconds: 1 }));

    expect(samples).toHaveLength(4);
    [0, 1, 0, -1].forEach((value, index) => {
      expect(samples[index]).toBeCloseTo(value, 6);
    });
  });

  it('scales by the amplitude', () => {
    expect(sine({ hz: 1, sampleRate: 4, seconds: 1, amplitude: 0.5 })[1]).toBeCloseTo(0.5, 6);
  });
});

describe('zeroCrossingHz', () => {
  it('reads an alternating signal at 8 Hz sampling as 4 Hz', () => {
    expect(zeroCrossingHz([1, -1, 1, -1, 1, -1, 1, -1, 1], 8)).toBeCloseTo(4, 6);
  });

  it('places crossings between samples (a 1 Hz tone sampled at 10 Hz for 3 s)', () => {
    const samples = Array.from({ length: 30 }, (_, index) => Math.sin((2 * Math.PI * index) / 10));

    expect(zeroCrossingHz(samples, 10)).toBeCloseTo(1, 2);
  });

  it('is 0 without at least two crossings', () => {
    expect(zeroCrossingHz([1, 1, 1], 8)).toBe(0);
    expect(zeroCrossingHz([1, -1], 8)).toBe(0);
  });
});

describe('seededRandom', () => {
  it('repeats its sequence for the same seed and stays in [0, 1)', () => {
    const first = seededRandom(7);
    const second = seededRandom(7);
    const values = Array.from({ length: 1000 }, () => first());

    expect(Array.from({ length: 1000 }, () => second())).toEqual(values);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(990);
  });

  it('gives different sequences for different seeds', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });
});

describe('peakFrequency', () => {
  it('finds a tone on its own', () => {
    const tone = sine({ hz: 437, sampleRate: 16_000, seconds: 2 });

    expect(peakFrequency(tone, 16_000, { from: 380, to: 500, step: 0.25 })).toBeCloseTo(437, 1);
  });

  it('picks the louder of two tones', () => {
    const loud = sine({ hz: 440, sampleRate: 16_000, seconds: 1, amplitude: 0.5 });
    const quiet = sine({ hz: 470, sampleRate: 16_000, seconds: 1, amplitude: 0.1 });
    const mixed = loud.map((value, index) => value + (quiet[index] ?? 0));

    expect(peakFrequency(mixed, 16_000, { from: 400, to: 500, step: 1 })).toBe(440);
  });
});
