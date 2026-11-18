import { screenPaths } from './routes';

/** The five tiled steps of the daily session (docs/urun.md, section 3; glossary names). */
export const sessionSteps = [
  { key: 'warmup', path: screenPaths.G2 },
  { key: 'listen', path: screenPaths.G3 },
  { key: 'read', path: screenPaths.G4 },
  { key: 'record', path: screenPaths.G5 },
  { key: 'wrapUp', path: screenPaths.G6 },
] as const;

export type SessionStepKey = (typeof sessionSteps)[number]['key'];

/**
 * Where a session path sits: `current` is the tile index (null on G7, where every step is
 * done) and `number` is the phone counter's "N / 5".
 */
export function sessionStepAt(pathname: string): { current: number | null; number: number } {
  const index = sessionSteps.findIndex((step) => step.path === pathname);
  if (index === -1) {
    return { current: null, number: sessionSteps.length };
  }
  return { current: index, number: index + 1 };
}
