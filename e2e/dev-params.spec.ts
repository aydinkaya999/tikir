import { expect, test } from '@playwright/test';
import { devPaths, screenPaths } from '../src/app/routes';

// Phase 2b (docs/planlar/faz-2b.md, Task 6): the developer address parameters set up the demo
// profile and today's session before the app starts, once, and leave the address.

test('the address sets up the demo profile and a session step, once', async ({ page }) => {
  await page.goto(`${devPaths.showcase}?demo=cocuk-sabahi&adim=read-2`);

  // The demo profile's 4 sessions and 4 cards, today's session and the first reading's 2 cards.
  const counts = page.getByText('Depoda 5 seans, 6 kelime kartı, 6 ölçüm var.');
  await expect(counts).toBeVisible();
  const address = new URL(page.url());
  expect(address.pathname).toBe(devPaths.showcase);
  expect(address.search).toBe('');

  await page.reload();
  await expect(counts).toBeVisible();
});

test('a product address with no profile sets up the demo child', async ({ page }) => {
  await page.goto(screenPaths.G1);
  // The app renders only once the profile is set up.
  await expect(page.locator('[data-shell="child"]')).toBeVisible();
  await page.goto(devPaths.showcase);

  await expect(page.getByText('Depoda 4 seans, 4 kelime kartı, 6 ölçüm var.')).toBeVisible();
});
