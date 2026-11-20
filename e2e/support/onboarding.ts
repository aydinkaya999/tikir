// The setup walked as a parent does (docs/ekranlar.md, K1–K4; docs/planlar/faz-3.md, Task 16).
import { expect, type Page } from '@playwright/test';
import { runUntilVisible, waitForListening } from './session';

export const consentLabel =
  'Çocuğumun ses kaydının okuma geri bildirimi için işlenmesine izin veriyorum.';

export function heading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name, exact: true });
}

/** K1 and K2: the parent's account, then the reader Deniz in the given grade. */
export async function enterAccountAndReader(
  page: Page,
  { consent, grade }: { consent: boolean; grade: 1 | 2 | 3 | 4 },
): Promise<void> {
  await expect(heading(page, 'Veli hesabı')).toBeVisible();
  await page.getByLabel('E-posta', { exact: true }).fill('veli@ornek.com');
  await page.getByLabel('Parola', { exact: true }).fill('gizli-parola-1');
  if (consent) {
    await page.getByRole('checkbox', { name: consentLabel }).check();
  }
  await page.getByRole('button', { name: 'Hesabı oluştur' }).click();

  await expect(heading(page, 'Okuyucuyu tanıyalım')).toBeVisible();
  await page.getByLabel('Okuyucunun adı', { exact: true }).fill('Deniz');
  await page.getByRole('radio', { name: `${String(grade)}. sınıf` }).check();
  await page.getByRole('button', { name: 'Uzay', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et' }).click();
}

/** K3: the microphone K2's tap opened listens, and the clock runs the minute to K4. */
export async function readTheMinute(page: Page): Promise<void> {
  await expect(heading(page, '1 dakikalık okuma')).toBeVisible();
  await waitForListening(page);
  await runUntilVisible(page, heading(page, 'Tıkır ile tanış'), { limitMs: 90_000 });
}
