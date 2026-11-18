import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './OptionCard.module.css';

interface OptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  /**
   * tile: centred picture over the label, a check badge when chosen (U3);
   * detail: a sample, the label and a description, left aligned (V4).
   */
  layout?: 'tile' | 'detail';
  icon?: IconName;
  /** A picture instead of an icon (tile), or a type sample (detail). Decorative. */
  media?: ReactNode;
  description?: string;
  className?: string;
}

/** A large choice card; the chosen one is saffron with the button lift. */
export function OptionCard({
  label,
  selected,
  onSelect,
  layout = 'tile',
  icon,
  media,
  description,
  className,
}: OptionCardProps) {
  const classes = [styles.card, styles[layout], className ?? ''].filter(Boolean).join(' ');
  return (
    <button type="button" aria-pressed={selected} className={classes} onClick={onSelect}>
      {layout === 'tile' && selected && (
        <span aria-hidden="true" className={styles.badge}>
          <Icon name="check" size={12} strokeWidth={3.4} />
        </span>
      )}
      {media !== undefined && (
        <span aria-hidden="true" className={styles.media}>
          {media}
        </span>
      )}
      {media === undefined && icon && <Icon name={icon} className={styles.icon} strokeWidth={2} />}
      <span className={styles.label}>{label}</span>
      {description !== undefined && <span className={styles.description}>{description}</span>}
    </button>
  );
}
