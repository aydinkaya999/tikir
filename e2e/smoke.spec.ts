import { expect, test } from '@playwright/test';

test('the home page is Turkish and has a main landmark', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.getByRole('main')).toBeAttached();
});
