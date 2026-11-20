import { Icon } from '../Icon/Icon';
import {
  companionImages,
  lockedTileImage,
  tilePatternImages,
  type TilePattern,
} from '../illustrations';
import styles from './Tile.module.css';

export type { TilePattern } from '../illustrations';

export type TileState = 'done' | 'today' | 'locked';

interface TileProps {
  /** done = patterned tile, today = saffron with Tıkır, locked = dashed with a lock (G1). */
  state: TileState;
  /** Pattern of a done tile (design/svg/cini-1…6.svg). */
  pattern?: TilePattern;
  /**
   * Edge in pixels: 84 on tablet and web, 62 on phones (G1). Left out, the tile follows the
   * --tile-size variable of its CSS (84 px by default), so a screen can size it per breakpoint.
   */
  size?: number;
  className?: string;
}

/** A glazed tile. Decorative: the list it sits in names the chapter and its state. */
export function Tile({ state, pattern = 1, size, className }: TileProps) {
  return (
    <div
      aria-hidden="true"
      className={[styles.tile, styles[state], className ?? ''].filter(Boolean).join(' ')}
      style={size === undefined ? undefined : { width: size, height: size }}
    >
      {state === 'done' && (
        <img className={styles.fill} src={tilePatternImages[pattern]} alt="" draggable={false} />
      )}
      {state === 'today' && (
        <span className={styles.center}>
          <img className={styles.face} src={companionImages.normal} alt="" draggable={false} />
        </span>
      )}
      {state === 'locked' && (
        <>
          <img className={styles.fill} src={lockedTileImage} alt="" draggable={false} />
          <span className={`${styles.center} ${styles.lock}`}>
            <Icon name="lock" size={18} />
          </span>
        </>
      )}
    </div>
  );
}
