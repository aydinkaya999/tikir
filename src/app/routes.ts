// Route table (docs/ekranlar.md, "Rotalar"). Screen codes are the keys the docs and the design
// files use, so a path can always be traced back to its screen.

export const screenPaths = {
  G1: '/',
  G2: '/seans/isinma',
  G3: '/seans/dinle',
  G4: '/seans/oku',
  G5: '/seans/kayit',
  G6: '/seans/kapanis',
  G7: '/seans/bitti',
  K1: '/kurulum/hesap',
  K2: '/kurulum/okuyucu',
  K3: '/kurulum/seviye',
  K4: '/kurulum/tanisma',
  U1: '/kitaplik',
  U2: '/veli/kitap',
  U3: '/kitaplik/kur',
  U4: '/kitaplik/:bookId/hazir',
  V1: '/veli',
  V2: '/veli/takilinan',
  V3: '/veli/olcum',
  V4: '/veli/yazi',
} as const;

export type ScreenCode = keyof typeof screenPaths;

/** Child tabs without a design yet (docs/ekranlar.md, "Tasarımı olmayan durumlar"). */
export const extraPaths = {
  album: '/album',
  studio: '/studyo',
} as const;

/** Developer pages; never part of the production build (src/app/router.tsx). */
export const devPaths = {
  showcase: '/gelistirme/vitrin',
  audio: '/gelistirme/ses',
} as const;

/**
 * Developer endpoints that are not pages: the Vite dev and preview servers forward the echo
 * WebSocket to scripts/echo-server.ts (vite.config.ts). Kept out of devPaths, which tests visit.
 */
export const devEndpoints = {
  echo: '/gelistirme/yanki',
} as const;
