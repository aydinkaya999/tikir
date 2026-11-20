import { useEffect } from 'react';
import { useSessionStore } from './sessionContext';

/** How often an open page checks whether the day has changed. */
const dayCheckMs = 60_000;

/** A page left open past midnight turns to the new day (G1, U1): the day's data is read again. */
export function useDayRefresh(): void {
  const store = useSessionStore();
  useEffect(() => {
    const refresh = () => {
      store
        .getState()
        .refreshDay()
        .catch(() => undefined);
    };
    refresh();
    const timer = setInterval(refresh, dayCheckMs);
    return () => {
      clearInterval(timer);
    };
  }, [store]);
}
