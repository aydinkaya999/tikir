import { expect, test, type Locator } from '@playwright/test';

// docs/tasarim-sistemi.md, "Okuma metni": as the highlight moves, no word may move.
// Phase 0 acceptance criterion 4.

const viewports = [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'tablet', width: 1180, height: 820 },
  { name: 'web', width: 1440, height: 900 },
] as const;
const variants = ['default', 'school-largest'] as const;

/** Every word box relative to the paragraph, so scrolling cannot hide or fake a move. */
async function wordBoxes(demo: Locator): Promise<number[][]> {
  return demo.locator('p:has([data-word-index])').evaluate((paragraph) => {
    const origin = paragraph.getBoundingClientRect();
    return Array.from(paragraph.querySelectorAll('[data-word-index]'), (word) => {
      const box = word.getBoundingClientRect();
      return [box.x - origin.x, box.y - origin.y, box.width, box.height].map(
        (value) => Math.round(value * 100) / 100,
      );
    });
  });
}

for (const viewport of viewports) {
  for (const variant of variants) {
    test(`no word moves while the highlight walks the page (${variant}, ${viewport.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/gelistirme/vitrin');
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const demo = page.locator(`[data-reading-demo="${variant}"]`);
      const slider = demo.getByRole('slider');
      // The showcase is a lazy route: wait until its words are on screen before counting.
      await expect(demo.locator('[data-word-index]').first()).toBeVisible();
      const wordCount = await demo.locator('[data-word-index]').count();
      expect(wordCount).toBeGreaterThan(20);

      const before = await wordBoxes(demo);
      for (let index = 0; index < wordCount; index += 1) {
        await slider.fill(String(index));
        await expect(demo.locator(`[data-word-index="${String(index)}"]`)).toHaveAttribute(
          'data-current',
          '',
        );
        expect(await wordBoxes(demo), `highlight on word ${String(index)}`).toEqual(before);
      }
    });
  }
}

/** Every line fragment of every phrase unit, relative to the paragraph. */
async function unitBoxes(demo: Locator): Promise<number[][][]> {
  return demo.locator('p:has([data-unit-index])').evaluate((paragraph) => {
    const origin = paragraph.getBoundingClientRect();
    return Array.from(paragraph.querySelectorAll('[data-unit-index]'), (unit) =>
      Array.from(unit.getClientRects(), (box) =>
        [box.x - origin.x, box.y - origin.y, box.width, box.height].map(
          (value) => Math.round(value * 100) / 100,
        ),
      ),
    );
  });
}

// The phrase-unit view (G3) is reading text too: the narration highlight may not move a line.
for (const viewport of viewports) {
  test(`no phrase unit moves while the narration highlight walks the page (${viewport.name})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/gelistirme/vitrin');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const demo = page.locator('[data-phrase-demo="default"]');
    const slider = demo.getByRole('slider');
    await expect(demo.locator('[data-unit-index]').first()).toBeVisible();
    const unitCount = await demo.locator('[data-unit-index]').count();
    expect(unitCount).toBeGreaterThan(5);

    const before = await unitBoxes(demo);
    for (let index = 0; index < unitCount; index += 1) {
      await slider.fill(String(index));
      await expect(demo.locator(`[data-unit-index="${String(index)}"]`)).toHaveAttribute(
        'data-current',
        '',
      );
      expect(await unitBoxes(demo), `highlight on unit ${String(index)}`).toEqual(before);
    }
  });
}
