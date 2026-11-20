// Settings that last while the tab is open (sessionStorage): the developer pages' listener choice
// (docs/planlar/faz-2b.md, karar 7). A missing or refusing storage reads nothing and never throws.

export const tabSettingKeys = {
  /** A ready scenario's name, or 'elle' for the manual listener (docs/dinleme-hatti.md, section 3). */
  listener: 'tikir.gelistirme.dinleyici',
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
    // A blocked or full storage only loses a developer setting.
  }
}
