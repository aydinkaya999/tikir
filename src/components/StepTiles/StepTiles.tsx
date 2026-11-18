import { Icon } from '../Icon/Icon';
import styles from './StepTiles.module.css';

export interface Step {
  key: string;
  label: string;
}

interface StepTilesProps {
  steps: readonly Step[];
  /** Index of the current step; null once the session is over (every step done, G7). */
  current: number | null;
  /** Accessible name of the list ("Seans adımları"). */
  label: string;
  className?: string;
}

/**
 * The session's step tiles: done steps turquoise with a tick, the current one saffron and
 * lifted, the rest outlined. Step names show from 700 px; on phones they stay for screen
 * readers only (G4).
 */
export function StepTiles({ steps, current, label, className }: StepTilesProps) {
  return (
    <ol aria-label={label} className={[styles.list, className ?? ''].filter(Boolean).join(' ')}>
      {steps.map((step, index) => {
        const state =
          current === null || index < current ? 'done' : index === current ? 'current' : 'next';
        return (
          <li
            key={step.key}
            className={`${styles.step} ${styles[state]}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className={styles.tile}>
              {state === 'done' && (
                <Icon name="check" size={14} strokeWidth={3} className={styles.tick} />
              )}
            </span>
            <span className={styles.name}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
