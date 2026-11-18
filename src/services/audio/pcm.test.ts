import { describe, expect, it } from 'vitest';
import { seededRandom, sine } from '../../test/signal';
import { floatToInt16, isSilent, rms, rmsToDbfs, toFloat32, toInt16 } from './pcm';

describe('floatToInt16', () => {
  it.each([
    [1, 32767],
    [-1, -32768],
    [0, 0],
    [0.5, 16384],
    [1.5, 32767],
    [-1.5, -32768],
    [Number.NaN, 0],
  ])('maps %f to %i', (sample, expected) => {
    expect(floatToInt16(sample)).toBe(expected);
  });
});

describe('toInt16 and toFloat32', () => {
  it('convert every sample', () => {
    expect(Array.from(toInt16(Float32Array.from([0.5, -0.5, 1, -1])))).toEqual([
      16384, -16384, 32767, -32768,
    ]);
    expect(Array.from(toFloat32(Int16Array.from([16384, -16384, -32768])))).toEqual([
      0.5, -0.5, -1,
    ]);
  });

  it('round-trip within one step of 16-bit resolution', () => {
    const random = seededRandom(3);
    const samples = Float32Array.from({ length: 5000 }, () => random() * 2 - 1);

    const back = toFloat32(toInt16(samples));

    samples.forEach((sample, index) => {
      expect(Math.abs((back[index] ?? 0) - sample)).toBeLessThanOrEqual(1 / 32768);
    });
  });
});

describe('rms', () => {
  it('is the level of a constant signal', () => {
    expect(rms(new Float32Array(100).fill(0.5))).toBeCloseTo(0.5, 6);
  });

  it('is amplitude / √2 for a sine', () => {
    const tone = sine({ hz: 1000, sampleRate: 48000, seconds: 1, amplitude: 0.5 });

    expect(Math.abs(rms(tone) - 0.3536)).toBeLessThanOrEqual(0.001);
  });

  it('is 0 for no samples', () => {
    expect(rms([])).toBe(0);
  });
});

describe('rmsToDbfs', () => {
  it('puts full scale at 0 dBFS and halving at about -6 dB', () => {
    expect(rmsToDbfs(1)).toBe(0);
    expect(Math.abs(rmsToDbfs(0.5) - -6.02)).toBeLessThanOrEqual(0.01);
  });

  it('is minus infinity for silence', () => {
    expect(rmsToDbfs(0)).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe('isSilent', () => {
  it('is true only when every sample is zero', () => {
    const frame = new Int16Array(320);
    expect(isSilent(frame)).toBe(true);

    frame[200] = 1;
    expect(isSilent(frame)).toBe(false);
  });
});
