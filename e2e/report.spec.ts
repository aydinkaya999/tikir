import { expect, test } from '@playwright/test';
import { openPaused, prepareSessionPage } from './support/session';

// Phase 4 criteria 1 and 2 (docs/planlar/faz-4.md, "Ölçütler ve kanıtları"): the weekend demo
// profile shows the values seed/demo-profil.json expects on V1–V4, with the goal line and the
// grade average on the chart.
test.use({ timezoneId: 'Europe/Istanbul' });

test('the weekend profile’s report shows the expected numbers', async ({ page }) => {
  await prepareSessionPage(page);
  await openPaused(page, '/veli?demo=veli-haftasonu&kapi=acik');
  const main = page.getByRole('main');

  // V1.
  await expect(page.getByRole('heading', { level: 1, name: 'Deniz’in haftası' })).toBeVisible();
  await expect(
    main.getByText('71', { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(main.getByText('Geçen haftadan 4 fazla')).toBeVisible();
  await expect(main.getByText('%93', { exact: true })).toBeVisible();
  await expect(main.getByText('3 / 4', { exact: true })).toBeVisible();
  await expect(main.getByText('5 / 7', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: 'Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70, 3. sınıf ortalaması 90',
    }),
  ).toBeVisible();
  await expect(main.getByText('Hedef 70').filter({ visible: true })).toBeVisible();
  await expect(main.getByText('3. sınıf ortalaması 90').filter({ visible: true })).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Bu hafta 7 günün 5’inde seans yapıldı' }),
  ).toBeVisible();
  await expect(
    main
      .getByText('Deniz bu hafta hedef çizgisini geçti. Sıradaki hedef 78.')
      .filter({ visible: true }),
  ).toBeVisible();

  // V2.
  await page
    .getByRole('navigation', { name: 'Veli gezinmesi' })
    .getByRole('link', { name: 'Takılınan yerler' })
    .click();
  await expect(main.getByText('Bu hafta 30 hata, 5 türde')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Hata türleri' }).getByRole('listitem')).toHaveText([
    'Yanlış okuma9',
    'Ek hatası7',
    'Atlama6',
    'Tekrar5',
    'Ekleme3',
  ]);

  // V3.
  await page
    .getByRole('navigation', { name: 'Veli gezinmesi' })
    .getByRole('link', { name: 'Ölçüm' })
    .click();
  await expect(main.getByText('76 kelime okudu')).toBeVisible();
  await expect(main.getByText('5 hata', { exact: true })).toBeVisible();
  await expect(main.getByText('Doğruluk %93')).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Okuma düzeyi: öğretim' }).locator('[aria-current="true"]'),
  ).toHaveText('Öğretim%90–98');
  await expect(main.getByText('Sıradaki ölçüm 22 Kasım Pazar')).toBeVisible();

  // V4.
  await page
    .getByRole('navigation', { name: 'Veli gezinmesi' })
    .getByRole('link', { name: 'Yazı ayarı' })
    .click();
  await expect(main.getByText(/2 ölçümün ortalaması/)).toBeVisible();
  await expect(main.getByText('69', { exact: true })).toBeVisible();
  await expect(main.getByText('72', { exact: true })).toBeVisible();
});
