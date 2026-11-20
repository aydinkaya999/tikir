// G1 Yol (docs/ekranlar.md, G1): today's chapter one tap away, and the road of the series.
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Companion } from '../../components/Companion/Companion';
import { IconButton } from '../../components/IconButton/IconButton';
import { SpeechBubble } from '../../components/SpeechBubble/SpeechBubble';
import { Tile } from '../../components/Tile/Tile';
import { sessionMinutes } from '../../domain/config';
import { measurementDue } from '../../domain/measurement';
import { withPossessiveSuffix } from '../../domain/text';
import { tr } from '../../i18n/tr';
import { parentPaths } from '../parent/paths';
import { useMicrophone } from '../reading/useMicrophone';
import { childPaths, sessionPaths } from './paths';
import styles from './RoadPage.module.css';
import { useLoadSession, useSession, useSessionDevices, useSessionStore } from './sessionContext';
import { StatusScreen } from './StatusScreen';
import { TomorrowCard } from './TomorrowCard';
import { useDayRefresh } from './useDayRefresh';
import { chapterPattern, roadView, sessionListens } from './views';

export function RoadPage() {
  useLoadSession();
  const status = useSession((state) => state.status);
  const data = useSession((state) => state.data);
  const store = useSessionStore();
  // A road left open past midnight turns to the new day.
  useDayRefresh();
  const { audio } = useSessionDevices();
  const microphone = useMicrophone(audio, data === null ? false : sessionListens(data));
  // The measurement listens whenever the parent consented, whatever today's session did (P14).
  const measurementMicrophone = useMicrophone(audio, data?.parent.consent.voiceProcessing ?? false);
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const seriesTitleId = useId();
  const measurementId = useId();

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen kind="loading" />;
  }
  if (status === 'error') {
    return <StatusScreen kind="error" />;
  }
  if (data === null) {
    // The setup guard opens the setup before a profile exists.
    return null;
  }

  const view = roadView(data);
  const bubble =
    view.state === 'done'
      ? tr.done.bubble(view.childName)
      : view.state !== 'seriesEnd' && view.chapter !== null
        ? tr.road.bubble(view.chapter.number, view.chapter.title)
        : null;

  const measuring = measurementDue(
    data.assessments,
    data.child.readingStyle,
    data.today,
    data.parent.consent.voiceProcessing,
  );
  // The card's tap opens the microphone, as "Başla" does for a listening step (T22).
  const measure = () => {
    measurementMicrophone.start();
    void navigate(childPaths.measurement);
  };

  // The tap that leads into a listening step opens the microphone (docs/kararlar.md T22).
  const start = () => {
    const step = data.session?.step ?? 'warmup';
    if (step === 'warmup' || step === 'read') {
      microphone.start();
    }
    setStarting(true);
    store
      .getState()
      .start()
      .then(() => {
        const session = store.getState().data?.session;
        if (session !== undefined && session !== null) {
          void navigate(sessionPaths[session.step]);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setStarting(false);
      });
  };

  return (
    <div className={styles.road}>
      <div className={styles.greetingRow}>
        <Companion className={styles.phoneFace} expression="normal" size={80} label={tr.appName} />
        <div className={styles.greeting}>
          <h1 className={styles.title}>{tr.road.greeting(view.childName)}</h1>
          {view.streak !== null && (
            <Chip tone="saffron" icon="flame">
              {tr.road.streak(view.streak)}
            </Chip>
          )}
        </div>
        {/* Phones reach the parent area here (karar 27); wider screens from the rail. TODO(design) */}
        <IconButton
          className={styles.parentArea}
          to={parentPaths.summary}
          icon="lock"
          label={tr.nav.child.parentArea}
          size={44}
        />
      </div>
      <div className={styles.columns}>
        <div className={styles.today}>
          <div className={styles.intro}>
            <Companion
              className={styles.wideFace}
              expression="normal"
              size={150}
              label={tr.appName}
            />
            {bubble !== null && (
              <SpeechBubble className={styles.bubble} arrow="left">
                {bubble}
              </SpeechBubble>
            )}
          </div>
          <div className={styles.chapterCard}>
            {view.state === 'seriesEnd' || view.chapter === null ? (
              <>
                {/* TODO(design): no chapter left to read. */}
                <p className={styles.notice}>{tr.road.seriesEnd}</p>
                <Button to={childPaths.library} size="large" fullWidth>
                  {tr.nav.child.library}
                </Button>
              </>
            ) : (
              <>
                <div className={styles.chapterHead}>
                  <Tile
                    className={styles.cover}
                    state="done"
                    pattern={chapterPattern(view.chapter.number)}
                  />
                  <div className={styles.chapterText}>
                    <p className={styles.label}>{tr.road.todayLabel}</p>
                    <h2 className={styles.chapterTitle}>
                      {view.state === 'done' ? tr.session.doneTitle : view.chapter.title}
                    </h2>
                    {view.state !== 'done' && (
                      <p className={styles.meta}>
                        {tr.road.chapterMeta(view.chapter.number, sessionMinutes)}
                      </p>
                    )}
                  </div>
                </div>
                {view.state === 'done' ? (
                  // TODO(design): the finished day uses G7's "Yarın" card (docs/ekranlar.md, G1).
                  view.tomorrow === null ? (
                    <p className={styles.notice}>{tr.road.seriesEnd}</p>
                  ) : (
                    <TomorrowCard chapter={view.tomorrow} />
                  )
                ) : (
                  <Button icon="play" size="large" fullWidth disabled={starting} onClick={start}>
                    {view.state === 'resume' ? tr.road.resume : tr.road.start}
                  </Button>
                )}
              </>
            )}
          </div>
          {measuring && (
            // The weekly measurement while it is open, under the day's chapter: the session stays
            // the day's main work (docs/planlar/faz-4.md, karar 29). TODO(design)
            <section className={styles.measurement} aria-labelledby={measurementId}>
              <div className={styles.measurementText}>
                <h2 id={measurementId} className={styles.measurementTitle}>
                  {tr.road.measurement.title}
                </h2>
                <p className={styles.measurementLead}>{tr.road.measurement.text}</p>
              </div>
              <Button variant="secondary" icon="mic" onClick={measure}>
                {tr.road.measurement.start}
              </Button>
            </section>
          )}
        </div>
        <div className={styles.seriesColumn}>
          <section className={styles.seriesCard} aria-labelledby={seriesTitleId}>
            <div className={styles.seriesHead}>
              <h2 id={seriesTitleId} className={styles.seriesTitle}>
                {view.bookTitle}
              </h2>
              <p className={styles.label}>
                {tr.road.completed(view.totalChapters, withPossessiveSuffix(view.completed))}
              </p>
            </div>
            <ol className={styles.tiles} aria-label={tr.road.chaptersLabel}>
              {view.tiles.map((tile) => (
                <li key={tile.chapter} className={styles.tileItem} data-state={tile.state}>
                  <Tile className={styles.tile} state={tile.state} pattern={tile.pattern} />
                  <span className={styles.tileNumber}>{tile.chapter}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
