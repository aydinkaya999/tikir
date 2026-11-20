import { expect, type Locator, type Page, test } from '@playwright/test';
import { enterAccountAndReader, heading } from './support/onboarding';
import { openPaused, prepareSessionPage, storedRecords, waitForListening } from './support/session';

// Phase 3 criteria 5 and 6 (docs/planlar/faz-3.md, "Ölçütler ve kanıtları"): the style chosen on
// V4 reaches the reading texts, and choosing it moves nothing on V4.
test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

/** The reading text's letters and size, as the browser draws them. */
async function drawnStyle(word: Locator) {
  return word.evaluate((element) => {
    const style = getComputedStyle(element);
    return { family: style.fontFamily, size: style.fontSize };
  });
}

/** V4: school letters at the largest size and the widest spacing, kept in the store. */
async function chooseSchoolLargest(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Yazı ayarı' })).toBeVisible();
  await page.getByRole('button', { name: 'Okul harfleri', exact: true }).click();
  await page.getByRole('radio', { name: 'En büyük' }).check();
  await page.getByRole('radio', { name: 'Daha açık' }).check();
  await expect
    .poll(async () => {
      const [child] = await storedRecords<{ readingStyle: object }>(page, 'child');
      return child?.readingStyle;
    })
    .toEqual(expect.objectContaining({ font: 'school', sizeStep: 3, spacingStep: 2 }));
}

test('the reading style chosen on V4 shows in G3 and G4', async ({ page }) => {
  test.setTimeout(90_000);
  await prepareSessionPage(page);

  // G3: the narration's text.
  await openPaused(page, '/veli/yazi?demo=cocuk-sabahi&adim=listen&kapi=acik');
  await chooseSchoolLargest(page);
  await openPaused(page, '/seans/dinle');
  await expect(heading(page, 'Dinle')).toBeVisible();
  // From 1200 px the largest step is 33 px (src/styles/tokens-extra.css).
  expect(await drawnStyle(page.locator('[data-unit-index]').first())).toEqual({
    family: expect.stringMatching(/^"?Didact Gothic/) as unknown as string,
    size: '33px',
  });

  // G4: the reading's text.
  await openPaused(page, '/veli/yazi?demo=cocuk-sabahi&adim=read-1&kapi=acik');
  await chooseSchoolLargest(page);
  await openPaused(page, '/seans/oku');
  await expect(heading(page, 'Oku')).toBeVisible();
  expect(await drawnStyle(page.locator('[data-word-index]').first())).toEqual({
    family: expect.stringMatching(/^"?Didact Gothic/) as unknown as string,
    size: '33px',
  });
});

test('the level check shows the reader’s style: school letters for a first grader', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await prepareSessionPage(page);
  await openPaused(page, '/?demo=bos');

  // K3 comes before the parent area can be opened: the style is the grade's (karar 22).
  await enterAccountAndReader(page, { consent: true, grade: 1 });
  await expect(heading(page, '1 dakikalık okuma')).toBeVisible();
  await waitForListening(page);
  // The middle size from 1200 px is 25 px.
  expect(await drawnStyle(page.locator('[data-word-index]').first())).toEqual({
    family: expect.stringMatching(/^"?Didact Gothic/) as unknown as string,
    size: '25px',
  });
});

for (const viewport of [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'web', width: 1440, height: 900 },
] as const) {
  test(`the preview keeps its height and the controls stay in place for every style (${viewport.name})`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/veli/yazi?demo=cocuk-sabahi&kapi=acik');
    await expect(page.getByRole('heading', { level: 1, name: 'Yazı ayarı' })).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const preview = page.getByRole('region', { name: 'Önizleme' });
    const shown = preview.locator('[data-reading-font]').first();
    const places = async () => {
      const box = await preview.boundingBox();
      const spacing = await page.getByRole('radiogroup', { name: 'Harf aralığı' }).boundingBox();
      const trial = await page
        .getByRole('heading', { level: 2, name: 'Hangi ayar daha iyi?' })
        .boundingBox();
      return { previewHeight: box?.height, spacingTop: spacing?.y, trialTop: trial?.y };
    };

    const first = await places();
    for (const font of ['Net harfler', 'Okul harfleri'] as const) {
      await page.getByRole('button', { name: font, exact: true }).click();
      for (const [size, sizeName] of ['Küçük', 'Orta', 'Büyük', 'En büyük'].entries()) {
        await page.getByRole('radio', { name: sizeName, exact: true }).check();
        for (const [spacing, spacingName] of ['Normal', 'Açık', 'Daha açık'].entries()) {
          await page.getByRole('radio', { name: spacingName, exact: true }).check();
          await expect(shown).toHaveAttribute('data-reading-size', String(size));
          await expect(shown).toHaveAttribute('data-reading-spacing', String(spacing));
          expect(await places(), `${font}, ${sizeName}, ${spacingName}`).toEqual(first);
        }
      }
    }
  });
}
