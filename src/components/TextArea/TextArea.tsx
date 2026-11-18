import { useId } from 'react';
import styles from './TextArea.module.css';

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown at the end of the label row, e.g. the live word count (U2). */
  hint?: string;
  placeholder?: string;
  name?: string;
  className?: string;
}

/** A labelled multi-line field (U2): 142 px tall on phones, 190 px from 700 px. */
export function TextArea({
  label,
  value,
  onChange,
  hint,
  placeholder,
  name,
  className,
}: TextAreaProps) {
  const id = useId();
  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {hint !== undefined && <p className={styles.hint}>{hint}</p>}
      </div>
      <textarea
        id={id}
        className={styles.input}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </div>
  );
}
