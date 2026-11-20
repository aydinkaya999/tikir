import { useEffect, useState } from 'react';
import styles from './SyllableTiles.module.css';

interface SyllableTilesProps {
  syllables: readonly string[];
  /** performance.now() when Tıkır started reading the word; null while he is not. */
  narrationStartedAt: number | null;
  /** How long Tıkır spends on a syllable at his pace. */
  syllableMs: number;
  label: string;
}

const tickMs = 50;

/**
 * G2's syllables (docs/planlar/faz-2b.md, karar 12): they follow Tıkır's reading of the word —
 * read syllables light turquoise, the one he says saffron, the rest white. The listener works word
 * by word, so the child's own reading is not followed syllable by syllable.
 */
export function SyllableTiles({
  syllables,
  narrationStartedAt,
  syllableMs,
  label,
}: SyllableTilesProps) {
  const [now, setNow] = useState(0);
  const active = narrationStartedAt !== null;

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const timer = setInterval(() => {
      setNow(performance.now());
    }, tickMs);
    return () => {
      clearInterval(timer);
    };
  }, [active]);

  const current =
    narrationStartedAt === null
      ? null
      : Math.min(
          syllables.length - 1,
          Math.max(0, Math.floor((now - narrationStartedAt) / syllableMs)),
        );

  return (
    <ol className={styles.tiles} aria-label={label}>
      {syllables.map((syllable, index) => (
        <li
          key={`${String(index)}-${syllable}`}
          className={styles.tile}
          data-state={
            current === null || index > current ? 'next' : index === current ? 'current' : 'read'
          }
        >
          {syllable}
        </li>
      ))}
    </ol>
  );
}
