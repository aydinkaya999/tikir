import { describe, expect, it } from 'vitest';
import { formatClock } from './format';

describe('formatClock', () => {
  it('writes minutes and seconds, the seconds rounded down', () => {
    const table: [number, string][] = [
      [0, '0:00'],
      [19_190, '0:19'],
      [47_000, '0:47'],
      [83_662, '1:23'],
      [600_000, '10:00'],
      // An estimate a hair under a whole second is that second (47.0 s summed in floating point).
      [46_999.999_999, '0:47'],
    ];
    for (const [ms, expected] of table) {
      expect(formatClock(ms)).toBe(expected);
    }
  });
});
