import { type Ref, useId } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  inputMode?: 'text' | 'email' | 'numeric';
  placeholder?: string;
  autoComplete?: string;
  name?: string;
  /** A line under the field that helps fill it. */
  hint?: string;
  /** What is wrong with the value; the field is then marked invalid (K1, K2, the parent gate). */
  error?: string;
  disabled?: boolean;
  ref?: Ref<HTMLInputElement>;
  className?: string;
}

/** A labelled single-line field (K1). Its hint and its error describe it to screen readers. */
export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder,
  autoComplete,
  name,
  hint,
  error,
  disabled,
  ref,
  className,
}: TextFieldProps) {
  const id = useId();
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint === undefined ? '' : hintId, error === undefined ? '' : errorId]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={styles.input}
        type={type}
        inputMode={inputMode}
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {hint !== undefined && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
