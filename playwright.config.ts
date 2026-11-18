import { defineConfig, devices } from '@playwright/test';
import { toneFile } from './e2e/support/tone';
import { echoServerPort } from './scripts/echo-server';

const port = 4317;

// Chromium's fake microphone plays a 440 Hz tone and grants the permission without a prompt
// (the global setup writes the tone file). WebKit's mock device needs the `microphone` permission,
// which e2e/audio-lab.spec.ts grants.
const chromiumMicrophone = {
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${toneFile}`,
    ],
  },
};

// The suite runs against a production-like build in the `e2e` mode, which keeps the
// developer routes (they exist whenever import.meta.env.MODE is not 'production').
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  globalSetup: './e2e/support/global-setup.ts',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...chromiumMicrophone } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // E2E_CHROME=1 pnpm e2e e2e/audio-lab.spec.ts --project=chrome: the installed Google Chrome.
    ...(process.env.E2E_CHROME === '1'
      ? [
          {
            name: 'chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome', ...chromiumMicrophone },
          },
        ]
      : []),
  ],
  webServer: [
    {
      command: `vite build --mode e2e --outDir dist-e2e && vite preview --mode e2e --outDir dist-e2e --port ${port} --strictPort`,
      url: `http://localhost:${port}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    // The audio lab's echo test; the preview server forwards /gelistirme/yanki to it. A running
    // `pnpm echo-server` or `pnpm audio-trial` is reused: the server keeps no state.
    {
      command: 'node scripts/echo-server.ts',
      url: `http://127.0.0.1:${String(echoServerPort)}`,
      reuseExistingServer: true,
    },
  ],
});
