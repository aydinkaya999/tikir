import { Fragment } from 'react';
import type { Page } from '../../domain/types';
import styles from './PhraseText.module.css';
import { ReservedText } from './ReservedText';

interface PhraseTextProps {
  page: Page;
  /** The phrase unit being narrated (index over the whole page). */
  currentUnit?: number | null;
  /** How many units are already narrated. */
  readUnits?: number;
  className?: string;
}

/**
 * The page split into phrase units for the Listen step (G3): thin bars between the units of a
 * sentence, a plain space between sentences; the unit being narrated is saffron.
 */
export function PhraseText({
  page,
  currentUnit = null,
  readUnits = 0,
  className,
}: PhraseTextProps) {
  // Index of each sentence's first unit over the whole page.
  const firstUnitOf = page.map((_, sentenceIndex) =>
    page.slice(0, sentenceIndex).reduce((count, sentence) => count + sentence.length, 0),
  );
  return (
    <p className={[styles.text, className ?? ''].filter(Boolean).join(' ')}>
      {page.map((sentence, sentenceIndex) => (
        <Fragment key={sentenceIndex}>
          {sentence.map((unit, position) => {
            const index = (firstUnitOf[sentenceIndex] ?? 0) + position;
            return (
              <Fragment key={index}>
                {position > 0 && (
                  <span className={styles.divider} data-part="divider" aria-hidden="true" />
                )}
                <span
                  className={styles.unit}
                  data-unit-index={index}
                  data-read={index < readUnits ? '' : undefined}
                  data-current={index === currentUnit ? '' : undefined}
                >
                  {unit
                    .split(/(\s+)/u)
                    .map((part, partIndex) =>
                      part.trim() === '' ? (
                        part
                      ) : (
                        <ReservedText key={partIndex} text={part} bold={index === currentUnit} />
                      ),
                    )}
                </span>
              </Fragment>
            );
          })}
          {sentenceIndex < page.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </p>
  );
}
