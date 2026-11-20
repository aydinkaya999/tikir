// G7 Bugünlük bitti (docs/ekranlar.md, G7; docs/planlar/faz-2b.md, karar 17): the day's minutes,
// the third reading's pace and its gain (only when positive), the words tamed today, tomorrow's
// chapter and the note that the parent got the summary.
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Monster } from '../../components/Monster/Monster';
import { tr } from '../../i18n/tr';
import styles from './DonePage.module.css';
import { childPaths } from './paths';
import { useSession } from './sessionContext';
import { SessionLayout } from './SessionLayout';
import { placeOf } from './sessionMachine';
import { TomorrowCard } from './TomorrowCard';
import { doneView, monsterKindOf } from './views';

export function DonePage() {
  const data = useSession((state) => state.data);
  const navigate = useNavigate();
  if (data === null || data.session === null || placeOf(data.session).step !== 'done') {
    return null;
  }
  const view = doneView(data);
  const close = () => {
    void navigate(childPaths.road);
  };

  return (
    <SessionLayout
      title={tr.session.doneTitle}
      chip={<Chip tone="saffronLight">{tr.done.minutes(view.minutes)}</Chip>}
      companion={{ expression: 'sleep', bubble: tr.done.bubble(view.childName) }}
      controls={
        <div className={styles.action}>
          <Button variant="secondary" size="large" icon="check" fullWidth onClick={close}>
            {tr.done.close}
          </Button>
        </div>
      }
    >
      <div className={styles.summary}>
        {view.wcpm !== null && (
          <section className={styles.pace}>
            <p className={styles.paceValue}>
              <span className={styles.number}>{view.wcpm}</span>
              <span className={styles.paceLabel}>
                <span>{tr.done.paceFirstLine}</span>
                <span>{tr.done.paceSecondLine}</span>
              </span>
            </p>
            {view.delta !== null && <Chip icon="chart">{tr.done.gain(view.delta)}</Chip>}
          </section>
        )}
        {view.tamed.length > 0 && (
          <ul className={styles.tamed} aria-label={tr.done.tamedLabel}>
            {view.tamed.map((word) => (
              <li key={word} className={styles.tamedWord}>
                <Monster
                  className={styles.monster}
                  kind={monsterKindOf(word)}
                  state="tamed"
                  size={64}
                />
                <span className={styles.tamedText}>
                  <span className={styles.word}>{word}</span>
                  <span className={styles.note}>{tr.done.tamed}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {view.tomorrow === null ? (
          // TODO(design): the series' end is not drawn on G7.
          <p className={styles.seriesEnd}>{tr.road.seriesEnd}</p>
        ) : (
          <TomorrowCard chapter={view.tomorrow} />
        )}
        <p className={styles.note}>{tr.done.summary}</p>
      </div>
    </SessionLayout>
  );
}
