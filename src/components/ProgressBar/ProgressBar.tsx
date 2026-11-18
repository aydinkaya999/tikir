import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** Accessible name, e.g. "Hikâyedeki ilerleme". */
  label: string;
  value: number;
  max: number;
  className?: string;
}

/** A thin rounded bar filled in turquoise (U1: chapters done out of the series). */
export function ProgressBar({ label, value, max, className }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className={[styles.bar, className ?? ''].filter(Boolean).join(' ')}
    >
      <div className={styles.fill} style={{ width: `${String(percent)}%` }} />
    </div>
  );
}
