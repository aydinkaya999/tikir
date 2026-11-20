// V3 Ölçüm sonucu (docs/ekranlar.md, V3; docs/planlar/faz-4.md, kararlar 22–27): the last weekly
// measurement's numbers, its reading level, the next measurement, sharing it with the teacher,
// its recording and the marked excerpt of its text.
import { Fragment, useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Icon } from '../../components/Icon/Icon';
import type { ReadingLevel } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { usePlayback } from '../session/playback';
import { useSession, useSessionDevices } from '../session/sessionContext';
import styles from './AssessmentPage.module.css';
import { EmptyReport } from './EmptyReport';
import { assessmentView } from './views';

const copy = tr.report.assessment;
const levels: readonly ReadingLevel[] = ['frustration', 'instructional', 'independent'];

export function AssessmentPage() {
  const data = useSession((state) => state.data);
  const { recorder, share } = useSessionDevices();
  const playback = usePlayback(recorder);
  const [shared, setShared] = useState<'copied' | 'failed' | null>(null);
  const levelId = useId();
  const excerptId = useId();

  if (data === null) {
    // The setup guard loads the store before the parent area opens.
    return null;
  }
  const state = assessmentView(data);
  if (state.kind === 'empty') {
    return <EmptyReport title={copy.title} text={copy.empty} />;
  }
  const { view } = state;

  const shareResult = () => {
    setShared(null);
    share.share(view.share).then(
      (result) => {
        setShared(result === 'copied' ? 'copied' : null);
      },
      () => {
        setShared('failed');
      },
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.date}>{view.date}</p>
      </div>

      <div className={styles.columns}>
        <div className={styles.main}>
          <div className={styles.result}>
            <div className={styles.figure}>
              <span className={styles.number}>{view.wcpm}</span>
              <span className={styles.unit}>
                {copy.wcpm.firstLine}
                <br />
                {copy.wcpm.secondLine}
              </span>
            </div>
            <div className={styles.chips}>
              <Chip>{copy.wordsRead(view.wordsRead)}</Chip>
              <Chip>{copy.errors(view.errors)}</Chip>
              <Chip>{copy.accuracy(view.accuracyPercent)}</Chip>
            </div>
          </div>

          <section className={styles.card} aria-labelledby={levelId}>
            <h2 id={levelId} className={styles.cardTitle}>
              {copy.levelTitle}
            </h2>
            <ol
              className={styles.band}
              aria-label={copy.levelLabel(copy.levels[view.level].name.toLocaleLowerCase('tr-TR'))}
            >
              {levels.map((level) => (
                <li
                  key={level}
                  className={styles.level}
                  aria-current={level === view.level ? 'true' : undefined}
                >
                  <span className={styles.levelName}>{copy.levels[level].name}</span>
                  <span className={styles.levelRange}>{copy.levels[level].range}</span>
                </li>
              ))}
            </ol>
            <p className={styles.levelSentence}>{view.levelSentence}</p>
          </section>

          <p className={styles.next}>
            <Icon name="calendar" size={22} />
            <span>{view.next}</span>
          </p>

          <div className={styles.actions}>
            {share.canShare() && (
              <Button icon="share" fullWidth className={styles.share} onClick={shareResult}>
                {copy.share}
              </Button>
            )}
            {view.recordingId !== null && (
              <Button
                variant="secondary"
                icon="play"
                fullWidth
                className={styles.listen}
                onClick={() => {
                  if (view.recordingId !== null) {
                    playback.play(view.recordingId);
                  }
                }}
              >
                {copy.listen}
              </Button>
            )}
          </div>
          {/* TODO(design): the share's outcome is not drawn (D17). */}
          <p className={styles.shareNote} role="status">
            {shared === 'copied'
              ? copy.shared.copied
              : shared === 'failed'
                ? copy.shared.failed
                : ''}
          </p>
        </div>

        {view.excerpt.length > 0 && (
          <section className={`${styles.card} ${styles.excerptCard}`} aria-labelledby={excerptId}>
            <h2 id={excerptId} className={styles.cardTitle}>
              {copy.excerptTitle}
            </h2>
            <p className={styles.excerpt}>
              {view.excerpt.map((token, index) => (
                <Fragment key={index}>
                  <span className={styles.word} data-mark={token.mark ?? ''}>
                    {token.leading}
                    {token.word}
                    {token.trailing}
                    {token.mark !== null && (
                      <span className={styles.markName}>{` (${copy.marks[token.mark]})`}</span>
                    )}
                  </span>
                  {token.spaceAfter ? ' ' : ''}
                </Fragment>
              ))}
            </p>
            <p className={styles.legend}>
              <span className={styles.legendItem} data-legend="error">
                {copy.marks.error}
              </span>
              <span className={styles.legendItem} data-legend="stumble">
                {copy.marks.stumble}
              </span>
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
