import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { devPaths } from '../src/app/routes';
import { rms, toFloat32 } from '../src/services/audio/pcm';
import { parseWav, type WavData } from '../src/services/audio/wav';
import { peakFrequency } from '../src/test/signal';
import {
  getUserMediaCalls,
  hideTab,
  microphoneTracks,
  navigateInApp,
  refuseMicrophone,
  removeMediaDevices,
  trackStreams,
} from './support/media';
import { toneHz } from './support/tone';

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

/** Default processing damps a steady tone (docs/kararlar.md, T18); signal checks go without it. */
async function switchOffProcessing(page: Page): Promise<void> {
  for (const name of ['Yankı giderme', 'Gürültü bastırma', 'Otomatik kazanç']) {
    await page.getByRole('switch', { name }).click();
    await expect(page.getByRole('switch', { name })).toHaveAttribute('aria-checked', 'false');
  }
}

async function downloadWav(page: Page): Promise<WavData> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Kaydı indir (WAV)' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^ses-denemesi-\d{8}-\d{4}\.wav$/);
  const bytes = await readFile(await download.path());
  return parseWav(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
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

test('ten seconds are recorded as 16 kHz WAV and played back', async ({ page, browserName }) => {
  test.setTimeout(60_000);
  await page.goto(devPaths.audio);
  await switchOffProcessing(page);
  await page.getByRole('button', { name: 'Mikrofonu aç' }).click();
  await expect(fact(page, 'Durum')).toHaveText('Açık');

  await page.getByRole('button', { name: '10 saniye kaydet' }).click();
  await expect(page.getByText('Kayıt hazır: 10,0 sn')).toBeVisible({ timeout: 15_000 });

  const wav = await downloadWav(page);
  expect(wav).toMatchObject({ sampleRate: 16_000, channels: 1, bitsPerSample: 16 });
  expect(wav.samples).toHaveLength(160_000);
  const steady = toFloat32(wav.samples.subarray(3_200)); // after the first 0.2 s
  if (browserName === 'chromium') {
    // The fake microphone's 440 Hz survived capture, resampling and framing. A wrong input rate
    // would move it to 404 or 479 Hz. (Spectral peak: zero crossings over-count, see signal.ts.)
    const peak = peakFrequency(steady, 16_000, { from: 380, to: 500, step: 0.25 });
    expect(Math.abs(peak - toneHz)).toBeLessThanOrEqual(4);
    expect(rms(steady)).toBeGreaterThan(0.1);
  } else {
    expect(rms(steady)).toBeGreaterThan(0.01);
  }

  await page.getByRole('button', { name: 'Kaydı çal' }).click();
  await expect(fact(page, 'Durum')).toHaveText('Kapalı'); // playback closes the microphone first
  await expect(page.getByText('Çalıyor')).toBeVisible();
  await page.getByRole('button', { name: 'Çalmayı durdur' }).click();
  await expect(page.getByText('Kayıt hazır: 10,0 sn')).toBeVisible();
});

test('a recording cut short by hiding the tab keeps what it has', async ({ page }) => {
  await openMicrophone(page);
  await page.getByRole('button', { name: '10 saniye kaydet' }).click();
  await expect(page.getByText(/^Kaydediliyor: [1-9]/)).toBeVisible();

  await hideTab(page);

  await expect(page.getByText(/^Kayıt yarıda kaldı: \d+,\d sn$/)).toBeVisible();
  const wav = await downloadWav(page);
  expect(wav.samples.length).toBeGreaterThan(0);
  expect(wav.samples.length).toBeLessThan(160_000);
  expect(wav.samples.length % 320).toBe(0);
});
