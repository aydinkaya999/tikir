import { expect, type Page, test } from '@playwright/test';
import { heading } from './support/onboarding';
import { openTomorrow } from './support/measurement';
import { passParentGate } from './support/parentGate';
import {
  openPaused,
  prepareSessionPage,
  runUntilVisible,
  storedRecords,
  waitForListening,
} from './support/session';

// Phase 5 criteria 1–5 (docs/planlar/faz-5.md, "Ölçütler ve kanıtları"): the library, a book made
// from cards and from a parent's text with the mock generator, and a day read from a library book.
test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

/** The text on U2's design: 24 words, 74 syllables, three sentences. */
const designText =
  'Dinozorlar milyonlarca yıl önce yaşadı. Bazıları bir otobüsten uzundu, bazıları ise bir tavuk kadar küçüktü. Bilim insanları, kemiklerini inceleyerek onların nasıl yaşadığını anlamaya çalışıyor.';

function levelLines(page: Page) {
  return page.getByRole('region', { name: 'Seviye denetimi' }).getByRole('listitem');
}

test('a book made from cards opens ready, under the design’s title and sentence', async ({
  page,
}) => {
  await page.goto('/kitaplik/kur?demo=cocuk-sabahi');
  const make = page.getByRole('button', { name: 'Kitabımı yap' });
  await expect(make).toBeDisabled();
  for (const card of ['Deniz ve Tıkır', 'Uzay istasyonu']) {
    await page.getByRole('button', { name: card, exact: true }).click();
  }
  await expect(make).toBeDisabled();
  await page.getByRole('button', { name: 'Gizemli ses', exact: true }).click();
  await expect(
    page.getByText('Deniz ve Tıkır, uzay istasyonunda gizemli bir sesin peşine düşüyor.'),
  ).toBeVisible();

  await make.click();

  await expect(page.getByRole('status')).toHaveText('Kitabın yazılıyor');
  await expect(heading(page, 'Kitabın hazır')).toBeVisible();
  await expect(page).toHaveURL(/\/kitaplik\/[^/]+\/hazir$/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Uzay İstasyonunda Gizemli Ses' }),
  ).toBeVisible();
  await expect(page.getByText('6 sayfa, 176 kelime, yaklaşık 3 dakika')).toBeVisible();
  await expect(levelLines(page)).toHaveText([
    '3. sınıf düzeyine uygun',
    'Kelime başına ortalama 2,5 hece',
    'Cümle başına ortalama 5,9 kelime',
  ]);

  // The new book heads the library.
  await page.getByRole('link', { name: 'Geri dön' }).click();
  await expect(page).toHaveURL('/kitaplik');
  const books = page.getByRole('region', { name: 'Senin kitapların' }).getByRole('button');
  await expect(books).toHaveCount(3);
  await expect(books.first()).toHaveAccessibleName('Uzay İstasyonunda Gizemli Ses');
  await expect(books.first()).toHaveAccessibleDescription('Kartlarla yaptın');
});

test('a parent’s text becomes a book with its real level check, over the grade with a warning', async ({
  page,
}) => {
  await page.goto('/veli/kitap?demo=cocuk-sabahi');
  await passParentGate(page);
  const text = page.getByRole('textbox', { name: 'Metin' });
  await expect(page.getByText('0 kelime')).toBeVisible();
  await text.fill('Kediler uyur.');
  await expect(page.getByText('2 kelime')).toBeVisible();
  await text.fill(designText);
  await expect(page.getByText('24 kelime')).toBeVisible();

  await page.getByRole('button', { name: 'Kitabı üret' }).click();

  await expect(heading(page, 'Kitabın hazır')).toBeVisible();
  await expect(page.getByText('Seviye denetiminden geçmedi.')).toBeVisible();
  await expect(page.getByText('1 sayfa, 24 kelime, yaklaşık 1 dakika')).toBeVisible();
  await expect(levelLines(page)).toHaveText([
    '3. sınıf düzeyinin üstünde',
    'Kelime başına ortalama 3,1 hece (en çok 2,7)',
    'Cümle başına ortalama 8 kelime',
  ]);
  await expect(page.getByText('Kelime yerleştirme ve sorular arka uçla gelecek.')).toBeVisible();
  // The parent decides (docs/kararlar.md P20).
  await expect(page.getByRole('button', { name: 'Okumaya başla' })).toBeEnabled();
});

test('reading a library book is the day’s session up to G7, and the series goes on the next day', async ({
  page,
}) => {
  test.setTimeout(360_000);
  await prepareSessionPage(page);
  await openPaused(page, '/kitaplik/uzay-istasyonunda-gizemli-ses/hazir?demo=cocuk-sabahi');

  await page.getByRole('button', { name: 'Okumaya başla' }).click();

  // G2 first: cards are due today.
  await expect(heading(page, 'Isınma')).toBeVisible();
  await waitForListening(page);
  await runUntilVisible(page, heading(page, 'Dinle'), { stepMs: 200, limitMs: 30_000 });

  // G3: the page is the book's.
  await expect(page.getByText('Uzay İstasyonunda Gizemli Ses', { exact: true })).toBeVisible();
  const turn = page.getByRole('button', { name: 'Sıra sende' });
  await runUntilVisible(page, turn.and(page.locator(':enabled')), { limitMs: 240_000 });
  await turn.click();

  // G4: three readings of the book.
  await expect(heading(page, 'Oku')).toBeVisible();
  await waitForListening(page);
  await runUntilVisible(page, page.getByText('2. okuma / 3'), { limitMs: 240_000 });
  await runUntilVisible(page, page.getByText('3. okuma / 3'), { limitMs: 240_000 });
  await runUntilVisible(page, heading(page, 'Kayıt'), { limitMs: 240_000 });

  // G5: the recording stays out of the series' audio book (P19).
  await expect(page.getByText('Sesli kitabına eklendi')).toHaveCount(0);
  await page.getByRole('button', { name: 'Devam et' }).click();

  // G6: the book's own questions.
  await expect(heading(page, 'Kapanış')).toBeVisible();
  await page.getByRole('radio', { name: 'Kovaya damlayan sudan' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();
  await expect(page.getByText('Soru 2 / 2')).toBeVisible();
  await page.getByRole('radio', { name: 'Küçük robot' }).check();
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();

  // G7, then G1 with the day's book and the series' chapter for tomorrow.
  await expect(heading(page, 'Bugünlük bitti')).toBeVisible();
  await page.getByRole('button', { name: 'Kapat' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Bugünkü kitap')).toBeVisible();
  await expect(page.getByText('Yarın: Dar Patika')).toBeVisible();
  const sessions = await storedRecords<{ date: string; step: string; chapterRef: unknown }>(
    page,
    'sessions',
  );
  expect(sessions.find((session) => session.date === '2026-11-21')).toMatchObject({
    step: 'done',
    chapterRef: { bookId: 'uzay-istasyonunda-gizemli-ses', chapter: 1 },
  });

  // The next day the series goes on where it stopped, and the library day counts in a row.
  await openTomorrow(page);
  await expect(page.getByText('4. bölüm, 12 dakika')).toBeVisible();
  await expect(page.getByText('12 bölümün 3’ü tamam')).toBeVisible();
  await expect(page.getByText('3 gün üst üste')).toBeVisible();
});

test('no child screen has a free text box', async ({ page }) => {
  const childScreens = [
    '/?demo=cocuk-sabahi',
    '/kitaplik',
    '/kitaplik/kur',
    '/kitaplik/uzay-istasyonunda-gizemli-ses/hazir',
    '/album',
    '/studyo',
    '/seans/isinma?demo=cocuk-sabahi&adim=warmup',
    '/seans/dinle?demo=cocuk-sabahi&adim=listen',
    '/seans/oku?demo=cocuk-sabahi&adim=read-1',
    '/seans/kayit?demo=cocuk-sabahi&adim=record',
    '/seans/kapanis?demo=cocuk-sabahi&adim=wrapUp',
    '/seans/bitti?demo=cocuk-sabahi&adim=done',
  ];
  for (const path of childScreens) {
    await page.goto(path);
    await expect(page.locator('[data-shell]')).toBeVisible();
    await expect(page.getByRole('textbox'), path).toHaveCount(0);
  }
});
