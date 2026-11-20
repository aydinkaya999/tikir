import { tilePatternImages, type TilePattern } from '../illustrations';
import styles from './BookCover.module.css';

interface BookCoverProps {
  /**
   * tile: a patterned square in the library list (U1);
   * card: two patterns over the title on the ready page (U4).
   */
  variant?: 'tile' | 'card';
  /** One pattern for a tile, two for a card. */
  patterns: readonly [TilePattern] | readonly [TilePattern, TilePattern];
  /** Shown on the card variant. */
  title?: string;
  /** Edge of the tile variant in pixels: 88 on tablet and web, 64 on phones (U1). */
  size?: number;
  className?: string;
}

interface CoverBandProps {
  patterns: readonly [TilePattern] | readonly [TilePattern, TilePattern];
  className?: string;
}

/** A book's patterns side by side: the top of a book card (U1) and of the ready page's cover (U4). */
export function CoverBand({ patterns, className }: CoverBandProps) {
  return (
    <span className={[styles.band, className ?? ''].filter(Boolean).join(' ')} aria-hidden="true">
      {patterns.map((pattern, index) => (
        <img
          key={`${String(pattern)}-${String(index)}`}
          className={styles.bandImage}
          src={tilePatternImages[pattern]}
          alt=""
          draggable={false}
        />
      ))}
    </span>
  );
}

/**
 * TODO(design): U1 and U4 also use a pattern that is not in design/svg (saffron star on light
 * cobalt); covers are built from the six tiles that are.
 */
export function BookCover({
  variant = 'tile',
  patterns,
  title,
  size = 88,
  className,
}: BookCoverProps) {
  if (variant === 'tile') {
    return (
      <div
        aria-hidden="true"
        className={[styles.tile, className ?? ''].filter(Boolean).join(' ')}
        style={{ width: size, height: size }}
      >
        <img
          className={styles.fill}
          src={tilePatternImages[patterns[0]]}
          alt=""
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={[styles.card, className ?? ''].filter(Boolean).join(' ')}>
      <CoverBand patterns={patterns} />
      {title !== undefined && <p className={styles.title}>{title}</p>}
    </div>
  );
}
