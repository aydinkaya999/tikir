// Starting the day with a library book (docs/planlar/faz-5.md, kararlar 12 and 28): U1's book
// cards and U4's "Okumaya başla".
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Id } from '../../domain/types';
import { useMicrophone } from '../reading/useMicrophone';
import { sessionPaths } from '../session/paths';
import { useSession, useSessionDevices, useSessionStore } from '../session/sessionContext';
import { sessionListens } from '../session/views';

export interface ReadBook {
  /** Starts today's session with the book, or resumes the one that reads it, at its step. */
  read: (bookId: Id) => void;
  /** The session is starting: the taps wait. */
  starting: boolean;
}

export function useReadBook(): ReadBook {
  const data = useSession((state) => state.data);
  const store = useSessionStore();
  const { audio } = useSessionDevices();
  const microphone = useMicrophone(audio, data === null ? false : sessionListens(data));
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  // The tap that leads into a listening step opens the microphone, as G1's "Başla" and "Sürdür"
  // do (docs/kararlar.md T22): a new session opens with its warmup.
  const read = (bookId: Id) => {
    const step = data?.session?.step ?? 'warmup';
    if (step === 'warmup' || step === 'read') {
      microphone.start();
    }
    setStarting(true);
    store
      .getState()
      .startWithBook(bookId)
      .then(() => {
        const session = store.getState().data?.session;
        if (session !== undefined && session !== null) {
          void navigate(sessionPaths[session.step]);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setStarting(false);
      });
  };

  return { read, starting };
}
