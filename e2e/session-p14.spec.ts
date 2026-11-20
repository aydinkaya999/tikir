import { expect, type Page, test } from '@playwright/test';
import { refuseMicrophone } from './support/media';
import { openPaused, prepareSessionPage, runUntilVisible, storedRecords } from './support/session';

// Phase 3 criterion 9 (docs/planlar/faz-3.md, "Ölçütler ve kanıtları"; docs/kararlar.md P14): with
// the parent's consent but no usable microphone, the child still finishes the day, unheard.
test.use({ timezoneId: 'Europe/Istanbul' });

function heading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name, exact: true });
}

test('a refused microphone lets the child read on unheard to the end of the day', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await prepareSessionPage(page);
  await refuseMicrophone(page, 'NotAllowedError');
  await openPaused(page, '/?demo=cocuk-sabahi');
  await page.getByRole('button', { name: 'Başla', exact: true }).click();

  // G2: the microphone is refused; only after a retry that does not help comes the way on.
  await expect(heading(page, 'Isınma')).toBeVisible();
  await expect(page.getByText(/^Seni duyamıyorum, mikrofon izni kapalı\./)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bugün dinlemeden oku' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Yeniden dene' }).click();
  await page.getByRole('button', { name: 'Bugün dinlemeden oku' }).click();

  // The rest of the day unheard: the cards, the narration, three readings.
  for (let card = 0; card < 2; card += 1) {
    await page.getByRole('button', { name: 'Sıradaki kelime' }).click();
  }
  await page.getByRole('button', { name: 'Dinle adımına geç' }).click();
  await expect(heading(page, 'Dinle')).toBeVisible();
  const turn = page.getByRole('button', { name: 'Sıra sende' });
  await runUntilVisible(page, turn.and(page.locator(':enabled')), { limitMs: 120_000 });
  await turn.click();
  await expect(heading(page, 'Oku')).toBeVisible();
  for (const next of ['2. okuma / 3', '3. okuma / 3']) {
    await page.getByRole('button', { name: 'Okumayı bitir' }).click();
    await expect(page.getByText(next)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Okumayı bitir' }).click();

  // G6, then G7 without a pace, and the day done on the road.
  await expect(heading(page, 'Kapanış')).toBeVisible();
  await page.getByRole('radio', { name: 'Tepenin ardında' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();
  await expect(page.getByText('Soru 2 / 2')).toBeVisible();
  await page.getByRole('radio', { name: 'Fener yakın olduğu için' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();
  await expect(heading(page, 'Bugünlük bitti')).toBeVisible();
  await expect(page.getByText('71', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Kapat' }).click();
  await expect(page.getByText('Bugünlük bitti').first()).toBeVisible();

  const sessions = await storedRecords<{ date: string; step: string; unheard?: boolean }>(
    page,
    'sessions',
  );
  expect(sessions.find((session) => session.date === '2026-11-21')).toMatchObject({
    step: 'done',
    unheard: true,
  });
});
