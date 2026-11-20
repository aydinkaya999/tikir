// Settings that last while the tab is open (sessionStorage): the parent gate's wait, and the
// developer parameters' listener choice and open gate (docs/planlar/faz-2b.md, karar 7; faz-3.md,
// kararlar 25–26). A missing or refusing storage reads nothing and never throws.

/** The parent gate waits until this time (ms since 1970) after three wrong answers. */
export const parentGateWaitKey = 'tikir.kapi.bekleme';

/** Developer settings: read only behind an inline MODE check, so production drops them. */
export const tabSettingKeys = {
  /** A ready scenario's name, or 'elle' for the manual listener (docs/dinleme-hatti.md, section 3). */
  listener: 'tikir.gelistirme.dinleyici',
  /** 'acik': the parent gate stays open in this tab (`&kapi=acik`). */
  parentGate: 'tikir.gelistirme.kapi',
} as const;

export function readTabSetting(key: string): string | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeTabSetting(key: string, value: string | null): void {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    if (value === null) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // A blocked or full storage only loses a developer setting, or the gate's wait.
  }
}
