// Route table (docs/ekranlar.md, "Rotalar"). Screen codes are the keys the docs and the design
// files use, so a path can always be traced back to its screen.
import { onboardingPaths } from '../features/onboarding/paths';
import { parentPaths } from '../features/parent/paths';
import { childPaths, sessionPaths } from '../features/session/paths';

export const screenPaths = {
  G1: childPaths.road,
  G2: sessionPaths.warmup,
  G3: sessionPaths.listen,
  G4: sessionPaths.read,
  G5: sessionPaths.record,
  G6: sessionPaths.wrapUp,
  G7: sessionPaths.done,
  K1: onboardingPaths.account,
  K2: onboardingPaths.reader,
  K3: onboardingPaths.level,
  K4: onboardingPaths.meet,
  U1: childPaths.library,
  U2: parentPaths.books,
  U3: '/kitaplik/kur',
  U4: '/kitaplik/:bookId/hazir',
  V1: parentPaths.summary,
  V2: parentPaths.stuckWords,
  V3: parentPaths.assessment,
  V4: parentPaths.readingStyle,
} as const;

export type ScreenCode = keyof typeof screenPaths;

/** Child tabs without a design yet (docs/ekranlar.md, "Tasarımı olmayan durumlar"). */
export const extraPaths = {
  album: childPaths.album,
  studio: childPaths.studio,
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
