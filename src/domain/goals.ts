// The goal line on V1 (docs/urun.md section 2, "Hedef çizgisi").
import { goalGainPerWeek, goalWeeks, nextGoalStep } from './config';

/** 58 → 70: two words a week for six weeks. */
export function firstTarget(baselineWcpm: number): number {
  return baselineWcpm + goalGainPerWeek * goalWeeks;
}

/** 70 → 78. */
export function nextTarget(target: number): number {
  return target + nextGoalStep;
}

export type WeeklyGoalStatus =
  { passed: true; nextTarget: number } | { passed: false; target: number };

/** Reaching the target exactly counts as passing it (docs/planlar/faz-2a.md, karar 17). */
export function weeklyGoalStatus(wcpm: number, target: number): WeeklyGoalStatus {
  return wcpm >= target
    ? { passed: true, nextTarget: nextTarget(target) }
    : { passed: false, target };
}
