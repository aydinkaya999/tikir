// The parent gate's memory (docs/kararlar.md P11; docs/planlar/faz-3.md, kararlar 25–26): the
// wrong answers and the wait after the third last in the tab, a reload or leaving the gate
// included. The open gate itself lives only in the page (ParentGate's state), so leaving the area,
// a reload or a new tab asks again.
import { parentGateAttempts, parentGateWaitMs } from '../../domain/config';
import {
  parentGateMissesKey,
  parentGateWaitKey,
  readTabSetting,
  tabSettingKeys,
  writeTabSetting,
} from '../../services/tabSettings';

/** Milliseconds the gate still waits; 0 when it does not. */
export function gateWaitLeft(now: number): number {
  const until = Number(readTabSetting(parentGateWaitKey));
  return Number.isFinite(until) && until > now ? until - now : 0;
}

export function startGateWait(now: number): void {
  writeTabSetting(parentGateWaitKey, String(now + parentGateWaitMs));
}

export function endGateWait(): void {
  writeTabSetting(parentGateWaitKey, null);
}

/** Wrong answers since the last wait or right answer. */
export function gateMisses(): number {
  const misses = Number(readTabSetting(parentGateMissesKey));
  return Number.isInteger(misses) && misses > 0 ? misses : 0;
}

/** A wrong answer; the third starts the wait and the count begins again. True: the gate waits. */
export function missGate(now: number): boolean {
  const misses = gateMisses() + 1;
  if (misses < parentGateAttempts) {
    writeTabSetting(parentGateMissesKey, String(misses));
    return false;
  }
  writeTabSetting(parentGateMissesKey, null);
  startGateWait(now);
  return true;
}

/** The right answer: the wrong answers are forgotten. */
export function passGate(): void {
  writeTabSetting(parentGateMissesKey, null);
}

/**
 * `&kapi=acik` (developer and e2e builds): the gate stays open in this tab, for screenshots and
 * tests. The check stays inline so production drops it.
 */
export function gateOpenedForDevelopment(): boolean {
  return (
    import.meta.env.MODE !== 'production' && readTabSetting(tabSettingKeys.parentGate) === 'acik'
  );
}
