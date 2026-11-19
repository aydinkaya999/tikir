// The app shell for the phase 1 audio trial (docs/kararlar.md T19). The same web code, built in
// the `cap` mode so the developer pages are included: pnpm cap:sync. The `cap` build opens on
// the audio lab (src/appShellStart.ts). server.appStartPath cannot do it: Capacitor iOS reads it
// as a file in the web directory and stops when there is none.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tikir.app',
  appName: 'Tıkır',
  webDir: 'dist-cap',
};

export default config;
