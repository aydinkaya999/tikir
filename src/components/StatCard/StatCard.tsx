import type { ReactNode } from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  /** The number as shown, e.g. "%94" or "3 / 4". */
  value: string;
  /** What the number means; may contain a line break (V1 hero). */
  label: ReactNode;
  /** hero: saffron and lifted, number beside its label (V1); plain: white, label below. */
  tone?: 'hero' | 'plain';
  /** Extra content on the hero card, e.g. the week-over-week chip. */
  extra?: ReactNode;
  className?: string;
}

/** A big number with its meaning (V1). */
export function StatCard({ value, label, tone = 'plain', extra, className }: StatCardProps) {
  return (
    <div className={[styles.card, styles[tone], className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.figure}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
      {extra}
    </div>
  );
}
