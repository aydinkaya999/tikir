// The daily session end to end (docs/planlar/faz-2b.md, Task 17): the page has no speech synthesis,
// so Tıkır's narration is timed silently by the clock (karar 7); the clock is installed at a fixed
// day and paused once the page has loaded, and only the test moves it.
import { expect, type Locator, type Page } from '@playwright/test';

/** The session's day, morning in Istanbul (the tests run in that time zone). */
export const sessionDay = new Date('2026-11-21T06:00:00.000Z');

export const dayMs = 24 * 60 * 60 * 1000;

interface SessionTestWindow {
  __getUserMediaCalls: number;
}

/** Call before the first address: no speech synthesis, getUserMedia counted, the clock installed. */
export async function prepareSessionPage(page: Page, time: Date = sessionDay): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
    const test = window as unknown as SessionTestWindow;
    test.__getUserMediaCalls = 0;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called below with .call(this)
    const original = MediaDevices.prototype.getUserMedia;
    MediaDevices.prototype.getUserMedia = function (
      this: MediaDevices,
      constraints?: MediaStreamConstraints,
    ) {
      test.__getUserMediaCalls += 1;
      return original.call(this, constraints);
    };
  });
  await page.clock.install({ time });
}

/** Pauses the clock where it is; from then on only runFor and the tests move it. */
export async function pauseClock(page: Page): Promise<void> {
  // A second ahead: the clock runs on while the page answers, and pauseAt cannot go back.
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1000);
}

/**
 * Waits, in real time, until the microphone listens. Run the clock only then: the capture gives a
 * just-opened track a grace time on the clock before it counts it as muted, and a clock run in
 * big steps would end that grace before the track's first sound.
 */
export async function waitForListening(page: Page): Promise<void> {
  await expect(
    page.getByRole('button', { name: 'Dinliyor. Duraklatmak için dokun' }),
  ).toBeVisible();
}

/** Opens an address and pauses the clock once the page has loaded. */
export async function openPaused(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'networkidle' });
  await pauseClock(page);
}

/** Reloads the page; the clock stays where it was. */
export async function reloadPaused(page: Page): Promise<void> {
  await page.reload({ waitUntil: 'networkidle' });
  await pauseClock(page);
}

export async function getUserMediaCalls(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as SessionTestWindow).__getUserMediaCalls);
}

type StoreName = 'sessions' | 'stuckWords' | 'recordings' | 'parent' | 'child' | 'assessments';

/** Every record of a store of the app's database. */
export async function storedRecords<T>(page: Page, store: Exclude<StoreName, 'recordings'>) {
  return page.evaluate(
    (name) =>
      new Promise<T[]>((resolve, reject) => {
        const request = indexedDB.open('tikir');
        request.onerror = () => {
          reject(request.error ?? new Error('The database did not open.'));
        };
        request.onsuccess = () => {
          const database = request.result;
          const all = database.transaction(name).objectStore(name).getAll();
          all.onerror = () => {
            reject(all.error ?? new Error('The store was not read.'));
          };
          all.onsuccess = () => {
            resolve(all.result as T[]);
            database.close();
          };
        };
      }),
    store,
  );
}

/** The keys of a store: the recordings' WAV files stay in the page. */
export async function storedKeys(page: Page, store: StoreName): Promise<string[]> {
  return page.evaluate(
    (name) =>
      new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open('tikir');
        request.onerror = () => {
          reject(request.error ?? new Error('The database did not open.'));
        };
        request.onsuccess = () => {
          const database = request.result;
          const keys = database.transaction(name).objectStore(name).getAllKeys();
          keys.onerror = () => {
            reject(keys.error ?? new Error('The store was not read.'));
          };
          keys.onsuccess = () => {
            resolve(keys.result.map(String));
            database.close();
          };
        };
      }),
    store,
  );
}

/**
 * Moves the clock a step at a time until the locator shows: the app's next step waits on its
 * database writes, which take real time, not the clock's.
 */
export async function runUntilVisible(
  page: Page,
  locator: Locator,
  { stepMs = 1000, limitMs = 180_000 }: { stepMs?: number; limitMs?: number } = {},
): Promise<void> {
  for (let elapsed = 0; elapsed < limitMs; elapsed += stepMs) {
    if (await locator.isVisible()) {
      return;
    }
    await page.clock.runFor(stepMs);
  }
  await expect(locator).toBeVisible({ timeout: 1000 });
}
