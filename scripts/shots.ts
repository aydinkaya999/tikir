// pnpm shots <route> [<route> ...]
// Screenshots of each route at the three design sizes, written to shots/ for side-by-side
// comparison with design/png (same 1x pixel ratio as the design exports).
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const devices = [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'tablet', width: 1180, height: 820 },
  { name: 'web', width: 1440, height: 900 },
] as const;

const routes = process.argv.slice(2).filter((arg) => arg !== '--');
if (routes.length === 0 || routes.some((route) => !route.startsWith('/'))) {
  console.error('Usage: pnpm shots <route> [<route> ...]  (every route starts with "/")');
  process.exit(1);
}

function fileStem(route: string): string {
  const stem = route
    .replace(/^\/+/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return stem === '' ? 'index' : stem;
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

const browser = await chromium.launch();
try {
  for (const route of routes) {
    for (const device of devices) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.goto(new URL(route, baseUrl).href, { waitUntil: 'networkidle' });
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
