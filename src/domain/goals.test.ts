import { describe, expect, it } from 'vitest';
import { firstTarget, nextTarget, weeklyGoalStatus } from './goals';

describe('goal line', () => {
  it('sets the first target six weeks of two words a week above the baseline', () => {
    expect(firstTarget(58)).toBe(70);
  });

  it('raises a reached target by eight', () => {
    expect(nextTarget(70)).toBe(78);
  });
});

describe('weeklyGoalStatus', () => {
  it('passes at or above the target and names the next one', () => {
    expect(weeklyGoalStatus(71, 70)).toEqual({ passed: true, nextTarget: 78 });
    expect(weeklyGoalStatus(70, 70)).toEqual({ passed: true, nextTarget: 78 });
  });

  it('keeps the target below it', () => {
    expect(weeklyGoalStatus(69, 70)).toEqual({ passed: false, target: 70 });
  });
});
