import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs without globals, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup();
});

// jsdom has no modal dialogs: here showModal() and close() only toggle the open attribute (and
// close() fires the close event a browser fires).
if (typeof HTMLDialogElement !== 'undefined') {
  const dialog: Partial<HTMLDialogElement> = HTMLDialogElement.prototype;
  if (dialog.showModal === undefined) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (dialog.close === undefined) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      if (this.hasAttribute('open')) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      }
    };
  }
}
