import { expect, test } from '@playwright/test';
import { devPaths } from '../src/app/routes';
import { storedRecords } from './support/session';

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

test('?kurulum=seviye prepares the reader at the level check', async ({ page }) => {
  await page.goto(`${devPaths.showcase}?kurulum=seviye`);

  await expect
    .poll(() => storedRecords<{ name: string; grade: number }>(page, 'child'))
    .toEqual([expect.objectContaining({ name: 'Deniz', grade: 3 })]);
  expect(await storedRecords<{ setup?: string }>(page, 'parent')).toEqual([
    expect.objectContaining({ setup: 'level' }),
  ]);
  expect(new URL(page.url()).search).toBe('');
});
