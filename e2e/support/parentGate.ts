import { expect, type Page } from '@playwright/test';

/**
 * Passes the parent gate as a parent does (docs/kararlar.md P11): reads the question on the screen
 * and types the sum. Every page load asks again, so a test that opens a parent address passes it.
 */
export async function passParentGate(page: Page): Promise<void> {
  const question = page.getByText(/^\d+ \+ \d+ = \?$/);
  await expect(question).toBeVisible();
  const [a = 0, b = 0] = ((await question.textContent()) ?? '').match(/\d+/g)?.map(Number) ?? [];
  await page.getByLabel('Cevap').fill(String(a + b));
  await page.getByRole('button', { name: 'Gir' }).click();
  await expect(page.locator('[data-shell="parent"]')).toBeVisible();
}
