import { Icon } from '../../components/Icon/Icon';
import styles from './RaceBar.module.css';

interface RaceBarProps {
  /** How far the child is through the reading, 0–1. */
  progress: number;
  /** Where yesterday's reading is, 0–1; null on the first day (no ghost is drawn). */
  ghost?: number | null;
  /** "sen" */
  youLabel: string;
  /** "dün" */
  ghostLabel: string;
  className?: string;
}

function percent(value: number): string {
  return `${String(Math.round(Math.min(Math.max(value, 0), 1) * 1000) / 10)}%`;
}

/**
 * The ghost race (G4): the child's saffron marker and, from the second day on, yesterday's
 * dashed marker on one track, with the finish flag at the end. The race sentence that goes
 * with it belongs to the screen (it must never show a negative difference).
 */
export function RaceBar({ progress, ghost = null, youLabel, ghostLabel, className }: RaceBarProps) {
  return (
    <div className={[styles.race, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.track}>
        <div className={styles.rail}>
          <div className={styles.fill} data-part="fill" style={{ width: percent(progress) }} />
        </div>
        {ghost !== null && (
          <div className={styles.marker} style={{ left: percent(ghost) }}>
            <span className={styles.ghostDot} />
            <span className={styles.ghostLabel}>{ghostLabel}</span>
          </div>
        )}
        <div className={styles.marker} style={{ left: percent(progress) }}>
          <span className={styles.youDot} />
          <span className={styles.youLabel}>{youLabel}</span>
        </div>
      </div>
      <span className={styles.flag}>
        <Icon name="flag" size={22} />
      </span>
    </div>
  );
}
