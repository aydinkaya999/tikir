import { expect, test, type Page } from '@playwright/test';
import { passParentGate } from './support/parentGate';

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
  // The account page has no tab of its own (docs/planlar/faz-4.md, karar 37).
  { path: '/veli/hesap', shell: 'parent' },
];

const viewports = {
  telefon: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  web: { width: 1440, height: 900 },
} as const;

/** Product addresses open with the demo profile: an empty store opens the setup (phase 3). */
function withDemo(path: string): string {
  if (path.startsWith('/gelistirme') || path.startsWith('/kurulum') || path.includes('demo=')) {
    return path;
  }
  return `${path}${path.includes('?') ? '&' : '?'}demo=cocuk-sabahi`;
}

async function open(page: Page, path: string, viewport: keyof typeof viewports) {
  await page.setViewportSize(viewports[viewport]);
  await page.goto(withDemo(path));
  // The parent area opens behind its gate, on every page load (docs/planlar/faz-3.md, karar 26).
  if (path.startsWith('/veli')) {
    await passParentGate(page);
  }
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

// Each step opens with the developer parameters: the demo profile and today's session at that step
// (the steps open in order, docs/ekranlar.md, "Yönlendirme kuralları").
const sessionSteps = [
  { path: '/seans/isinma', step: 'warmup', current: 'Isınma', counter: '1 / 5' },
  { path: '/seans/dinle', step: 'listen', current: 'Dinle', counter: '2 / 5' },
  { path: '/seans/oku', step: 'read-1', current: 'Oku', counter: '3 / 5' },
  { path: '/seans/kayit', step: 'record', current: 'Kayıt', counter: '4 / 5' },
  { path: '/seans/kapanis', step: 'wrapUp', current: 'Kapanış', counter: '5 / 5' },
  { path: '/seans/bitti', step: 'done', current: null, counter: '5 / 5' },
];

for (const step of sessionSteps) {
  test(`${step.path} opens in the session shell at its step`, async ({ page }) => {
    for (const viewport of ['telefon', 'tablet', 'web'] as const) {
      await open(page, `${step.path}?demo=cocuk-sabahi&adim=${step.step}`, viewport);
      await expect(page).toHaveURL(new RegExp(`${step.path}$`));
      await expect(page.locator('[data-shell]')).toHaveAttribute('data-shell', 'session');
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('navigation')).toHaveCount(0);

      const steps = page.getByRole('list', { name: 'Seans adımları' });
      await expect(steps.getByRole('listitem')).toHaveCount(5);
      const current = steps.locator('[aria-current="step"]');
      if (step.current === null) {
        await expect(current).toHaveCount(0);
      } else {
        await expect(current).toHaveText(step.current);
      }

      // Phones count the steps; wider screens name them instead.
      const counter = page.getByText(step.counter, { exact: true });
      if (viewport === 'telefon') {
        await expect(counter).toBeVisible();
      } else {
        await expect(counter).toBeHidden();
      }

      await expect(page.getByRole('img', { name: 'Tıkır' })).toBeVisible();
      if (step.current === null) {
        // G7: the session is over, the exit leaves without asking.
        const exit = page.getByRole('link', { name: 'Seanstan çık' }).filter({ visible: true });
        await expect(exit).toHaveCount(1);
        await expect(exit).toHaveAttribute('href', '/');
      } else {
        // The exit asks first (docs/ekranlar.md, "Günlük seans").
        const exit = page.getByRole('button', { name: 'Seanstan çık' }).filter({ visible: true });
        await expect(exit).toHaveCount(1);
        await exit.click();
        const dialog = page.getByRole('dialog', { name: 'Seanstan çıkılsın mı?' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Seansa dön' }).click();
        await expect(dialog).toBeHidden();
      }
    }
  });
}

const focusRoutes = [
  {
    path: '/kitaplik/kur',
    title: 'Kitabını kur',
    subtitle: 'Her sıradan bir kart seç.',
    back: '/kitaplik',
  },
  {
    path: '/kitaplik/ornek/hazir',
    title: 'Kitabın hazır',
    subtitle: 'Denetimden geçti, okunmaya hazır.',
    back: '/kitaplik',
  },
];

for (const route of focusRoutes) {
  test(`${route.path} opens in the focus shell with its title`, async ({ page }) => {
    for (const viewport of ['telefon', 'tablet', 'web'] as const) {
      await open(page, route.path, viewport);
      await expect(page.locator('[data-shell]')).toHaveAttribute('data-shell', 'focus');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.title);
      await expect(page.getByRole('link', { name: 'Geri dön' })).toHaveAttribute(
        'href',
        route.back,
      );

      const subtitle = page.getByText(route.subtitle, { exact: true });
      const libraryLink = page.getByRole('link', { name: 'Kitaplık' });
      if (viewport === 'telefon') {
        await expect(subtitle).toBeHidden();
      } else {
        await expect(subtitle).toBeVisible();
      }
      if (viewport === 'web') {
        await expect(libraryLink).toHaveAttribute('href', '/kitaplik');
      } else {
        await expect(libraryLink).toBeHidden();
      }
    }
  });
}

// Each step opens with the developer parameter that prepares it: the setup opens only its
// current step (docs/planlar/faz-3.md, karar 4).
const onboardingSteps = [
  { path: '/kurulum/hesap?kurulum=hesap', step: 1 },
  { path: '/kurulum/okuyucu?kurulum=okuyucu', step: 2 },
  { path: '/kurulum/seviye?kurulum=seviye', step: 3 },
  { path: '/kurulum/tanisma?kurulum=tanisma', step: 4 },
];

for (const route of onboardingSteps) {
  test(`${route.path} opens in the onboarding shell at step ${String(route.step)}`, async ({
    page,
  }) => {
    for (const viewport of ['telefon', 'tablet', 'web'] as const) {
      await open(page, route.path, viewport);
      await expect(page.locator('[data-shell]')).toHaveAttribute('data-shell', 'onboarding');
      await expect(page.getByRole('main')).toHaveCount(1);

      const progress = page.getByRole('list', {
        name: `Kurulum adımı ${String(route.step)} / 4`,
      });
      await expect(progress.getByRole('listitem')).toHaveCount(4);
      await expect(page.getByText(`${String(route.step)} / 4`, { exact: true })).toBeVisible();

      // The cobalt panel with Tıkır shows from 1000 px only (docs/planlar/faz-3.md, yanıt 7).
      const panelCompanion = page
        .locator('[data-pane="panel"]')
        .getByRole('img', { name: 'Tıkır' });
      if (viewport === 'telefon') {
        await expect(panelCompanion).toBeHidden();
      } else {
        await expect(panelCompanion).toBeVisible();
      }
      // K4 telefon draws Tıkır and his words at the head of the content instead.
      const contentCompanion = page
        .locator('[data-pane="main"]')
        .getByRole('img', { name: 'Tıkır' });
      if (viewport === 'telefon' && route.step === 4) {
        await expect(contentCompanion).toBeVisible();
      } else {
        await expect(contentCompanion).toBeHidden();
      }
    }
  });
}

test('a portrait tablet opens the setup in the phone layout, full width', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/kurulum/hesap?kurulum=hesap');
  const pane = page.locator('[data-shell="onboarding"] [data-pane="main"]');
  await expect(pane).toBeVisible();

  await expect(page.getByRole('img', { name: 'Tıkır' })).toBeHidden();
  expect((await pane.boundingBox())?.width).toBe(768);
});

test('the child and parent areas lead to each other at every width', async ({ page }) => {
  // The sidebar's and the rail's foot links (docs/planlar/faz-3.md, karar 27).
  for (const viewport of ['web', 'tablet'] as const) {
    await open(page, '/', viewport);
    await expect(
      page
        .getByRole('navigation', { name: 'Ana gezinme' })
        .getByRole('link', { name: 'Veli alanı' }),
    ).toHaveAttribute('href', '/veli');
    await open(page, '/veli', viewport);
    await expect(
      page
        .getByRole('navigation', { name: 'Veli gezinmesi' })
        .getByRole('link', { name: 'Çocuk ekranı' }),
    ).toHaveAttribute('href', '/');
  }

  // Phones: the road's lock button, then the parent strip's button back.
  await open(page, '/', 'telefon');
  await page.getByRole('main').getByRole('link', { name: 'Veli alanı' }).click();
  await passParentGate(page);
  const back = page.getByRole('link', { name: 'Çocuk ekranı' });
  await expect(back).toHaveCount(1);
  await back.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-shell]')).toHaveAttribute('data-shell', 'child');
});

test('the account page opens from the rail, the sidebar and the phone strip', async ({ page }) => {
  // docs/planlar/faz-4.md, karar 37: above "Çocuk ekranı" at the foot, beside it on the strip.
  for (const viewport of ['web', 'tablet'] as const) {
    await open(page, '/veli', viewport);
    const account = page
      .getByRole('navigation', { name: 'Veli gezinmesi' })
      .getByRole('link', { name: 'Hesap' });
    await expect(account).toBeVisible();
    await account.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Hesap' })).toBeVisible();
  }

  await open(page, '/veli', 'telefon');
  const button = page.getByRole('link', { name: 'Hesap' });
  await expect(button).toHaveCount(1);
  await button.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Hesap' })).toBeVisible();
});

// docs/tasarim-sistemi.md, "Ek kurallar": a two-pane layout stacks when its content is narrower
// than 720 px. The widths between the design sizes are where this shows (700 px is the smallest
// two-pane width, 768 and 820 px are portrait tablets).
const twoPaneShells = [
  { path: '/seans/oku', shell: 'session' },
  { path: '/kitaplik/kur', shell: 'focus' },
  { path: '/kurulum/hesap', shell: 'onboarding' },
] as const;

for (const route of twoPaneShells) {
  for (const width of [700, 768, 820, 1180]) {
    test(`${route.path} stacks its panes only below 720 px of content (${String(width)} px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(
        route.path === '/seans/oku'
          ? `${route.path}?demo=cocuk-sabahi&adim=read-1`
          : withDemo(route.path),
      );
      if (route.path === '/seans/oku') {
        // G4 draws its controls when Tıkır's voice is ready, in a new pane: measure that one.
        await expect(page.getByText('1. okuma / 3')).toBeVisible();
      }
      const pane = page.locator(`[data-shell="${route.shell}"] [data-pane="main"]`);
      await expect(pane).toBeAttached();

      const { paneWidth, contentWidth, overflow } = await pane.evaluate((element) => {
        const layout = element.parentElement ?? element;
        const style = getComputedStyle(layout);
        return {
          paneWidth: element.getBoundingClientRect().width,
          contentWidth:
            layout.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(overflow).toBe(0);
      // The setup has its panel from 1000 px only (docs/planlar/faz-3.md, yanıt 7).
      if (contentWidth < 720 || (route.shell === 'onboarding' && width < 1000)) {
        expect(
          Math.abs(paneWidth - contentWidth),
          'stacked: the main pane is full width',
        ).toBeLessThan(1);
      } else {
        expect(paneWidth, 'side by side: the main pane shares the width').toBeLessThan(
          contentWidth - 1,
        );
      }
    });
  }
}
