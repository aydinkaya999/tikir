// The words the child tamed, each with its tamed monster: G7's cards (docs/ekranlar.md, G7), also
// the album's (docs/planlar/faz-2b.md, karar 18).
import { Monster } from '../../components/Monster/Monster';
import { tr } from '../../i18n/tr';
import styles from './TamedWords.module.css';
import { monsterKindOf } from './views';

export function TamedWords({ words }: { words: readonly string[] }) {
  return (
    <ul className={styles.words} aria-label={tr.done.tamedLabel}>
      {words.map((word) => (
        <li key={word} className={styles.word}>
          <Monster className={styles.monster} kind={monsterKindOf(word)} state="tamed" size={64} />
          <span className={styles.text}>
            <span className={styles.name}>{word}</span>
            <span className={styles.note}>{tr.done.tamed}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
