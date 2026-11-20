import { expect, test } from '@playwright/test';
import { switchTrialOff, openTomorrow, readUntil } from './support/measurement';
import { heading } from './support/onboarding';
import { openPaused, prepareSessionPage, storedRecords } from './support/session';

// Phase 4 criteria 4 and 5 (docs/planlar/faz-4.md, "Ölçütler ve kanıtları"): the weekly
// measurement stores its readings as measurements, V3 shows the new one, and a trial week reads
// both styles for V4.
test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

interface StoredAssessment {
  date: string;
  passageId: string;
  trial?: boolean;
  result: { readingStyle: { spacingStep: number }; recordingId?: string };
}

async function measuredOn(page: Parameters<typeof storedRecords>[0], date: string) {
  return (await storedRecords<StoredAssessment>(page, 'assessments')).filter(
    (assessment) => assessment.date === date,
  );
}

test('a trial week reads both styles and reaches V3', async ({ page }) => {
  test.setTimeout(240_000);
  await prepareSessionPage(page);
  await openPaused(page, '/?demo=cocuk-sabahi');
  await expect(page.getByRole('button', { name: 'Ölçüme başla' })).toHaveCount(0);

  await openTomorrow(page);
  await page.getByRole('button', { name: 'Ölçüme başla' }).click();
  await expect(heading(page, '1 dakikalık ölçüm')).toBeVisible();
  await expect(page.getByText('1. okuma / 2')).toBeVisible();
  await readUntil(page, page.getByText('2. okuma / 2'));

  await page.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }).click();
  await readUntil(page, heading(page, 'Merhaba Deniz'));
  await expect(page.getByRole('button', { name: 'Ölçüme başla' })).toHaveCount(0);

  const stored = await measuredOn(page, '2026-11-22');
  expect(stored.map((each) => [each.trial === true, each.result.readingStyle.spacingStep])).toEqual(
    expect.arrayContaining([
      [true, 1],
      [false, 0],
    ]),
  );
  expect(stored.every((each) => each.result.recordingId !== undefined)).toBe(true);

  await openPaused(page, '/veli/olcum?kapi=acik');
  await expect(page.getByText('22 Kasım Pazar', { exact: true })).toBeVisible();
  await expect(page.getByText('Sıradaki ölçüm 29 Kasım Pazar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kaydı dinle' })).toBeVisible();

  await openPaused(page, '/veli/yazi?kapi=acik');
  await expect(page.getByText(/2 ölçümün ortalaması/)).toBeVisible();
});

test('with the trial off the measurement is one reading', async ({ page }) => {
  test.setTimeout(180_000);
  await prepareSessionPage(page);
  await switchTrialOff(page);
  await openPaused(page, '/');

  await openTomorrow(page);
  await page.getByRole('button', { name: 'Ölçüme başla' }).click();
  await expect(heading(page, '1 dakikalık ölçüm')).toBeVisible();
  await expect(page.getByText(/okuma \/ 2/)).toHaveCount(0);
  await readUntil(page, heading(page, 'Merhaba Deniz'));

  const stored = await measuredOn(page, '2026-11-22');
  expect(stored).toHaveLength(1);
  expect(stored[0]?.trial).toBeUndefined();
});
