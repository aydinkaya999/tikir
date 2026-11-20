// A list of recordings with their actions: V2's approvals (listen, approve, delete) and the
// account page (listen, delete). Deleting asks first (docs/planlar/faz-4.md, D17). TODO(design)
import { useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Dialog } from '../../components/Dialog/Dialog';
import type { Id } from '../../domain/types';
import { tr } from '../../i18n/tr';
import styles from './RecordingList.module.css';
import type { RecordingRow } from './views';

const copy = tr.report.recordings;

interface RecordingListProps {
  title: string;
  rows: readonly RecordingRow[];
  onPlay: (id: Id) => void;
  /** V2 only: the parent approves a recording the child sent. */
  onApprove?: (id: Id) => void;
  onRemove: (id: Id) => void;
  /** Shown instead of the list when there is no recording. */
  empty?: string;
  /** The recording playing now: its "Dinle" becomes "Duraklat", which stops it (G5's pair). */
  playingId?: Id | null;
  onStop?: () => void;
}

export function RecordingList({
  title,
  rows,
  onPlay,
  onApprove,
  onRemove,
  empty,
  playingId = null,
  onStop,
}: RecordingListProps) {
  const titleId = useId();
  const [removing, setRemoving] = useState<Id | null>(null);
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {rows.length === 0 && empty !== undefined && <p className={styles.empty}>{empty}</p>}
      <ul className={styles.list} aria-labelledby={titleId} hidden={rows.length === 0}>
        {rows.map((row) => (
          <li key={row.id} className={styles.row}>
            <span className={styles.text}>
              <span className={styles.label}>{row.label}</span>
              <span className={styles.duration}>{row.duration}</span>
            </span>
            <span className={styles.actions}>
              {row.id === playingId ? (
                <Button variant="secondary" icon="pause" onClick={onStop}>
                  {tr.record.pause}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  icon="play"
                  onClick={() => {
                    onPlay(row.id);
                  }}
                >
                  {copy.listen}
                </Button>
              )}
              {onApprove !== undefined && (
                <Button
                  icon="check"
                  onClick={() => {
                    onApprove(row.id);
                  }}
                >
                  {copy.approve}
                </Button>
              )}
              <Button
                variant="secondary"
                icon="x"
                onClick={() => {
                  setRemoving(row.id);
                }}
              >
                {copy.remove}
              </Button>
            </span>
          </li>
        ))}
      </ul>
      <Dialog
        open={removing !== null}
        title={copy.removeDialog.title}
        onClose={() => {
          setRemoving(null);
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRemoving(null);
              }}
            >
              {copy.removeDialog.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (removing !== null) {
                  onRemove(removing);
                }
                setRemoving(null);
              }}
            >
              {copy.removeDialog.confirm}
            </Button>
          </>
        }
      >
        <p className={styles.dialogText}>{copy.removeDialog.body}</p>
      </Dialog>
    </section>
  );
}
