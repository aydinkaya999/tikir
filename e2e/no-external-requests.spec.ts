import { expect, test } from '@playwright/test';
import { devPaths, extraPaths, screenPaths } from '../src/app/routes';
import {
  openPaused,
  prepareSessionPage,
  runUntilVisible,
  waitForListening,
} from './support/session';
import { settle, watch } from './support/watch';

// Phase 0 acceptance criterion 6: while pages load and while you move around, no request leaves
// the app's own origin (CLAUDE.md; docs/kararlar.md T12). The build's CSP must not be violated.

const allPaths = [
  ...Object.values(screenPaths).map((path) => path.replace(':bookId', 'ornek')),
  ...Object.values(extraPaths),
  ...Object.values(devPaths),
];

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
    await page.goto('/seans/oku?demo=cocuk-sabahi&adim=read-1');
    await page.getByRole('button', { name: 'Seanstan çık' }).filter({ visible: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Çık' }).click();
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

test.describe('a reading', () => {
  test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

  // Phase 2b (docs/planlar/faz-2b.md, Task 17): a whole reading with the microphone open.
  test('a reading with the microphone open asks nothing from another origin', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const origin = new URL(baseURL ?? '').origin;
    const watcher = await watch(page, origin);
    await prepareSessionPage(page);
    await openPaused(page, '/seans/oku?demo=cocuk-sabahi&adim=read-1');

    await page.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }).click();
    await waitForListening(page);
    await runUntilVisible(page, page.getByText('2. okuma / 3'));

    expect(watcher.foreign).toEqual([]);
    expect(watcher.violations).toEqual([]);
  });
});
