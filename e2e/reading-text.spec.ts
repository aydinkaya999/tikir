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
