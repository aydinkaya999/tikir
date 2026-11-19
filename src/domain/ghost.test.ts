import { describe, expect, it } from 'vitest';
import { testReading, testSession } from '../test/sessions';
import { ghostIndex, ghostPace, previousReading, raceLead } from './ghost';

describe('ghostIndex', () => {
  it('moves the ghost at the pace of the earlier reading, rounding down', () => {
    expect(ghostIndex(40, 19185, 99)).toBe(12);
    expect(ghostIndex(40, 18000, 99)).toBe(12);
    expect(ghostIndex(40, 17999, 99)).toBe(11);
  });

  it('stops the ghost at the end of the text', () => {
    expect(ghostIndex(40, 600000, 99)).toBe(99);
    expect(ghostIndex(40, -1000, 99)).toBe(0);
  });
});

describe('raceLead', () => {
  it('gives the lead only when the child is ahead', () => {
    expect(raceLead(14, 12)).toBe(2);
    expect(raceLead(12, 12)).toBeNull();
    expect(raceLead(10, 12)).toBeNull();
    expect(raceLead(5, null)).toBeNull();
  });
});

describe('previousReading', () => {
  const sessions = [
    testSession('2026-11-19', 2, {
      readings: [testReading(1), testReading(2), testReading(3, { wcpm: 65 })],
    }),
    testSession('2026-11-20', 3, {
      readings: [testReading(1), testReading(2, { wcpm: 64 })],
      step: 'record',
      completedAt: undefined,
    }),
    testSession('2026-11-21', 4, { readings: [testReading(1, { wcpm: 99 })] }),
  ];

  it('takes the latest earlier session that has the same reading', () => {
    expect(previousReading(sessions, '2026-11-21', 3)?.wcpm).toBe(65);
    expect(previousReading(sessions, '2026-11-21', 2)?.wcpm).toBe(64);
  });

  it("never takes today's session, and gives null without an earlier one", () => {
    expect(previousReading(sessions, '2026-11-21', 1)?.wcpm).not.toBe(99);
    expect(previousReading([], '2026-11-21', 1)).toBeNull();
    expect(previousReading(sessions.slice(2), '2026-11-21', 1)).toBeNull();
  });
});

describe('ghostPace', () => {
  it('is the words attempted per minute of the earlier reading', () => {
    expect(ghostPace(testReading(1, { wordsAttempted: 98, seconds: 90 }))).toBeCloseTo(65.333, 3);
    expect(ghostPace(testReading(1, { seconds: 0 }))).toBeNull();
    expect(ghostPace(null)).toBeNull();
  });
});
