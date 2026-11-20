// The page-wide keys (docs/planlar/faz-2b.md, karar 14): Space pauses the reading on G4, and in the
// manual mode an adult marks words from the keyboard. document is reached only from src/services.
import type { Unsubscribe } from './types';

export interface KeyPress {
  key: string;
  /** Focus is on a control that Space already activates (a button, a link, a form field). */
  onControl: boolean;
  preventDefault(): void;
}

const controls = 'button, a[href], input, textarea, select, [contenteditable="true"]';

export function onKeyDown(callback: (press: KeyPress) => void): Unsubscribe {
  const handler = (event: KeyboardEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    callback({
      key: event.key,
      onControl: target?.closest(controls) != null,
      preventDefault: () => {
        event.preventDefault();
      },
    });
  };
  document.addEventListener('keydown', handler);
  return () => {
    document.removeEventListener('keydown', handler);
  };
}
