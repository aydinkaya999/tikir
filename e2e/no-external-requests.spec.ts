import { expect, test, type Page } from '@playwright/test';
import { devPaths, extraPaths, screenPaths } from '../src/app/routes';

// Phase 0 acceptance criterion 6: while pages load and while you move around, no request leaves
// the app's own origin (CLAUDE.md; docs/kararlar.md T12). The build's CSP must not be violated.

const allPaths = [
  ...Object.values(screenPaths).map((path) => path.replace(':bookId', 'ornek')),
  ...Object.values(extraPaths),
  ...Object.values(devPaths),
];

interface Watch {
  foreign: string[];
  violations: string[];
}

/**
 * Records every request to another origin and every CSP violation. Violations are reported to
 * the test as they happen, so loading the next page cannot wipe them.
 */
async function watch(page: Page, origin: string): Promise<Watch> {
  const foreign: string[] = [];
  const violations: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol !== 'data:' && url.protocol !== 'blob:' && url.origin !== origin) {
      foreign.push(request.url());
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

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test('loading every route asks nothing from another origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? '').origin;
  const watcher = await watch(page, origin);

  for (const path of allPaths) {
    await page.goto(path);
    await settle(page);
  }

  expect(watcher.foreign).toEqual([]);
  expect(watcher.violations).toEqual([]);
});

for (const viewport of [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'web', width: 1440, height: 900 },
] as const) {
  test(`moving through every shell asks nothing from another origin (${viewport.name})`, async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL ?? '').origin;
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const watcher = await watch(page, origin);

    // Child and parent navigation: every item, client-side.
    for (const [start, navName] of [
      ['/', 'Ana gezinme'],
      ['/veli', 'Veli gezinmesi'],
    ] as const) {
      await page.goto(start);
      await settle(page);
      const links = page.getByRole('navigation', { name: navName }).getByRole('link');
      const count = await links.count();
      expect(count).toBeGreaterThan(3);
      for (let index = 0; index < count; index += 1) {
        await links.nth(index).click();
        await settle(page);
      }
    }

    // Leaving the session, going back from the focus shell.
    await page.goto('/seans/oku');
    await page.getByRole('link', { name: 'Seanstan çık' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/kitaplik/kur');
    await page.getByRole('link', { name: 'Geri dön' }).click();
    await expect(page).toHaveURL(/\/kitaplik$/);
    await settle(page);

    expect(watcher.foreign).toEqual([]);
    expect(watcher.violations).toEqual([]);
  });
}

test('the build carries a content security policy that starts from self', async ({ page }) => {
  await page.goto('/');
  const policy = page.locator('meta[http-equiv="Content-Security-Policy"]');

  await expect(policy).toHaveAttribute('content', /default-src 'self'/);
  await expect(policy).toHaveAttribute('content', /object-src 'none'/);
});
