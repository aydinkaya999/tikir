import { describe, expect, it } from 'vitest';
import { gateQuestion, isGateAnswer } from './parentGate';

/** A repeatable source of numbers in [0, 1). */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

describe('gateQuestion', () => {
  it('adds two two-digit numbers with a carry in the ones and a sum under 100', () => {
    const random = seeded(7);
    for (let round = 0; round < 200; round += 1) {
      const { a, b } = gateQuestion(random);

      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(99);
      expect(b).toBeGreaterThanOrEqual(10);
      expect(b).toBeLessThanOrEqual(99);
      expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10);
      expect(a + b).toBeLessThan(100);
    }
  });

  it('gives the same question for the same numbers', () => {
    expect(gateQuestion(seeded(3))).toEqual(gateQuestion(seeded(3)));
  });
});

describe('isGateAnswer', () => {
  const question = { a: 47, b: 38 };

  it.each(['85', ' 85 '])('takes %j for 47 + 38', (answer) => {
    expect(isGateAnswer(question, answer)).toBe(true);
  });

  it.each(['84', '8 5', '', '85a', '085x'])('refuses %j', (answer) => {
    expect(isGateAnswer(question, answer)).toBe(false);
  });
});
