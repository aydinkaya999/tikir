import { expect, test } from '@playwright/test';
import { openTomorrow, readUntil, switchTrialOff } from './support/measurement';
import { heading } from './support/onboarding';
import { openPaused, prepareSessionPage, storedKeys, storedRecords } from './support/session';

// Phase 4 criterion 6 (docs/planlar/faz-4.md, "Ölçütler ve kanıtları"): a recording the parent
// deletes leaves the device; deleting the account leaves nothing behind.
test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

test('a deleted recording leaves the device', async ({ page }) => {
  test.setTimeout(180_000);
  await prepareSessionPage(page);
  await switchTrialOff(page);
  await openPaused(page, '/');
  await openTomorrow(page);
  await page.getByRole('button', { name: 'Ölçüme başla' }).click();
  await readUntil(page, heading(page, 'Merhaba Deniz'));
  const [recording] = await storedKeys(page, 'recordings');
  expect(recording).toBeDefined();

  await openPaused(page, '/veli/hesap?kapi=acik');
  const list = page.getByRole('list', { name: 'Kayıtlar' });
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list.getByRole('listitem')).toContainText('1 dakikalık ölçüm, 22 Kasım');
  await list.getByRole('button', { name: 'Sil' }).click();
  await page
    .getByRole('dialog', { name: 'Kayıt silinsin mi?' })
    .getByRole('button', { name: 'Sil' })
    .click();

  await expect(page.getByText('Henüz kayıt yok.')).toBeVisible();
  expect(await storedKeys(page, 'recordings')).toEqual([]);
  const measured = await storedRecords<{ date: string; result: { recordingId?: string } }>(
    page,
    'assessments',
  );
  expect(measured.find((each) => each.date === '2026-11-22')?.result.recordingId).toBeUndefined();
});

test('deleting the account empties the device and opens the setup', async ({ page }) => {
  await prepareSessionPage(page);
  await openPaused(page, '/veli/hesap?demo=cocuk-sabahi&kapi=acik');
  await expect(heading(page, 'Hesap')).toBeVisible();

  await page.getByRole('button', { name: 'Hesabı sil' }).click();
  await page
    .getByRole('dialog', { name: 'Hesap silinsin mi?' })
    .getByRole('button', { name: 'Hesabı sil' })
    .click();

  await expect(heading(page, 'Veli hesabı')).toBeVisible();
  for (const store of ['parent', 'child', 'sessions', 'stuckWords', 'assessments'] as const) {
    expect(await storedRecords(page, store)).toEqual([]);
  }
});
