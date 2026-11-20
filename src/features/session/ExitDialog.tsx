import { useEffect, useId, useRef } from 'react';
import { Button } from '../../components/Button/Button';
import { tr } from '../../i18n/tr';
import styles from './ExitDialog.module.css';

interface ExitDialogProps {
  open: boolean;
  /** "Seansa dön", Esc. */
  onStay: () => void;
  /** "Çık": the step is already stored (docs/ekranlar.md, "Günlük seans"). */
  onLeave: () => void;
}

/**
 * "Seanstan çıkılsın mı?" (docs/ekranlar.md, "Günlük seans"). A modal dialog: focus stays inside
 * and goes back to the exit button when it closes. TODO(design): the dialog is not drawn.
 */
export function ExitDialog({ open, onStay, onLeave }: ExitDialogProps) {
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
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} onClose={onStay}>
      <h2 id={titleId} className={styles.title}>
        {tr.session.exitDialog.title}
      </h2>
      <p className={styles.body}>{tr.session.exitDialog.body}</p>
      <div className={styles.buttons}>
        <Button variant="secondary" onClick={onLeave}>
          {tr.session.exitDialog.leave}
        </Button>
        <Button onClick={onStay}>{tr.session.exitDialog.stay}</Button>
      </div>
    </dialog>
  );
}
