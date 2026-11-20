import { expect, type Page, test } from '@playwright/test';
import {
  dayMs,
  getUserMediaCalls,
  openPaused,
  prepareSessionPage,
  reloadPaused,
  runUntilVisible,
  sessionDay,
  storedKeys,
  storedRecords,
  waitForListening,
} from './support/session';

// Phase 2 criteria 1 and 4–7 (docs/planlar/faz-2b.md, "Ölçütler ve kanıtları"): the daily session
// with the demo profile, the fake listener's typical readings and Tıkır's silent narration.
test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

interface StoredSession {
  date: string;
  step: string;
  readings: { attempt: number; recordingId?: string }[];
  warmup?: { words: string[] };
}

const today = '2026-11-21';

async function todaysSession(page: Page, date = today): Promise<StoredSession | undefined> {
  const sessions = await storedRecords<StoredSession>(page, 'sessions');
  return sessions.find((session) => session.date === date);
}

function heading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name, exact: true });
}

test('a typical session runs from G1 to G7 with the demo profile’s numbers', async ({ page }) => {
  test.setTimeout(240_000);
  await prepareSessionPage(page);
  await openPaused(page, '/?demo=cocuk-sabahi');

  // G1
  await expect(page.getByText('Dar Patika', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('4. bölüm, 12 dakika')).toBeVisible();
  await expect(page.getByText('12 bölümün 3’ü tamam')).toBeVisible();
  await expect(page.getByText('2 gün üst üste')).toBeVisible();
  await page.getByRole('button', { name: 'Başla' }).click();

  // G2: the three cards in order, each read right at the first try.
  await expect(heading(page, 'Isınma')).toBeVisible();
  await expect(page.getByText('kıvrılıyordu', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Evcilleşmesine 2 doğru okuma kaldı')).toBeVisible();
  await waitForListening(page);
  // The counter session-consent.spec.ts expects to stay at 0 does count the microphone's opening.
  expect(await getUserMediaCalls(page)).toBeGreaterThan(0);
  // A one-word card is read in about a second: small steps see every card.
  for (const word of ['ağaçlarının', 'belirdiğinde']) {
    await runUntilVisible(page, page.getByText(word, { exact: true }).first(), {
      stepMs: 200,
      limitMs: 20_000,
    });
  }

  // G3: a reload keeps the step; Tıkır reads the whole text before the child's turn.
  await runUntilVisible(page, heading(page, 'Dinle'), { limitMs: 20_000 });
  await reloadPaused(page);
  await expect(heading(page, 'Dinle')).toBeVisible();
  const turn = page.getByRole('button', { name: 'Sıra sende' });
  await runUntilVisible(page, turn.and(page.locator(':enabled')), { limitMs: 120_000 });
  await turn.click();

  // G4: three readings; a reload in the second one resumes it from the microphone button.
  await expect(heading(page, 'Oku')).toBeVisible();
  await expect(page.getByText('1. okuma / 3')).toBeVisible();
  await waitForListening(page);
  await runUntilVisible(page, page.getByText('2. okuma / 3'));
  await reloadPaused(page);
  await expect(page.getByText('2. okuma / 3')).toBeVisible();
  await page.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }).click();
  await waitForListening(page);
  await runUntilVisible(page, page.getByText('3. okuma / 3'));
  await runUntilVisible(page, heading(page, 'Kayıt'));

  // G5, G6
  await page.getByRole('button', { name: 'Devam et' }).click();
  await expect(heading(page, 'Kapanış')).toBeVisible();
  await page.getByRole('radio', { name: 'Tepenin ardında' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();
  await expect(page.getByText('Soru 2 / 2')).toBeVisible();
  await page.getByRole('radio', { name: 'Fener yakın olduğu için' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();

  // G7, then back on the road.
  await expect(heading(page, 'Bugünlük bitti')).toBeVisible();
  await expect(page.getByText('71', { exact: true })).toBeVisible();
  await expect(page.getByText('Dünkü senden 4 fazla')).toBeVisible();
  await page.getByRole('button', { name: 'Kapat' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Bugünlük bitti').first()).toBeVisible();

  const session = await todaysSession(page);
  expect(session?.step).toBe('done');
  expect(session?.readings).toHaveLength(3);
  const cards = await storedRecords<{ word: string }>(page, 'stuckWords');
  expect(cards.map((card) => card.word)).toEqual(
    expect.arrayContaining(['arasından', 'soluk', 'rüzgârı']),
  );
});

test('the third reading is recorded, played and recorded again', async ({ page }) => {
  test.setTimeout(120_000);
  await prepareSessionPage(page);
  await openPaused(page, '/seans/kayit?demo=cocuk-sabahi&adim=record');

  await expect(page.getByText('0:52')).toBeVisible();
  const firstTake = (await todaysSession(page))?.readings[2]?.recordingId;
  expect(firstTake).toBeDefined();
  await page.getByRole('button', { name: 'Kaydı dinle' }).click();
  await page.getByRole('button', { name: 'Duraklat' }).click();
  await expect(page.getByRole('button', { name: 'Kaydı dinle' })).toBeVisible();

  await page.getByRole('button', { name: 'Baştan kaydet' }).click();
  await expect(page.getByText('3. okuma / 3')).toBeVisible();
  await waitForListening(page);
  await runUntilVisible(page, heading(page, 'Kayıt'));

  const secondTake = (await todaysSession(page))?.readings[2]?.recordingId;
  expect(secondTake).toBeDefined();
  expect(secondTake).not.toBe(firstTake);
  const recordings = await storedKeys(page, 'recordings');
  expect(recordings).toContain(secondTake);
  expect(recordings).not.toContain(firstTake);
});

test('the next day opens the next chapter with yesterday’s words and the ghost', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await prepareSessionPage(page);
  await openPaused(page, '/?demo=cocuk-sabahi&adim=done');
  await expect(page.getByText('Bugünlük bitti').first()).toBeVisible();

  await page.clock.setSystemTime(new Date(sessionDay.getTime() + dayMs));
  await reloadPaused(page);

  await expect(page.getByText('Yıldız Tepesi', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('5. bölüm, 12 dakika')).toBeVisible();
  await page.getByRole('button', { name: 'Başla' }).click();
  await expect(heading(page, 'Isınma')).toBeVisible();
  // Yesterday's misses come back as cards, after the new chapter's word.
  const deck = (await todaysSession(page, '2026-11-22'))?.warmup?.words;
  expect(deck).toEqual(['tırmanmaya', 'arasından', 'rüzgârı']);
  await expect(page.getByText('tırmanmaya', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Dinle adımına geç' }).click();
  await expect(heading(page, 'Dinle')).toBeVisible();
  const turn = page.getByRole('button', { name: 'Sıra sende' });
  await runUntilVisible(page, turn.and(page.locator(':enabled')), { limitMs: 120_000 });
  await turn.click();

  await expect(heading(page, 'Oku')).toBeVisible();
  await waitForListening(page);
  await runUntilVisible(page, page.getByText('dün', { exact: true }), { limitMs: 20_000 });
});
