// Wraps every product route: the session's store and devices, and the microphone rule
// (docs/kararlar.md T22) — when the address is not a listening step the microphone closes. The rule
// runs on address changes only, never on a re-render or StrictMode's second mount, so a microphone
// opened by the tap that led into a listening step stays open there.
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import type { StoreApi } from 'zustand/vanilla';
import { listeningPaths } from './paths';
import type { SessionDevices } from './sessionContext';
import { SessionProvider } from './SessionProvider';
import type { SessionState } from './sessionStore';

interface SessionRootProps {
  store: StoreApi<SessionState>;
  devices: SessionDevices;
}

export function SessionRoot({ store, devices }: SessionRootProps) {
  const { pathname } = useLocation();
  const { audio } = devices;

  useEffect(() => {
    if (!listeningPaths.includes(pathname)) {
      void audio.stop();
    }
  }, [audio, pathname]);

  return (
    <SessionProvider store={store} devices={devices}>
      <Outlet />
    </SessionProvider>
  );
}
