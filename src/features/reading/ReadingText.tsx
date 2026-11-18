import { tokenizePage } from '../../domain/text';
import type { Page } from '../../domain/types';
import styles from './ReadingText.module.css';

export type WordMark = 'hesitation' | 'error';

interface ReadingTextProps {
  page: Page;
  /** Index of the page's first word in the whole reading (WordResult.index). */
  firstIndex?: number;
  /** The word being read now. */
  currentIndex?: number | null;
  /** Where yesterday's reading (the ghost) is now; null on the first day. */
  ghostIndex?: number | null;
  /** How many words of the reading are already read (indices below firstIndex + readCount). */
  readCount?: number;
  /** Hesitation (dotted amber) and error (wavy coral) marks by word index. */
  marks?: Readonly<Partial<Record<number, WordMark>>>;
  className?: string;
}

/**
 * The reading page (docs/tasarim-sistemi.md, "Okuma metni"). Each word, with the punctuation
 * glued to it, is one span. Every span also holds an invisible 600-weight copy of itself, so
 * the bold current word never changes a width and no line ever reflows while the highlight moves.
 * Font, size and spacing come from the --reading-* variables of the container.
 */
export function ReadingText({
  page,
  firstIndex = 0,
  currentIndex = null,
  ghostIndex = null,
  readCount = 0,
  marks = {},
  className,
}: ReadingTextProps) {
  const tokens = tokenizePage(page);
  return (
    <p className={[styles.text, className ?? ''].filter(Boolean).join(' ')}>
      {tokens.map((token, position) => {
        const index = firstIndex + position;
        const shown = token.leading + token.word + token.trailing;
        return (
          <span key={index}>
            <span
              className={styles.word}
              data-word-index={index}
              data-read={index < firstIndex + readCount ? '' : undefined}
              data-current={index === currentIndex ? '' : undefined}
              data-ghost={index === ghostIndex ? '' : undefined}
              data-mark={marks[index]}
            >
              <span className={styles.shown} data-part="text">
                {shown}
              </span>
              <span className={styles.reserve} data-part="reserve" aria-hidden="true">
                {shown}
              </span>
            </span>
            {token.spaceAfter ? ' ' : ''}
          </span>
        );
      })}
    </p>
  );
}
