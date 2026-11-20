import { expect, test } from '@playwright/test';
import { enterAccountAndReader, heading, readTheMinute } from './support/onboarding';
import {
  getUserMediaCalls,
  openPaused,
  prepareSessionPage,
  storedRecords,
} from './support/session';

// Phase 3 criteria 1–4 (docs/planlar/faz-3.md, "Ölçütler ve kanıtları"): an empty device walks
// the setup to the road; the level check reads the typical measurement, the demo's first one.
test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

test('an empty device sets up the parent and the reader, measures the level and opens the first chapter', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await prepareSessionPage(page);
  await openPaused(page, '/?demo=bos');

  await enterAccountAndReader(page, { consent: true, grade: 3 });
  await readTheMinute(page);
  expect(await getUserMediaCalls(page)).toBeGreaterThan(0);

  // K4: the first measurement and the first goal.
  await expect(page.getByText('58', { exact: true })).toBeVisible();
  await expect(page.getByText('Doğruluk %91')).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'İlk hedef: 6 haftada 70' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'İlk bölüme başla' }).click();

  // G1, with the reader and the measurement stored.
  await expect(heading(page, 'Merhaba Deniz')).toBeVisible();
  const children = await storedRecords<{
    name: string;
    grade: number;
    readingStyle: { font: string };
  }>(page, 'child');
  expect(children).toMatchObject([{ name: 'Deniz', grade: 3, readingStyle: { font: 'clear' } }]);
  const assessments = await storedRecords<{ passageId: string; result: { wcpm: number } }>(
    page,
    'assessments',
  );
  expect(assessments.map(({ passageId, result }) => [passageId, result.wcpm])).toEqual([
    ['olcum-3a', 58],
  ]);
});

test('without the consent the setup skips the level check and never opens the microphone', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await prepareSessionPage(page);
  await openPaused(page, '/?demo=bos');

  await enterAccountAndReader(page, { consent: false, grade: 3 });

  // K4 without a measurement, and Tıkır does not say he listens.
  await expect(heading(page, 'Tıkır ile tanış')).toBeVisible();
  await expect(
    page.getByText('Merhaba Deniz! Her gün birlikte bir bölüm okuyacağız.').first(),
  ).toBeVisible();
  await expect(page.getByText('doğru kelime')).toHaveCount(0);
  await page.getByRole('button', { name: 'İlk bölüme başla' }).click();

  await expect(heading(page, 'Merhaba Deniz')).toBeVisible();
  expect(await storedRecords(page, 'assessments')).toEqual([]);
  expect(await getUserMediaCalls(page)).toBe(0);
});
