import { Tile } from '../../components/Tile/Tile';
import { tr } from '../../i18n/tr';
import styles from './TomorrowCard.module.css';
import type { ChapterLine } from './views';

/** G7's "Yarın" card: the next chapter, still locked. Also on G1 once the day is done. */
export function TomorrowCard({ chapter }: { chapter: ChapterLine }) {
  return (
    <div className={styles.card}>
      <Tile className={styles.tile} state="locked" />
      <div className={styles.text}>
        <p className={styles.title}>{tr.done.tomorrow(chapter.title)}</p>
        <p className={styles.meta}>{tr.done.tomorrowMeta(chapter.number)}</p>
      </div>
    </div>
  );
}
