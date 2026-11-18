import { useId, type ReactNode } from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}

/** A native checkbox in cobalt with its label beside it; the whole row is the hit area (K1). */
export function Checkbox({ label, checked, onChange, name, disabled, className }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={[styles.row, className ?? ''].filter(Boolean).join(' ')}>
      <input
        id={id}
        className={styles.box}
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      <span className={styles.text}>{label}</span>
    </label>
  );
}
