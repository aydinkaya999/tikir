import { describe, expect, it } from 'vitest';
import type { SetupData } from '../session/sessionStore';
import { onboardingPaths, setupRedirect } from './paths';

function setupAt(step: SetupData['step']): SetupData {
  return { step, parent: null, child: null, passage: null, baseline: null, today: '2026-11-21' };
}

describe('setupRedirect', () => {
  it('sends every address but the current step to it while setting up', () => {
    expect(setupRedirect(setupAt('reader'), '/')).toBe('/kurulum/okuyucu');
    expect(setupRedirect(setupAt('reader'), '/kurulum/hesap')).toBe('/kurulum/okuyucu');
    expect(setupRedirect(setupAt('reader'), '/kurulum/okuyucu')).toBeNull();
  });

  it('sends the setup addresses to the road once the setup is done', () => {
    for (const path of Object.values(onboardingPaths)) {
      expect(setupRedirect(null, path)).toBe('/');
    }
    expect(setupRedirect(null, '/seans/oku')).toBeNull();
  });
});
