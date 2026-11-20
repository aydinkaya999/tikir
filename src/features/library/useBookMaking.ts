// Making a book (docs/planlar/faz-5.md, kararlar 16–17, 20 and 29): U3, U2 and U4's "Yeniden üret".
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Book } from '../../domain/types';
import { useSessionStore } from '../session/sessionContext';
import { bookReadyPath } from './paths';

export interface BookMaking {
  /** The book is being made: the page shows the wait (BookGenerating). */
  making: boolean;
  /**
   * Makes the book with the generator's call, saves it and opens it ready (U4); a second call
   * while one is making is ignored. `open: false` stays on the page (U4 makes its book again).
   */
  make: (produce: (signal: AbortSignal) => Promise<Book>, options?: { open?: boolean }) => void;
  /** "Vazgeç": the book is given up and nothing is saved. */
  cancel: () => void;
}

export function useBookMaking(): BookMaking {
  const store = useSessionStore();
  const navigate = useNavigate();
  const [making, setMaking] = useState(false);
  const current = useRef<AbortController | null>(null);
  // Leaving the page gives the book up: nothing is saved (review focus 3).
  useEffect(
    () => () => {
      current.current?.abort();
      current.current = null;
    },
    [],
  );

  const cancel = () => {
    current.current?.abort();
    current.current = null;
    setMaking(false);
  };

  const make: BookMaking['make'] = (produce, { open = true } = {}) => {
    if (current.current !== null) {
      return;
    }
    const control = new AbortController();
    // Read anew after each wait: the book may be given up while it is saved.
    const givenUp = () => control.signal.aborted;
    current.current = control;
    setMaking(true);
    produce(control.signal)
      .then(async (book) => {
        if (givenUp()) {
          return;
        }
        await store.getState().saveBook(book);
        if (open && !givenUp()) {
          void navigate(bookReadyPath(book.id));
        }
      })
      // Given up ("Vazgeç", or the page was left): nothing is saved. The mock fails no other way;
      // the backend's failures come with it (phase 6).
      .catch(() => undefined)
      .finally(() => {
        if (current.current === control) {
          current.current = null;
          setMaking(false);
        }
      });
  };

  return { making, make, cancel };
}
