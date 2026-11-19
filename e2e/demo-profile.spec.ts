import { expect, test } from '@playwright/test';
import { devPaths } from '../src/app/routes';

// Phase 2a (docs/planlar/faz-2a.md, Task 12): the showcase sets up the demo profile, and the data
// is still there after a reload (IndexedDB).
test('the demo profile is set up from the showcase and kept across a reload', async ({ page }) => {
  await page.goto(devPaths.showcase);
  await expect(page.getByText('Depo boş.')).toBeVisible();

  await page.getByRole('button', { name: 'Çocuk sabahı (G1–G7)' }).click();

  await expect(page.getByText('Kuruldu: Çocuk sabahı (G1–G7).')).toBeVisible();
  await expect(page.getByText('Depoda 4 seans, 4 kelime kartı, 6 ölçüm var.')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Depoda 4 seans, 4 kelime kartı, 6 ölçüm var.')).toBeVisible();

  await page.getByRole('button', { name: 'Veli hafta sonu (V1–V4)' }).click();
  await expect(page.getByText('Depoda 5 seans, 4 kelime kartı, 8 ölçüm var.')).toBeVisible();
});
