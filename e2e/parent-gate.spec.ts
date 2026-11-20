import { expect, test } from '@playwright/test';
import { passParentGate } from './support/parentGate';
import { runUntilVisible, sessionDay } from './support/session';

// Phase 3 criterion 7 (docs/planlar/faz-3.md, "Ölçütler ve kanıtları"; docs/kararlar.md P11): the
// parent area opens only through its gate, which waits after three wrong answers.
test('the parent area opens only through the gate', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: sessionDay });
  await page.goto('/veli?demo=cocuk-sabahi');

  const question = page.getByText(/^\d+ \+ \d+ = \?$/);
  const field = page.getByLabel('Cevap');
  const enter = page.getByRole('button', { name: 'Gir' });
  const wrongAnswer = async () => {
    const [a = 0, b = 0] = ((await question.textContent()) ?? '').match(/\d+/g)?.map(Number) ?? [];
    return String(a + b + 1);
  };

  // Three wrong answers, and the gate waits; a reload does not end the wait.
  await expect(page.locator('[data-shell="parent"]')).toHaveCount(0);
  await field.fill(await wrongAnswer());
  await enter.click();
  await expect(page.getByText('Olmadı. Bir daha deneyin.')).toBeVisible();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await field.fill(await wrongAnswer());
    await enter.click();
  }
  await expect(page.getByText('30 saniye sonra yeniden deneyebilirsiniz.')).toBeVisible();
  await expect(field).toBeDisabled();
  await page.reload();
  await expect(field).toBeDisabled();
  await runUntilVisible(page, enter.and(page.locator(':enabled')), { limitMs: 60_000 });

  // The right answer opens the area; it stays open inside it.
  await passParentGate(page);
  const parentNav = page.getByRole('navigation', { name: 'Veli gezinmesi' });
  await parentNav.getByRole('link', { name: 'Yazı ayarı' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Yazı ayarı' })).toBeVisible();
  await expect(question).toHaveCount(0);

  // Back to the child screen, and the gate asks again.
  await parentNav.getByRole('link', { name: 'Çocuk ekranı' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Merhaba Deniz' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Ana gezinme' })
    .getByRole('link', { name: 'Veli alanı' })
    .click();
  await expect(question).toBeVisible();
  await expect(page.locator('[data-shell="parent"]')).toHaveCount(0);
});
