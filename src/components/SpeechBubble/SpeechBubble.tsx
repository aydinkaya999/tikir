import type { ReactNode } from 'react';
import styles from './SpeechBubble.module.css';

interface SpeechBubbleProps {
  /**
   * Where the bubble points: left of the bubble (G1, phones), above it (tablet, web), or
   * adaptive — left below 700 px, above from 700 px (session and onboarding shells).
   */
  arrow?: 'left' | 'top' | 'adaptive';
  /** Tıkır's help is a polite live region (docs/tasarim-sistemi.md, "Erişilebilirlik"). */
  live?: boolean;
  className?: string;
  children: ReactNode;
}

export function SpeechBubble({
  arrow = 'left',
  live = false,
  className,
  children,
}: SpeechBubbleProps) {
  return (
    <div
      className={[styles.bubble, className ?? ''].filter(Boolean).join(' ')}
      aria-live={live ? 'polite' : undefined}
    >
      <span aria-hidden="true" className={styles[`arrow-${arrow}`]} />
      <div className={styles.text}>{children}</div>
    </div>
  );
}
