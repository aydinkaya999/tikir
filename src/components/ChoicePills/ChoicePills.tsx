import { useId } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './ChoicePills.module.css';

export interface ChoicePillOption<T extends string> {
  value: T;
  label: string;
}

interface ChoicePillsProps<T extends string> {
  /** Visible label above the pills; also the group's accessible name. */
  label: string;
  options: readonly ChoicePillOption<T>[];
  /** single: one choice, a radio group; multiple: toggles, at most `max`. */
  mode: 'single' | 'multiple';
  value: readonly T[];
  onChange: (value: T[]) => void;
  max?: number;
  /** Beside the label: "3 / 3 seçildi". */
  counter?: string;
  error?: string;
  className?: string;
}

/**
 * K2's rounded choices (docs/kararlar.md, question 9; U2 too): 48 px pills that turn saffron with a
 * check when chosen. One choice is a real radio group, so the arrow keys move it; several are
 * pressed toggles, and once `max` are pressed the others refuse.
 */
export function ChoicePills<T extends string>({
  label,
  options,
  mode,
  value,
  onChange,
  max,
  counter,
  error,
  className,
}: ChoicePillsProps<T>) {
  const labelId = useId();
  const errorId = useId();
  const name = useId();
  const full = max !== undefined && value.length >= max;
  const describedBy = error === undefined ? undefined : errorId;

  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.head}>
        <p id={labelId} className={styles.label}>
          {label}
        </p>
        {counter !== undefined && <p className={styles.counter}>{counter}</p>}
      </div>
      {mode === 'single' ? (
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          className={styles.pills}
        >
          {options.map((option) => {
            const chosen = value.includes(option.value);
            return (
              <label key={option.value} className={styles.choice}>
                <input
                  className={styles.input}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={chosen}
                  onChange={() => {
                    onChange([option.value]);
                  }}
                />
                <span className={styles.pill}>
                  {chosen && <Icon name="check" size={16} strokeWidth={3} />}
                  <span>{option.label}</span>
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <div
          role="group"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          className={styles.pills}
        >
          {options.map((option) => {
            const chosen = value.includes(option.value);
            const refused = full && !chosen;
            return (
              <button
                key={option.value}
                type="button"
                className={styles.pill}
                aria-pressed={chosen}
                aria-disabled={refused ? true : undefined}
                onClick={() => {
                  if (chosen) {
                    onChange(value.filter((each) => each !== option.value));
                  } else if (!refused) {
                    onChange([...value, option.value]);
                  }
                }}
              >
                {chosen && <Icon name="check" size={16} strokeWidth={3} />}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
      {error !== undefined && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
