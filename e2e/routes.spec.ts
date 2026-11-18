import { expect, test, type Page } from '@playwright/test';

// Every route of docs/ekranlar.md opens in its shell; navigation marks where you are; the
// phone bottom bar never covers content; every navigation target is at least 44 px.

interface ShellRoute {
  path: string;
  shell: 'child' | 'parent' | 'session' | 'focus' | 'onboarding';
  /** Name of the active navigation item: phone/tablet label and web label. */
  nav?: { phone: string; web: string };
}

const routes: ShellRoute[] = [
  { path: '/', shell: 'child', nav: { phone: 'Yol', web: 'Yol' } },
  { path: '/kitaplik', shell: 'child', nav: { phone: 'Kitaplık', web: 'Kitaplık' } },
  { path: '/album', shell: 'child', nav: { phone: 'Albüm', web: 'Albüm' } },
  { path: '/studyo', shell: 'child', nav: { phone: 'Stüdyo', web: 'Stüdyo' } },
  { path: '/veli', shell: 'parent', nav: { phone: 'Özet', web: 'Özet' } },
  {
    path: '/veli/takilinan',
    shell: 'parent',
    nav: { phone: 'Takılınan', web: 'Takılınan yerler' },
  },
  { path: '/veli/olcum', shell: 'parent', nav: { phone: 'Ölçüm', web: 'Ölçüm' } },
  { path: '/veli/yazi', shell: 'parent', nav: { phone: 'Yazı', web: 'Yazı ayarı' } },
  { path: '/veli/kitap', shell: 'parent', nav: { phone: 'Kitaplar', web: 'Kitaplar' } },
];

const viewports = {
  telefon: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  web: { width: 1440, height: 900 },
} as const;

async function open(page: Page, path: string, viewport: keyof typeof viewports) {
  await page.setViewportSize(viewports[viewport]);
  await page.goto(path);
  await expect(page.locator('[data-shell]')).toBeVisible();
}

for (const route of routes) {
  test(`${route.path} opens in the ${route.shell} shell`, async ({ page }) => {
    for (const viewport of ['telefon', 'web'] as const) {
      await open(page, route.path, viewport);
      await expect(page.locator('[data-shell]')).toHaveAttribute('data-shell', route.shell);
      await expect(page.getByRole('main')).toHaveCount(1);

      if (route.nav) {
        const active = page.locator('nav a[aria-current="page"]');
        await expect(active).toHaveCount(1);
        await expect(active).toHaveAccessibleName(
          viewport === 'web' ? route.nav.web : route.nav.phone,
        );
      }
    }
  });
}

for (const path of ['/', '/veli']) {
  test(`content of ${path} never ends under the phone bottom bar`, async ({ page }) => {
    await open(page, path, 'telefon');
    // Fill the page well past the screen, then scroll to the very end.
    await page.getByRole('main').evaluate((main) => {
      const filler = document.createElement('div');
      filler.style.height = '2000px';
      filler.dataset.testFiller = '';
      main.append(filler);
    });
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    const boxes = await page.evaluate(() => {
      const nav = document.querySelector('nav')?.getBoundingClientRect();
      const filler = document.querySelector('[data-test-filler]')?.getBoundingClientRect();
      return { navTop: nav?.top ?? 0, fillerBottom: filler?.bottom ?? Infinity };
    });
    expect(boxes.fillerBottom).toBeLessThanOrEqual(boxes.navTop + 0.5);
  });
}

for (const viewport of Object.keys(viewports) as (keyof typeof viewports)[]) {
  test(`navigation targets are at least 44 px (${viewport})`, async ({ page }) => {
    for (const path of ['/', '/veli']) {
      await open(page, path, viewport);
      const tooSmall = await page.locator('nav a').evaluateAll((links) =>
        links
          .filter((link) => link.getClientRects().length > 0)
          .map((link) => {
            const box = link.getBoundingClientRect();
            return { name: link.textContent, width: box.width, height: box.height };
          })
          .filter((box) => box.width < 44 || box.height < 44),
      );
      expect(tooSmall).toEqual([]);
    }
  });
}

test('the way between the child and parent areas is a web-only link', async ({ page }) => {
  await open(page, '/', 'web');
  await expect(page.getByRole('link', { name: 'Veli alanı' })).toHaveAttribute('href', '/veli');
  await open(page, '/veli', 'web');
  await expect(page.getByRole('link', { name: 'Çocuk ekranı' })).toHaveAttribute('href', '/');

  // TODO(design): phones and tablets have no way into the parent area (docs/planlar/faz-0.md, 12).
  await open(page, '/', 'telefon');
  await expect(page.getByRole('link', { name: 'Veli alanı' })).toBeHidden();
  await open(page, '/veli', 'tablet');
  await expect(page.getByRole('link', { name: 'Çocuk ekranı' })).toBeHidden();
});
