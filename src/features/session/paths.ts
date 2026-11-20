// Addresses of the child's screens and of the session steps (docs/ekranlar.md, "Rotalar"). The
// screens navigate with these; src/app/routes.ts builds its route table from them, so features
// never import src/app.
import type { SessionStep } from '../../domain/types';
import { onboardingPaths } from '../onboarding/paths';

export const childPaths = {
  road: '/',
  library: '/kitaplik',
  album: '/album',
  studio: '/studyo',
} as const;

export const sessionPaths = {
  warmup: '/seans/isinma',
  listen: '/seans/dinle',
  read: '/seans/oku',
  record: '/seans/kayit',
  wrapUp: '/seans/kapanis',
  done: '/seans/bitti',
} as const satisfies Record<SessionStep, string>;

/** The steps that listen to the child: the microphone may stay open only here (T22). */
export const listeningPaths: readonly string[] = [
  sessionPaths.warmup,
  sessionPaths.read,
  onboardingPaths.level,
];
