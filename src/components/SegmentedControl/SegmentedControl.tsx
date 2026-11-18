import { useId } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  /** Visible label above the group; also the group's accessible name. */
  label: string;
  /** Radio group name, unique on the page. */
  name: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * One choice out of a few, as segments of a single bordered bar; the chosen one is saffron
 * (V4, U2). Built on real radio buttons, so arrow keys move the choice.
 */
export function SegmentedControl<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const labelId = useId();
  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.bar}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              className={styles.input}
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => {
                onChange(option.value);
              }}
            />
            <span className={styles.face}>
              {option.icon && <Icon name={option.icon} size={20} />}
              <span>{option.label}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
