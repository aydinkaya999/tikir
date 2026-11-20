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
  sendTrackEvent,
  suspendAudioContexts,
  trackAudioContexts,
  trackStreams,
} from './support/media';
import { toneHz } from './support/tone';
import { watch } from './support/watch';

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
  expect(download.suggestedFilename()).toMatch(/^ses-denemesi-\d{8}-\d{6}\.wav$/);
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

  // Another page of the app; the showcase, since an empty store sends product pages to the setup.
  await navigateInApp(page, '/gelistirme/vitrin');

  await expect(page).toHaveURL(/\/gelistirme\/vitrin$/);
  await expect.poll(() => microphoneTracks(page)).toEqual({ total: 1, live: 0 });
});

test('a muted microphone is reported after a second', async ({ page }) => {
  await trackStreams(page);
  await openMicrophone(page);

  await sendTrackEvent(page, 'mute');

  await expect(fact(page, 'Durum')).toHaveText('Hata', { timeout: 1500 });
  await expect(page.getByText('Ayrıntı: TrackMuted:', { exact: false })).toBeVisible();
  await expect.poll(() => microphoneTracks(page)).toEqual({ total: 1, live: 0 });
});

test('a short mute is ignored', async ({ page }) => {
  await trackStreams(page);
  await openMicrophone(page);

  await sendTrackEvent(page, 'mute');
  await page.waitForTimeout(300);
  await sendTrackEvent(page, 'unmute');
  await page.waitForTimeout(2000);

  await expect(fact(page, 'Durum')).toHaveText('Açık');
  expect(await microphoneTracks(page)).toEqual({ total: 1, live: 1 });
});

test('a suspended audio context is reported', async ({ page }) => {
  await trackAudioContexts(page);
  await openMicrophone(page);

  await suspendAudioContexts(page);

  await expect(fact(page, 'Durum')).toHaveText('Hata');
  await expect(page.getByText('Ayrıntı: ContextSuspended:', { exact: false })).toBeVisible();
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

test('the echo test sends 500 frames and reports the round trip', async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const watcher = await watch(page, new URL(baseURL ?? '').origin);
  await openMicrophone(page);

  await page.getByRole('button', { name: 'Yankı testini başlat' }).click();

  await expect(fact(page, 'Gönderilen')).toHaveText('500', { timeout: 20_000 });
  await expect(fact(page, 'Dönen')).toHaveText('500');
  await expect(fact(page, 'Kayıp')).toHaveText('0');
  await expect(fact(page, 'Ortanca')).toHaveText(/^\d+,\d ms$/);
  await expect(fact(page, '95. yüzdelik')).toHaveText(/^\d+,\d ms$/);
  // The frames went to the page's own origin (/gelistirme/yanki), so the CSP stays as it is.
  expect(watcher.foreign).toEqual([]);
  expect(watcher.violations).toEqual([]);
});

test('an unreachable echo server is explained', async ({ page, baseURL }) => {
  await openMicrophone(page);
  const missing = new URL('/gelistirme/yok', baseURL);
  missing.protocol = 'ws:';

  await page.getByLabel('Yankı adresi').fill(missing.href);
  await page.getByRole('button', { name: 'Yankı testini başlat' }).click();

  await expect(page.getByText('Yankı sunucusuna ulaşılamadı', { exact: false })).toBeVisible({
    timeout: 8_000,
  });
  await expect(fact(page, 'Durum')).toHaveText('Açık'); // the page carries on
});

test('the device report is shown and downloads as JSON', async ({ page }) => {
  await openMicrophone(page);
  const shownReport = page.getByLabel('Rapor (JSON)');
  await expect
    .poll(async () => {
      const report = JSON.parse((await shownReport.textContent()) ?? '{}') as {
        capture?: { state?: string; framesDelivered?: number };
      };
      return report.capture?.state === 'capturing' && (report.capture.framesDelivered ?? 0) > 0;
    })
    .toBe(true);

  // Read the shown report and press the button in one go, so a refresh cannot come in between.
  const [download, shown] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(() => {
      const text = document.querySelector('pre')?.textContent ?? '';
      const button = [...document.querySelectorAll('button')].find(
        (candidate) => candidate.textContent === 'Raporu indir (JSON)',
      );
      button?.click();
      return text;
    }),
  ]);

  expect(download.suggestedFilename()).toMatch(/^ses-denemesi-\d{8}-\d{6}\.json$/);
  const report: unknown = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(report).toEqual(JSON.parse(shown));
  // The audio context runs at the output device's rate: 48 kHz on most machines, 16 kHz with a
  // Bluetooth headset in hands-free mode. The report must say whatever this browser uses.
  const contextRate = await page.evaluate(async () => {
    const context = new AudioContext();
    const rate = context.sampleRate;
    await context.close();
    return rate;
  });
  expect(report).toMatchObject({
    version: 1,
    capture: {
      state: 'capturing',
      inputSampleRate: contextRate,
      requested: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    },
    environment: {
      secureContext: true,
      shell: 'browser',
      browser: expect.stringMatching(/^(Chrome|Safari) \d+/) as unknown,
    },
    permission: expect.stringMatching(/^(granted|denied|prompt|unknown)$/),
  });
  expect(
    (report as { capture: { framesDelivered: number } }).capture.framesDelivered,
  ).toBeGreaterThan(0);
});

test('the page fits 390, 1180 and 1440 px with 44 px targets', async ({ page }) => {
  for (const width of [390, 1180, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(devPaths.audio);
    await expect(page.getByRole('heading', { name: 'Cihaz raporu' })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, `horizontal overflow at ${String(width)} px`).toBeLessThanOrEqual(0);
    const tooSmall = await page.evaluate(() =>
      [...document.querySelectorAll('button, input, a')]
        .map((element) => {
          const box = element.getBoundingClientRect();
          return { name: element.textContent, width: box.width, height: box.height };
        })
        .filter((target) => target.width < 44 || target.height < 44),
    );
    expect(tooSmall, `touch targets at ${String(width)} px`).toEqual([]);
  }
});
