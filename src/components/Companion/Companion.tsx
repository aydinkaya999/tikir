import { companionImages, type CompanionExpression } from '../illustrations';
import styles from './Companion.module.css';

export type { CompanionExpression } from '../illustrations';

interface CompanionProps {
  /** Tıkır's face (design/svg/tikir-*.svg). */
  expression?: CompanionExpression;
  /** Square size in pixels (64–220 in the design). */
  size: number;
  /** Accessible name; without it Tıkır is decorative (inside a tile or a card). */
  label?: string;
  className?: string;
}

/** Tıkır. The image is remounted on every expression, which plays the 150 ms face change. */
export function Companion({ expression = 'normal', size, label, className }: CompanionProps) {
  return (
    <img
      key={expression}
      className={[styles.companion, className ?? ''].filter(Boolean).join(' ')}
      src={companionImages[expression]}
      width={size}
      height={size}
      alt={label ?? ''}
      draggable={false}
    />
  );
}
