import { expect, test } from '@playwright/test';

test('the home page is Turkish and has a main landmark', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.getByRole('main')).toBeAttached();
});

test('the interface font is loaded from our own origin', async ({ page }) => {
  const fontRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.woff2')) {
      fontRequests.push(request.url());
    }
  });
  await page.goto('/');

  // FontFaceSet.load resolves to the faces it loaded; an undefined family yields none.
  const faces = await page.evaluate(async () => {
    const loaded = await document.fonts.load('500 16px "Atkinson Hyperlegible Next"', 'Tıkır');
    return loaded.map((face) => ({
      family: face.family.replace(/^["']|["']$/g, ''),
      status: face.status,
    }));
  });

  expect(faces.length).toBeGreaterThan(0);
  for (const face of faces) {
    expect(face).toEqual({ family: 'Atkinson Hyperlegible Next', status: 'loaded' });
  }
  expect(fontRequests.length).toBeGreaterThan(0);
  for (const url of fontRequests) {
    expect(new URL(url).origin).toBe(new URL(page.url()).origin);
  }
});
