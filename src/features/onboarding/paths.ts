// The setup's addresses (docs/ekranlar.md, "Rotalar"; docs/planlar/faz-3.md, kararlar 4 ve 8):
// src/app/routes.ts builds its route table from them, so features never import src/app.
import type { SetupData, SetupPlace } from '../session/sessionStore';

export const onboardingPaths: Readonly<Record<SetupPlace, string>> = {
  account: '/kurulum/hesap',
  reader: '/kurulum/okuyucu',
  level: '/kurulum/seviye',
  meet: '/kurulum/tanisma',
};

const setupAddresses = new Set(Object.values(onboardingPaths));

/**
 * Where an address goes for the setup (docs/planlar/faz-3.md, karar 4): while setting up, every
 * address but the current step goes to it; once the setup is done, its addresses go to the road.
 */
export function setupRedirect(setup: SetupData | null, pathname: string): string | null {
  if (setup === null) {
    return setupAddresses.has(pathname) ? '/' : null;
  }
  const current = onboardingPaths[setup.step];
  return pathname === current ? null : current;
}
