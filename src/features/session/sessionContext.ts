// The session's store and devices for the screens (docs/planlar/faz-2b.md, Task 7). The router
// provides them, so the screens never import src/app. A .ts file: react-refresh wants components
// and other exports in separate files.
import { createContext, useContext, useEffect } from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { Attempt } from '../../domain/types';
import type { AudioCapture } from '../../services/audio/AudioCapture';
import type { ManualMark } from '../../services/listener/FakeListener';
import type { ReadingListener } from '../../services/listener/types';
import type { Narrator } from '../../services/narrator/Narrator';
import type { Recorder } from '../../services/recorder/Recorder';
import type { PageLayout } from '../reading/pages';
import type { SessionState } from './sessionStore';

/** What a listener follows: a warmup word, a session reading or K3's level check. */
export type ListenerKind = 'warmup' | 'reading' | 'assessment';

/** A listener for one reading; mark() is there in the manual mode (developer builds). */
export interface ListenerChoice {
  listener: ReadingListener;
  mark?: (mark: ManualMark) => void;
}

export interface SessionDevices {
  /** The session's one microphone (docs/kararlar.md T22). */
  audio: AudioCapture;
  /** One narrator per page; the first call creates it. */
  narrator: () => Promise<Narrator>;
  recorder: Recorder;
  /**
   * A new listener for each warmup word, each reading and the level check (a new listener is a new
   * reading).
   */
  listener: (kind: ListenerKind, attempt: Attempt) => ListenerChoice;
  /** The scenario set's fixed ghost pace and page layout (the design scenario, D12). */
  scenario: { ghostWpm: number | null; layout: PageLayout };
  /** The source of G6's shuffles; tests give a fixed one. */
  random: () => number;
}

export interface SessionContextValue {
  store: StoreApi<SessionState>;
  devices: SessionDevices;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

function useSessionContext(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('A session screen must be inside a SessionProvider.');
  }
  return value;
}

export function useSessionStore(): StoreApi<SessionState> {
  return useSessionContext().store;
}

export function useSession<T>(selector: (state: SessionState) => T): T {
  return useStore(useSessionContext().store, selector);
}

export function useSessionDevices(): SessionDevices {
  return useSessionContext().devices;
}

/** Loads the session once, for the screens outside the session shell (G1, Albüm, Stüdyo). */
export function useLoadSession(): void {
  const status = useSession((state) => state.status);
  const load = useSession((state) => state.load);
  useEffect(() => {
    if (status === 'idle') {
      void load();
    }
  }, [status, load]);
}
