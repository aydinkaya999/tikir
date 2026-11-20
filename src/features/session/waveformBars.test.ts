import { describe, expect, it } from 'vitest';
import { waveformBars } from './waveformBars';

const levelCount = 64;

describe('waveformBars', () => {
  it.each([36, 26])('makes %i bars of 64 levels', (count) => {
    const levels = Array.from({ length: levelCount }, (_, index) => index / (levelCount - 1));

    expect(waveformBars(levels, count)).toHaveLength(count);
  });

  it.each([36, 26])(
    'puts every level in exactly one of %i bars, in order, at its group’s loudest',
    (count) => {
      let lastBar = 0;
      for (let spike = 0; spike < levelCount; spike += 1) {
        const levels = Array.from({ length: levelCount }, (_, index) =>
          index === spike ? 1 : 0.25,
        );

        const bars = waveformBars(levels, count);

        expect(bars.filter((bar) => bar === 1)).toHaveLength(1);
        expect(bars.filter((bar) => bar === 0.25)).toHaveLength(count - 1);
        const bar = bars.indexOf(1);
        expect(bar).toBeGreaterThanOrEqual(lastBar);
        lastBar = bar;
      }
      expect(lastBar).toBe(count - 1);
    },
  );

  it('keeps the first and the last level at the two ends', () => {
    const levels = Array.from({ length: levelCount }, (_, index) => index / (levelCount - 1));

    const bars = waveformBars(levels, 36);

    expect(bars[0]).toBeLessThan(0.05);
    expect(bars.at(-1)).toBe(1);
  });

  it('draws silence when the recording has no levels', () => {
    expect(waveformBars([], 26)).toEqual(Array.from({ length: 26 }, () => 0));
  });
});
