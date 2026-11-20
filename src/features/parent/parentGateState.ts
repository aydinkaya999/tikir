// The parent gate's memory (docs/kararlar.md P11; docs/planlar/faz-3.md, kararlar 25–26): the wait
// after three wrong answers lasts in the tab, a reload included. The open gate itself lives only in
// the page (ParentGate's state), so leaving the area, a reload or a new tab asks again.
import { parentGateWaitMs } from '../../domain/config';
import {
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

/**
 * `&kapi=acik` (developer and e2e builds): the gate stays open in this tab, for screenshots and
 * tests. The check stays inline so production drops it.
 */
export function gateOpenedForDevelopment(): boolean {
  return (
    import.meta.env.MODE !== 'production' && readTabSetting(tabSettingKeys.parentGate) === 'acik'
  );
}
