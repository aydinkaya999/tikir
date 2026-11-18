import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Chip.module.css';

export type ChipTone = 'white' | 'saffron' | 'saffronLight' | 'turquoiseLight';

interface ChipProps {
  icon?: IconName;
  /** The tones the design uses: white (V1, G4), saffron (G1), light saffron and turquoise (G4). */
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}

/** A fully rounded label; never interactive. */
export function Chip({ icon, tone = 'white', className, children }: ChipProps) {
  return (
    <span className={[styles.chip, styles[tone], className ?? ''].filter(Boolean).join(' ')}>
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </span>
  );
}
