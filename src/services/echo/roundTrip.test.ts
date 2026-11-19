import { describe, expect, it } from 'vitest';
import { percentile, summarizeRoundTrips } from './roundTrip';

const oneToHundred = Array.from({ length: 100 }, (_, index) => index + 1);

describe('percentile', () => {
  it('takes the nearest rank', () => {
    expect(percentile(oneToHundred, 50)).toBe(50);
    expect(percentile(oneToHundred, 95)).toBe(95);
    expect(percentile(oneToHundred, 100)).toBe(100);
  });

  it('gives the only value of a single-value list for any percentile', () => {
    expect(percentile([12], 5)).toBe(12);
    expect(percentile([12], 95)).toBe(12);
  });
});

describe('summarizeRoundTrips', () => {
  it('summarizes what came back and counts the rest as lost', () => {
    expect(summarizeRoundTrips([40, 10, 30, 20], 5)).toEqual({
      sent: 5,
      received: 4,
      lost: 1,
      medianMs: 20,
      p95Ms: 40,
      minMs: 10,
      maxMs: 40,
    });
  });

  it('has no times when nothing came back', () => {
    expect(summarizeRoundTrips([], 7)).toEqual({
      sent: 7,
      received: 0,
      lost: 7,
      medianMs: null,
      p95Ms: null,
      minMs: null,
      maxMs: null,
    });
  });
});
