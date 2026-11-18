// The app shell for the phase 1 audio trial (docs/kararlar.md T19). The same web code, built in
// the `cap` mode so the developer pages are included: pnpm cap:sync.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tikir.app',
  appName: 'Tıkır',
  webDir: 'dist-cap',
  server: {
    // Trial only: the app opens straight on the audio lab. Phase 7 removes this.
    appStartPath: '/gelistirme/ses',
  },
};

export default config;
