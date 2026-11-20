import { expect, test, type Locator } from '@playwright/test';

// docs/tasarim-sistemi.md, "Okuma metni": as the highlight moves, no word may move.
// Phase 0 acceptance criterion 4.

const viewports = [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'tablet', width: 1180, height: 820 },
  { name: 'web', width: 1440, height: 900 },
] as const;
// The school letters at each of the four sizes, with the widest spacing (docs/planlar/faz-3.md,
// karar 23): the reading style may not break the rule either.
const variants = ['default', 'school-0', 'school-1', 'school-2', 'school-3'] as const;

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

// The reading style reaches the text: the school letters, and a larger size at each step.
for (const viewport of viewports) {
  test(`the school letters grow by the four sizes (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/gelistirme/vitrin');
    const shown: { family: string; size: number }[] = [];
    for (const size of [0, 1, 2, 3]) {
      const word = page.locator(
        `[data-reading-demo="school-${String(size)}"] [data-word-index="0"]`,
      );
      await expect(word).toBeVisible();
      shown.push(
        await word.evaluate((element) => {
          const style = getComputedStyle(element);
          return { family: style.fontFamily, size: Number.parseFloat(style.fontSize) };
        }),
      );
    }

    for (const [step, each] of shown.entries()) {
      expect(each.family, `size ${String(step)}`).toMatch(/^"?Didact Gothic/);
      if (step > 0) {
        expect(each.size, `size ${String(step)}`).toBeGreaterThan(shown[step - 1]?.size ?? 0);
      }
    }
  });
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
