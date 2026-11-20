import { expect, test, type Page } from '@playwright/test';

// Phase 0 acceptance criterion 2: the showcase shows every component of the inventory
// (docs/tasarim-sistemi.md, "Bileşenler") and nothing overflows at 390, 1180 and 1440 px.

const inventory = [
  'Button',
  'IconButton',
  'MicButton',
  'Chip',
  'Card',
  'PageCard',
  'SpeechBubble',
  'Companion',
  'Monster',
  'Tile',
  'StepTiles',
  'RaceBar',
  'SegmentedControl',
  'OptionCard',
  'Switch',
  'Checkbox',
  'TextField',
  'TextArea',
  'ChoicePills',
  'Dialog',
  'StatCard',
  'LineChart',
  'ProgressBar',
  'BookCover',
];
// Phase 0 scope adds the reading text components and the icon set.
const alsoShown = ['ReadingText', 'PhraseText', 'Icon'];

const viewports = [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'tablet', width: 1180, height: 820 },
  { name: 'web', width: 1440, height: 900 },
] as const;

async function openShowcase(page: Page) {
  await page.goto('/gelistirme/vitrin');
  await expect(page.locator('[data-component]').first()).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test('the showcase has a section for every inventory component', async ({ page }) => {
  await openShowcase(page);
  const sections = await page
    .locator('[data-component]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-component')));

  expect([...sections].sort()).toEqual([...inventory, ...alsoShown].sort());
});

for (const viewport of viewports) {
  test(`nothing overflows at ${String(viewport.width)} px (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openShowcase(page);

    const overflow = await page.evaluate(() => {
      const pageOverflow = document.documentElement.scrollWidth - window.innerWidth;
      const sections = Array.from(document.querySelectorAll('[data-component]'), (section) => ({
        name: section.getAttribute('data-component'),
        overflow: section.scrollWidth - section.clientWidth,
      })).filter((section) => section.overflow > 0);
      return { pageOverflow, sections };
    });

    expect(overflow).toEqual({ pageOverflow: 0, sections: [] });
  });

  test(`touch targets are at least 44 px (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openShowcase(page);

    const tooSmall = await page.evaluate(() => {
      const targets = [
        ...document.querySelectorAll<HTMLElement>('[data-component] button, [data-component] a'),
        // A native checkbox or radio is hit through its label.
        ...Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-component] input[type="checkbox"], [data-component] input[type="radio"]',
          ),
          (input) => input.closest('label') ?? input,
        ),
      ];
      return (
        targets
          // A closed dialog's buttons are not there to touch.
          .filter((target) => target.closest('dialog:not([open])') === null)
          .map((target) => {
            const box = target.getBoundingClientRect();
            return {
              name: target.getAttribute('aria-label') ?? target.textContent.trim().slice(0, 30),
              width: Math.round(box.width),
              height: Math.round(box.height),
            };
          })
          .filter((target) => target.width < 44 || target.height < 44)
      );
    });

    expect(tooSmall).toEqual([]);
  });
}

test('no transition runs when reduced motion is asked for', async ({ page }) => {
  await openShowcase(page);
  const button = page.locator('[data-component="Button"] button').first();
  expect(await button.evaluate((element) => getComputedStyle(element).transitionDuration)).not.toBe(
    '0s',
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });

  expect(await button.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
    '0s',
  );
});

// Phase 3: Escape closes a dialog and the focus goes back to the button that opened it; these are
// the browser's, so they are tested here rather than in jsdom.
test('a dialog closes with Escape and gives the focus back', async ({ page }) => {
  await openShowcase(page);
  const opener = page.getByRole('button', { name: 'Pencereyi aç' });

  // From the keyboard: WebKit on macOS gives no focus to a clicked button, so only a keyboard
  // user has a focus to give back.
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Pencere başlığı' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
