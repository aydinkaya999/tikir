import { expect, test, type Locator, type Page } from '@playwright/test';
import { devPaths } from '../src/app/routes';
import {
  getUserMediaCalls,
  hideTab,
  microphoneTracks,
  navigateInApp,
  refuseMicrophone,
  removeMediaDevices,
  trackStreams,
} from './support/media';

// Phase 1 (docs/yol-haritasi.md): the /gelistirme/ses page end to end. Chromium's fake microphone
// plays a 440 Hz tone (e2e/support/tone.ts); WebKit's mock device plays its own tone once the
// microphone permission is granted.
test.use({ permissions: ['microphone'] });

/** The value of a row in one of the page's definition lists. */
function fact(page: Page, term: string): Locator {
  return page.locator(`div:has(> dt:text-is("${term}")) > dd`);
}

async function openMicrophone(page: Page): Promise<void> {
  await page.goto(devPaths.audio);
  await page.getByRole('button', { name: 'Mikrofonu aç' }).click();
  await expect(fact(page, 'Durum')).toHaveText('Açık');
}

test('the microphone opens and the level meter follows the sound', async ({ page }) => {
  await openMicrophone(page);

  // Default processing damps a steady test tone; the lowest level measured was 0.53.
  await expect
    .poll(
      async () =>
        Number(await page.getByRole('meter', { name: 'Ses düzeyi' }).getAttribute('aria-valuenow')),
      { timeout: 3000 },
    )
    .toBeGreaterThan(0.2);
});

test('a refused permission is explained and can be retried', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await refuseMicrophone(page, 'NotAllowedError');
  await page.goto(devPaths.audio);

  await page.getByRole('button', { name: 'Mikrofonu aç' }).click();

  await expect(fact(page, 'Durum')).toHaveText('İzin yok');
  await expect(page.getByText('Mikrofon izni reddedildi', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Yeniden dene' }).click();
  await expect.poll(() => getUserMediaCalls(page)).toBe(2);
  expect(errors).toEqual([]);
});

test('a missing microphone is explained', async ({ page }) => {
  await refuseMicrophone(page, 'NotFoundError');
  await page.goto(devPaths.audio);

  await page.getByRole('button', { name: 'Mikrofonu aç' }).click();

  await expect(fact(page, 'Durum')).toHaveText('Kullanılamıyor');
  await expect(page.getByText('Bu cihazda mikrofon bulunamadı', { exact: false })).toBeVisible();
});

test('an insecure page is explained', async ({ page }) => {
  await removeMediaDevices(page);
  await page.goto(devPaths.audio);

  await page.getByRole('button', { name: 'Mikrofonu aç' }).click();

  await expect(fact(page, 'Durum')).toHaveText('Kullanılamıyor');
  await expect(
    page.getByText('Sayfa güvenli bağlantıyla açılmadığı için', { exact: false }),
  ).toBeVisible();
});

test('the microphone is released when the tab is hidden', async ({ page }) => {
  await trackStreams(page);
  await openMicrophone(page);
  await expect.poll(() => microphoneTracks(page)).toEqual({ total: 1, live: 1 });

  await hideTab(page);

  await expect(fact(page, 'Durum')).toHaveText('Kapalı');
  await expect.poll(() => microphoneTracks(page)).toEqual({ total: 1, live: 0 });
});

test('the microphone is released when leaving the page', async ({ page }) => {
  await trackStreams(page);
  await openMicrophone(page);
  await expect.poll(() => microphoneTracks(page)).toEqual({ total: 1, live: 1 });

  await navigateInApp(page, '/');

  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => microphoneTracks(page)).toEqual({ total: 1, live: 0 });
});
