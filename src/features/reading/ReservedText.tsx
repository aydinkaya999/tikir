import styles from './ReservedText.module.css';

interface ReservedTextProps {
  text: string;
  /** Shows the text at 600 weight; the box is as wide either way. */
  bold?: boolean;
}

/**
 * Text whose box is always as wide as its 600-weight version: an invisible bold copy shares the
 * grid cell, so making the text bold never moves anything around it (the mechanism ReadingText
 * uses on its word cells). The copy is hidden from assistive technology and from selection.
 */
export function ReservedText({ text, bold = false }: ReservedTextProps) {
  return (
    <span className={styles.cell} data-bold={bold ? '' : undefined}>
      <span className={styles.shown} data-part="text">
        {text}
      </span>
      <span className={styles.reserve} data-part="reserve" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
