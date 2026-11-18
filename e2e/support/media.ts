// Microphone situations for the audio lab tests, set up before the page's own scripts run.
// getUserMedia is patched on MediaDevices.prototype: in WebKit the built page ends up with a
// different navigator.mediaDevices object than the one init scripts see (measured in phase 1).
import type { Page } from '@playwright/test';

interface MediaTestWindow {
  __getUserMediaCalls: number;
  __tikirStreams: MediaStream[];
}

/** getUserMedia rejects with a DOMException of this name; calls are counted. */
export async function refuseMicrophone(page: Page, errorName: string): Promise<void> {
  await page.addInitScript((name) => {
    const test = window as unknown as MediaTestWindow;
    test.__getUserMediaCalls = 0;
    MediaDevices.prototype.getUserMedia = () => {
      test.__getUserMediaCalls += 1;
      return Promise.reject(new DOMException('Refused by the test', name));
    };
  }, errorName);
}

export async function getUserMediaCalls(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as MediaTestWindow).__getUserMediaCalls);
}

/** No navigator.mediaDevices, as on a page served over plain http to another device. */
export async function removeMediaDevices(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
  });
}

/** Keeps every stream getUserMedia hands out, so a test can see whether its tracks stopped. */
export async function trackStreams(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const test = window as unknown as MediaTestWindow;
    test.__tikirStreams = [];
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called below with .call(this)
    const original = MediaDevices.prototype.getUserMedia;
    MediaDevices.prototype.getUserMedia = async function (
      this: MediaDevices,
      constraints?: MediaStreamConstraints,
    ) {
      const stream = await original.call(this, constraints);
      test.__tikirStreams.push(stream);
      return stream;
    };
  });
}

export async function microphoneTracks(page: Page): Promise<{ total: number; live: number }> {
  return page.evaluate(() => {
    const tracks = (window as unknown as MediaTestWindow).__tikirStreams.flatMap((stream) =>
      stream.getTracks(),
    );
    return {
      total: tracks.length,
      live: tracks.filter((track) => track.readyState === 'live').length,
    };
  });
}

/** What the browser does when the tab goes to the background. */
export async function hideTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/** Client-side navigation, so the page unmounts without the document unloading. */
export async function navigateInApp(page: Page, path: string): Promise<void> {
  await page.evaluate((to) => {
    history.pushState({}, '', to);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}
