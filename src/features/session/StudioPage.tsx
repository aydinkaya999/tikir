// The studio tab (docs/planlar/faz-2b.md, karar 18): the series' recorded chapters, the child's
// audio book, each to play. TODO(design): the studio is not drawn.
import { IconButton } from '../../components/IconButton/IconButton';
import type { Id } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { EmptyTab } from './EmptyTab';
import { formatClock } from './format';
import { usePlayback, useRecording } from './playback';
import { useLoadSession, useSession, useSessionDevices } from './sessionContext';
import { StatusScreen } from './StatusScreen';
import styles from './TabPage.module.css';
import { studioRows } from './views';

export function StudioPage() {
  useLoadSession();
  const status = useSession((state) => state.status);
  const data = useSession((state) => state.data);

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen kind="loading" />;
  }
  if (status === 'error') {
    return <StatusScreen kind="error" />;
  }
  if (data === null) {
    // The setup guard opens the setup before a profile exists.
    return null;
  }
  const rows = studioRows(data);
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{tr.nav.child.studio}</h1>
      {rows.length === 0 ? (
        <EmptyTab text={tr.studio.empty} back={tr.studio.back} />
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <StudioRecording key={row.chapter} title={row.title} recordingId={row.recordingId} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** A recorded chapter: G5's title, its time and play or pause; one plays at a time. */
function StudioRecording({ title, recordingId }: { title: string; recordingId: Id }) {
  const { recorder } = useSessionDevices();
  const recording = useRecording(recorder, recordingId);
  const playback = usePlayback(recorder);

  return (
    <li className={styles.row}>
      {recording && (
        <IconButton
          icon={playback.playing ? 'pause' : 'play'}
          label={playback.playing ? tr.record.pause : tr.record.play}
          size={52}
          tone="saffron"
          onClick={() => {
            if (playback.playing) {
              playback.stop();
            } else {
              playback.play(recordingId);
            }
          }}
        />
      )}
      <span className={styles.rowTitle}>{tr.record.title(title)}</span>
      {recording && <span className={styles.time}>{formatClock(recording.seconds * 1000)}</span>}
    </li>
  );
}
