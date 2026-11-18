import styles from './Switch.module.css';

interface SwitchProps {
  /** Visible text of the row; also the switch's accessible name. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** A full-width setting row with a 62 × 34 track that turns turquoise when on (V4). */
export function Switch({ label, checked, onChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={[styles.row, className ?? ''].filter(Boolean).join(' ')}
      onClick={() => {
        onChange(!checked);
      }}
    >
      <span>{label}</span>
      <span aria-hidden="true" className={styles.track}>
        <span className={styles.knob} />
      </span>
    </button>
  );
}
