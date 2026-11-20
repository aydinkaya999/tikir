import { expect, type Page, test } from '@playwright/test';
import { openPaused, prepareSessionPage, waitForListening } from './support/session';

// Phase 2 criteria 2 and 3 (docs/planlar/faz-2b.md, "Ölçütler ve kanıtları"): the design scenario
// reaches the moment G4's design shows, and Tıkır's help ends as a hesitation.
test.use({ permissions: ['microphone'], timezoneId: 'Europe/Istanbul' });

function word(page: Page, index: number) {
  return page.locator(`[data-word-index="${String(index)}"]`);
}

test('the design scenario reaches the G4 moment', async ({ page }) => {
  await prepareSessionPage(page);
  await openPaused(page, '/seans/oku?demo=cocuk-sabahi&adim=read-2&senaryo=design');
  await page.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }).click();
  await waitForListening(page);

  await page.clock.runFor(19_300);

  await expect(word(page, 14)).toHaveAttribute('data-current', '');
  await expect(word(page, 12)).toHaveAttribute('data-ghost', '');
  await expect(word(page, 6)).toHaveAttribute('data-mark', 'hesitation');
  await expect(word(page, 9)).toHaveAttribute('data-mark', 'error');
  await expect(page.getByText('Süre 0:19')).toBeVisible();
  await expect(page.getByText('Doğru 13')).toBeVisible();
  await expect(page.getByText('Takılma 1')).toBeVisible();
  const help = page.getByText('Takıldın mı? Hecele:');
  await expect(help).toBeVisible();
  await expect(help).toContainText('a-ğaç-la-rı-nın');
  await expect(page.getByText('Dünkü senin 2 kelime önündesin.')).toBeVisible();

  await page.clock.runFor(3000);

  await expect(word(page, 14)).toHaveAttribute('data-mark', 'hesitation');
  await expect(help).toBeHidden();
});
