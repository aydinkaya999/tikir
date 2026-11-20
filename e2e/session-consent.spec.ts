import { expect, type Page, test } from '@playwright/test';
import {
  getUserMediaCalls,
  openPaused,
  prepareSessionPage,
  runUntilVisible,
} from './support/session';

// Phase 2 criterion 8 (docs/planlar/faz-2b.md, "Ölçütler ve kanıtları"; docs/kararlar.md P13):
// without the parent's consent the session runs unheard and the microphone is never asked for.
test.use({ timezoneId: 'Europe/Istanbul' });

function heading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name, exact: true });
}

test('without the parent’s consent the session runs unheard and never opens the microphone', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await prepareSessionPage(page);
  await openPaused(page, '/?demo=cocuk-sabahi&onay=kapali');
  await page.getByRole('button', { name: 'Başla' }).click();

  // G2: the cards one by one, unheard.
  await expect(heading(page, 'Isınma')).toBeVisible();
  for (let card = 0; card < 2; card += 1) {
    await page.getByRole('button', { name: 'Sıradaki kelime' }).click();
  }
  await page.getByRole('button', { name: 'Dinle adımına geç' }).click();

  // G3
  await expect(heading(page, 'Dinle')).toBeVisible();
  const turn = page.getByRole('button', { name: 'Sıra sende' });
  await runUntilVisible(page, turn.and(page.locator(':enabled')), { limitMs: 120_000 });
  await turn.click();

  // G4: three readings aloud, each ended by the child.
  await expect(heading(page, 'Oku')).toBeVisible();
  for (const next of ['2. okuma / 3', '3. okuma / 3']) {
    await page.getByRole('button', { name: 'Okumayı bitir' }).click();
    await expect(page.getByText(next)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Okumayı bitir' }).click();

  // G6, then G7 without a pace.
  await expect(heading(page, 'Kapanış')).toBeVisible();
  await page.getByRole('radio', { name: 'Tepenin ardında' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();
  await expect(page.getByText('Soru 2 / 2')).toBeVisible();
  await page.getByRole('radio', { name: 'Fener yakın olduğu için' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();
  await expect(heading(page, 'Bugünlük bitti')).toBeVisible();
  await expect(page.getByText('Seansın özeti veline gitti.')).toBeVisible();
  await expect(page.getByText('71', { exact: true })).toHaveCount(0);

  expect(await getUserMediaCalls(page)).toBe(0);
});
