// The page's narrator, once the device's voices are known (createNarrator waits for them).
import { useEffect, useState } from 'react';
import type { Narrator } from '../../services/narrator/Narrator';
import { useSessionDevices } from './sessionContext';

export function useNarrator(): Narrator | null {
  const { narrator } = useSessionDevices();
  const [value, setValue] = useState<Narrator | null>(null);
  useEffect(() => {
    let current = true;
    void narrator().then((ready) => {
      if (current) {
        setValue(ready);
      }
    });
    return () => {
      current = false;
    };
  }, [narrator]);
  return value;
}
