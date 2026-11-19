// Watches a page for traffic to other origins and for CSP violations (CLAUDE.md; docs/kararlar.md
// T12, T15). Shared by the no-external-requests suite and the audio lab's echo test.
import type { Page } from '@playwright/test';

export interface Watch {
  foreign: string[];
  violations: string[];
}

/**
 * Records every request and WebSocket to another origin, and every CSP violation. Violations are
 * reported to the test as they happen, so loading the next page cannot wipe them.
 */
export async function watch(page: Page, origin: string): Promise<Watch> {
  const foreign: string[] = [];
  const violations: string[] = [];
  const home = new URL(origin);
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol !== 'data:' && url.protocol !== 'blob:' && url.origin !== origin) {
      foreign.push(request.url());
    }
  });
  // WebSockets do not show up as requests. ws:// and wss:// pair with http:// and https://.
  page.on('websocket', (socket) => {
    const url = new URL(socket.url());
    const sameScheme =
      (url.protocol === 'ws:' && home.protocol === 'http:') ||
      (url.protocol === 'wss:' && home.protocol === 'https:');
    if (!sameScheme || url.host !== home.host) {
      foreign.push(socket.url());
    }
  });
  await page.exposeFunction('reportCspViolation', (violation: string) => {
    violations.push(violation);
  });
  await page.addInitScript(() => {
    const report = (window as unknown as { reportCspViolation: (violation: string) => unknown })
      .reportCspViolation;
    document.addEventListener('securitypolicyviolation', (event) => {
      void report(`${event.violatedDirective} ${event.blockedURI} on ${location.pathname}`);
    });
  });
  return { foreign, violations };
}

/** Waits for the network to go quiet and the fonts to load. */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
