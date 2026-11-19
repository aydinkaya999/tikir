import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../test/signal';
import { LevelMeter } from './levelMeter';

describe('LevelMeter', () => {
  it('reports one RMS value per full window: 20 a second at 16 kHz', () => {
    const meter = new LevelMeter(800);
    const levels: number[] = [];
    for (let chunk = 0; chunk < 125; chunk += 1) {
      levels.push(...meter.push(new Float32Array(128).fill(0.5)));
    }

    expect(levels).toHaveLength(20);
    levels.forEach((level) => {
      expect(level).toBeCloseTo(0.5, 6);
    });
  });

  it('waits for the window to fill', () => {
    const meter = new LevelMeter(800);

    expect(meter.push(new Float32Array(799).fill(0.5))).toEqual([]);
    expect(meter.push(new Float32Array(1).fill(0.5))).toHaveLength(1);
  });

  it('gives the same values however the input is chunked', () => {
    const random = seededRandom(12);
    const input = Float32Array.from({ length: 16_000 }, () => random() * 2 - 1);
    const sizes = seededRandom(13);

    const whole = new LevelMeter(800).push(input);
    const meter = new LevelMeter(800);
    const chunked: number[] = [];
    for (let offset = 0; offset < input.length;) {
      const size = 1 + Math.floor(sizes() * 500);
      chunked.push(...meter.push(input.subarray(offset, offset + size)));
      offset += size;
    }

    expect(chunked).toEqual(whole);
  });
});
