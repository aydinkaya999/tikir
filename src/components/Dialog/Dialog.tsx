import { type ReactNode, useEffect, useId, useRef } from 'react';
import styles from './Dialog.module.css';

interface DialogProps {
  open: boolean;
  /** The dialog's heading, also its accessible name. */
  title: string;
  /** Escape, or the dialog closing in any other way. */
  onClose: () => void;
  /** The buttons at its foot. */
  actions?: ReactNode;
  /** narrow: a question (420 px); wide: a page of text (760 px). */
  width?: 'narrow' | 'wide';
  className?: string;
  children?: ReactNode;
}

/**
 * A modal dialog on the native `<dialog>`: the browser keeps the focus inside and gives it back to
 * the control that opened it from the keyboard (e2e/showcase.spec.ts). TODO(design): dialogs are not drawn (the exit, K1's voice data, G6's text).
 */
export function Dialog({
  open,
  title,
  onClose,
  actions,
  width = 'narrow',
  className,
  children,
}: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element === null) {
      return;
    }
    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={[styles.dialog, styles[width], className ?? ''].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </dialog>
  );
}
