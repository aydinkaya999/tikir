// pnpm shots [--dokun <ad>] [--bekle <ad>] [--ileri <ms>] <route> [<route> ...]
// Screenshots of each route at the three design sizes, written to shots/ for side-by-side
// comparison with design/png (same 1x pixel ratio as the design exports). The steps run in order
// on every route before the screenshot (docs/planlar/faz-2b.md, karar 22): tap a control by its
// accessible name, wait for one, move the clock. Chromium gets a fake microphone, and the page no
// speech synthesis, so Tıkır's narration is timed silently and follows the clock.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Locator, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { parseShotArgs, type ShotStep, shotUsage } from './shotArgs.ts';

const devices = [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'tablet', width: 1180, height: 820 },
  { name: 'web', width: 1440, height: 900 },
] as const;

let parsed: ReturnType<typeof parseShotArgs>;
try {
  parsed = parseShotArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : shotUsage);
  process.exit(1);
}
const { steps, routes } = parsed;
const movesClock = steps.some((step) => step.kind === 'advance');

function fileStem(route: string): string {
  const stem = route
    .replace(/^\/+/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return stem === '' ? 'index' : stem;
}

/** The first visible control with this accessible name. */
function control(page: Page, name: string): Locator {
  const byRole = (role: 'button' | 'link' | 'radio' | 'checkbox' | 'switch') =>
    page.getByRole(role, { name, exact: true });
  return byRole('button')
    .or(byRole('link'))
    .or(byRole('radio'))
    .or(byRole('checkbox'))
    .or(byRole('switch'))
    .filter({ visible: true })
    .first();
}

async function runStep(page: Page, step: ShotStep): Promise<void> {
  switch (step.kind) {
    case 'tap':
      await control(page, step.name).click();
      break;
    case 'wait':
      await control(page, step.name)
        .or(page.getByText(step.name, { exact: true }).filter({ visible: true }).first())
        .first()
        .waitFor();
      break;
    case 'advance':
      await page.clock.runFor(step.ms);
      break;
  }
}

const outDir = path.resolve('shots');
await mkdir(outDir, { recursive: true });

const server = await createServer({ server: { port: 5199 }, logLevel: 'error' });
await server.listen();
const baseUrl = server.resolvedUrls?.local[0];
if (baseUrl === undefined) {
  await server.close();
  throw new Error('The Vite dev server did not report a local URL.');
}

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
try {
  for (const route of routes) {
    for (const device of devices) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: 1,
        permissions: ['microphone'],
      });
      await context.addInitScript(() => {
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
      });
      const page = await context.newPage();
      if (movesClock) {
        // Installed before the page and paused once it has loaded, as Playwright advises: a clock
        // paused while the page loads can hold the page up. From then on only --ileri moves it.
        await page.clock.install();
      }
      await page.goto(new URL(route, baseUrl).href, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      if (movesClock) {
        const now = await page.evaluate(() => Date.now());
        await page.clock.pauseAt(now + 1);
      }
      for (const step of steps) {
        await runStep(page, step);
      }
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const file = path.join(outDir, `${fileStem(route)}-${device.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(path.relative(process.cwd(), file));
      await context.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
