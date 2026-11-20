import { Button } from '../../components/Button/Button';
import { Dialog } from '../../components/Dialog/Dialog';
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
  return (
    <Dialog
      open={open}
      title={tr.session.exitDialog.title}
      onClose={onStay}
      actions={
        <>
          <Button variant="secondary" onClick={onLeave}>
            {tr.session.exitDialog.leave}
          </Button>
          <Button onClick={onStay}>{tr.session.exitDialog.stay}</Button>
        </>
      }
    >
      <p className={styles.body}>{tr.session.exitDialog.body}</p>
    </Dialog>
  );
}
