import { type ReactNode, useMemo } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { SessionContext, type SessionDevices } from './sessionContext';
import type { SessionState } from './sessionStore';

interface SessionProviderProps {
  store: StoreApi<SessionState>;
  devices: SessionDevices;
  children: ReactNode;
}

export function SessionProvider({ store, devices, children }: SessionProviderProps) {
  const value = useMemo(() => ({ store, devices }), [store, devices]);
  return <SessionContext value={value}>{children}</SessionContext>;
}
