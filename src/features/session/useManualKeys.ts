// The manual listener's keys (docs/dinleme-hatti.md, section 3; developer builds): Space = correct,
// E = misread, S = skipped, H = a three-second pause. An adult plays the listener.
import { useEffect } from 'react';
import { toLowerTr } from '../../domain/text';
import type { ManualMark } from '../../services/listener/FakeListener';
import { onKeyDown } from '../../services/keyboard';

const manualKeys: Readonly<Record<string, ManualMark>> = {
  ' ': 'correct',
  e: 'misread',
  s: 'skipped',
  h: 'hesitate',
};

/** Binds the keys while a manual listener's mark() is given; nothing otherwise. */
export function useManualKeys(mark: ((mark: ManualMark) => void) | undefined): void {
  useEffect(() => {
    if (mark === undefined) {
      return undefined;
    }
    return onKeyDown((press) => {
      const manual = manualKeys[toLowerTr(press.key)];
      if (manual !== undefined) {
        // Space must not also press a focused button.
        press.preventDefault();
        mark(manual);
      }
    });
  }, [mark]);
}
