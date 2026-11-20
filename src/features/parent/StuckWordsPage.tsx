// V2 Takılınan yerler (docs/ekranlar.md, V2; docs/planlar/faz-4.md, kararlar 17–21): the week's
// error types, the suffix drill, the most missed words with the child's reading of each, and the
// recordings the child sent, waiting for the parent.
import { useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { IconButton } from '../../components/IconButton/IconButton';
import { withGenitiveSuffix } from '../../domain/text';
import { tr } from '../../i18n/tr';
import { usePlayback } from '../session/playback';
import { useSession, useSessionDevices, useSessionStore } from '../session/sessionContext';
import { RecordingList } from './RecordingList';
import styles from './StuckWordsPage.module.css';
import { useRecordings } from './useRecordings';
import { stuckView } from './views';

const copy = tr.report.stuckWords;

export function StuckWordsPage() {
  const store = useSessionStore();
  const data = useSession((state) => state.data);
  const { recorder } = useSessionDevices();
  const { recordings, refresh } = useRecordings(recorder);
  const playback = usePlayback(recorder);
  const [added, setAdded] = useState<number | null>(null);
  const errorsId = useId();
  const wordsId = useId();

  if (data === null) {
    // The setup guard loads the store before the parent area opens.
    return null;
  }
  const view = stuckView(data, recordings ?? []);
  const largest = Math.max(1, ...view.errors.map((row) => row.count));
  const name = withGenitiveSuffix(data.child.name);

  const addDrill = () => {
    store
      .getState()
      .addDrillToWarmup()
      .then((count) => {
        if (count !== null) {
          setAdded(count);
        }
      })
      .catch(() => undefined);
  };

  const drill =
    added !== null ? (
      <p className={styles.added}>{copy.drill.added(added)}</p>
    ) : (
      view.drill !== null && (
        <div className={styles.drill}>
          <div className={styles.drillText}>
            <h2 className={styles.drillTitle}>
              <span className={styles.long}>{copy.drill.lead}</span>
              <span className={styles.short}>{copy.drill.shortTitle}</span>
            </h2>
            <p className={`${styles.drillBody} ${styles.long}`}>
              {copy.drill.body(view.drill.suffixes, view.drill.words, view.drill.days)}
            </p>
            <p className={`${styles.drillBody} ${styles.short}`}>
              {copy.drill.shortBody(view.drill.words, view.drill.days)}
            </p>
          </div>
          {/* The phone's "Ekle" is part of the name, so the name holds at every width. */}
          <Button icon="plus" aria-label={copy.drill.add} onClick={addDrill}>
            <span className={styles.long}>{copy.drill.add}</span>
            <span className={styles.short}>{copy.drill.shortAdd}</span>
          </Button>
        </div>
      )
    );

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.lead}>
          {view.totalErrors === 0 ? copy.noErrors : copy.lead(view.totalErrors, view.errorTypes)}
        </p>
      </div>

      <div className={styles.columns}>
        {view.totalErrors > 0 && (
          <section className={`${styles.card} ${styles.errors}`} aria-labelledby={errorsId}>
            <h2 id={errorsId} className={styles.cardTitle}>
              {copy.errorsTitle}
            </h2>
            <ul className={styles.errorList} aria-labelledby={errorsId}>
              {view.errors.map((row) => (
                <li key={row.type} className={styles.errorRow}>
                  <span className={styles.errorName}>
                    <span className={styles.errorLabel}>{copy.errorTypes[row.type]}</span>
                    {row.example !== null && <span className={styles.example}>{row.example}</span>}
                  </span>
                  <span className={styles.bar} aria-hidden="true">
                    <span
                      className={styles.fill}
                      style={{ width: `${String((row.count / largest) * 100)}%` }}
                    />
                  </span>
                  <span className={styles.count}>{row.count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`${styles.card} ${styles.words}`} aria-labelledby={wordsId}>
          <h2 id={wordsId} className={styles.cardTitle}>
            {copy.wordsTitle}
          </h2>
          {view.words.length === 0 ? (
            <p className={styles.none}>{copy.noWords}</p>
          ) : (
            <ul className={styles.wordList} aria-labelledby={wordsId}>
              {view.words.map((word) => (
                <li key={word.word} className={styles.wordRow}>
                  {word.playback !== null && (
                    <IconButton
                      icon="play"
                      iconSize={18}
                      label={copy.listen(word.word, name)}
                      onClick={() => {
                        const { recordingId, fromMs, toMs } = word.playback ?? {
                          recordingId: '',
                          fromMs: 0,
                          toMs: 0,
                        };
                        playback.play(recordingId, { fromMs, toMs });
                      }}
                    />
                  )}
                  <span className={styles.wordText}>
                    <span className={styles.word}>{word.word}</span>
                    <span className={styles.wordLine}>
                      {copy.wordLine(word.syllables, word.misses)}
                    </span>
                  </span>
                  <span className={styles.status} data-status={word.status}>
                    {copy.status[word.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className={styles.drillSlot}>{drill}</div>
      </div>

      {view.pending.length > 0 && (
        <RecordingList
          title={tr.report.recordings.pendingTitle}
          rows={view.pending}
          onPlay={(id) => {
            playback.play(id);
          }}
          onApprove={(id) => {
            recorder
              .approve(id)
              .catch(() => undefined)
              .finally(refresh);
          }}
          onRemove={(id) => {
            store
              .getState()
              .deleteRecording(id)
              .catch(() => undefined)
              .finally(refresh);
          }}
        />
      )}
    </div>
  );
}
