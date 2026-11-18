import { monsterImages, type MonsterKind, type MonsterState } from '../illustrations';
import styles from './Monster.module.css';

interface MonsterProps {
  /** Two monster kinds exist in design/svg. */
  kind: MonsterKind;
  /** wild = coral (a word still being practised), tamed = saffron. */
  state: MonsterState;
  size: number;
  /** Accessible name; decorative when the word is written next to it. */
  label?: string;
  className?: string;
}

/** A word monster (G2, G7, V2). */
export function Monster({ kind, state, size, label, className }: MonsterProps) {
  return (
    <img
      className={[styles.monster, className ?? ''].filter(Boolean).join(' ')}
      src={monsterImages[kind][state]}
      width={size}
      height={size}
      alt={label ?? ''}
      draggable={false}
    />
  );
}
