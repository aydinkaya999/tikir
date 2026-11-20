// G4 Oku (docs/ekranlar.md, G4; docs/dinleme-hatti.md; docs/planlar/faz-2b.md, karar 14): the
// child reads the chapter three times; the listener follows, Tıkır helps at three seconds, the
// ghost of the earlier reading races along, and the third reading is recorded. Without the
// parent's consent, or once the microphone could not be used, the text is read unheard
// (docs/kararlar.md P13, P14).
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { IconButton } from '../../components/IconButton/IconButton';
import { MicButton, type MicState } from '../../components/MicButton/MicButton';
import { PageCard } from '../../components/PageCard/PageCard';
import { readingsPerSession } from '../../domain/config';
import { ghostPace, previousReading } from '../../domain/ghost';
import { chapterTokens, tokenizePage } from '../../domain/text';
import type { Attempt, Chapter } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { onKeyDown } from '../../services/keyboard';
import type { ListenerOutcome } from '../../services/listener/types';
import type { Narrator } from '../../services/narrator/Narrator';
import { screenPageOf, screenPages } from '../reading/pages';
import { RaceBar } from '../reading/RaceBar';
import { ReadingStyleScope } from '../reading/ReadingStyleScope';
import { ReadingText } from '../reading/ReadingText';
import { useMicrophone } from '../reading/useMicrophone';
import { useReading } from '../reading/useReading';
import { useReadingRecorder } from '../reading/useReadingRecorder';
import { useExitDialogOpen } from './exitDialogState';
import { formatClock } from './format';
import { MicrophoneProblem } from './MicrophoneProblem';
import styles from './ReadPage.module.css';
import { useSession, useSessionDevices, useSessionStore } from './sessionContext';
import { SessionLayout } from './SessionLayout';
import { placeOf } from './sessionMachine';
import type { SessionData } from './sessionStore';
import { pageTitle, sessionListens } from './views';
import { useManualKeys } from './useManualKeys';
import { useNarrator } from './useNarrator';

function attemptOf(count: number): Attempt {
  return count <= 1 ? 1 : count === 2 ? 2 : 3;
}

export function ReadPage() {
  const data = useSession((state) => state.data);
  const unheardDone = useSession((state) => state.unheardDone);
  const narrator = useNarrator();

  const session = data?.session ?? null;
  const chapter = data?.chapter ?? null;
  const place = session === null ? null : placeOf(session);
  if (data === null || session === null || chapter === null || place?.step !== 'read') {
    return null;
  }
  if (!sessionListens(data)) {
    return (
      <UnheardReading
        attempt={attemptOf(session.readings.length + unheardDone + 1)}
        data={data}
        chapter={chapter}
      />
    );
  }
  if (narrator === null) {
    return <SessionLayout title={tr.session.steps.read} companion={{ expression: 'listen' }} />;
  }
  return (
    <HeardReading
      key={`${String(place.attempt)}-${place.redo ? 'redo' : 'first'}`}
      attempt={place.attempt}
      data={data}
      chapter={chapter}
      narrator={narrator}
    />
  );
}

interface ReadingProps {
  attempt: Attempt;
  data: SessionData;
  chapter: Chapter;
}

/** One reading with a new listener; the page keys it by the reading, so the next starts fresh. */
function HeardReading({ attempt, data, chapter, narrator }: ReadingProps & { narrator: Narrator }) {
  const store = useSessionStore();
  const devices = useSessionDevices();
  const exitOpen = useExitDialogOpen();
  const microphone = useMicrophone(devices.audio, true);
  const [choice] = useState(() => devices.listener('reading', attempt));
  const tokens = useMemo(() => chapterTokens(chapter), [chapter]);
  const pages = useMemo(
    () => screenPages(chapter, devices.scenario.layout),
    [chapter, devices.scenario.layout],
  );
  const ghostPaceWpm = useMemo(
    () =>
      devices.scenario.ghostWpm ?? ghostPace(previousReading(data.sessions, data.today, attempt)),
    [devices.scenario.ghostWpm, data.sessions, data.today, attempt],
  );
  const records = attempt === readingsPerSession;
  const startedAt = useRef<string | null>(null);
  const pausedBeforeExit = useRef(false);
  const [retried, setRetried] = useState(false);

  /** The reading ended: the third one's recording stops, and the reading is stored. */
  const finish = (outcome: ListenerOutcome) => {
    const save = async () => {
      const recordingId = await readingRecorder.finish();
      await store.getState().saveReading(outcome, {
        startedAt: startedAt.current ?? new Date().toISOString(),
        recordingId,
      });
    };
    save().catch(() => undefined);
  };

  const reading = useReading({
    listener: choice.listener,
    audio: devices.audio,
    narrator,
    tokens,
    ghostPaceWpm,
    onFinish: finish,
  });
  useManualKeys(choice.mark);

  const capturing = microphone.state === 'capturing';
  // The recording follows the reading's own clock: the child's pauses, the exit dialog's hold and
  // Tıkır's help are left out of it.
  const readingRecorder = useReadingRecorder({
    enabled: records,
    recorder: devices.recorder,
    audio: devices.audio,
    running:
      capturing && !reading.paused && reading.helpIndex === null && reading.view.ended === null,
  });
  // The reading starts once the microphone listens; the third starts the recorder with it.
  const begin = useEffectEvent(() => {
    startedAt.current ??= new Date().toISOString();
    reading
      .start()
      .then(() => {
        readingRecorder.start();
      })
      .catch(() => undefined);
  });
  useEffect(() => {
    if (capturing && !exitOpen) {
      begin();
    }
  }, [capturing, exitOpen]);

  const holdForExit = useEffectEvent((open: boolean) => {
    if (open) {
      pausedBeforeExit.current = reading.paused;
      reading.pause();
    } else if (!pausedBeforeExit.current) {
      reading.resume();
    }
  });
  useEffect(() => {
    holdForExit(exitOpen);
  }, [exitOpen]);

  const togglePause = () => {
    if (reading.paused) {
      reading.resume();
    } else {
      reading.pause();
    }
  };

  // Space pauses and resumes (the web's hint); a focused button handles its own Space, and the
  // manual mode keeps Space for marking a word.
  const toggleFromSpace = useEffectEvent(() => {
    togglePause();
  });
  const manual = choice.mark !== undefined;
  useEffect(() => {
    if (manual) {
      return undefined;
    }
    return onKeyDown((press) => {
      if (press.key === ' ' && !press.onControl) {
        press.preventDefault();
        toggleFromSpace();
      }
    });
  }, [manual]);

  const tapMicrophone = () => {
    if (!capturing) {
      microphone.start();
      return;
    }
    togglePause();
  };

  const view = reading.view;
  const position = Math.min(view.position, tokens.length);
  const screen = pages[screenPageOf(pages, Math.min(position, tokens.length - 1))];
  const problem =
    microphone.state === 'denied' ||
    microphone.state === 'unavailable' ||
    microphone.state === 'error'
      ? microphone.state
      : null;
  const micState: MicState =
    microphone.state === 'denied'
      ? 'denied'
      : capturing && !reading.paused
        ? 'listening'
        : 'paused';
  const bubble =
    reading.helpSyllables !== null ? (
      <>
        {tr.read.helpLead} <strong>{reading.helpSyllables.join('-')}</strong>
      </>
    ) : problem !== null ? (
      <MicrophoneProblem
        kind={problem}
        onRetry={() => {
          setRetried(true);
          microphone.start();
        }}
        // A retry that did not help lets the day go on unheard (P14).
        afterRetry={
          retried
            ? {
                label: tr.microphoneProblem.readUnheard,
                onChoose: () => {
                  store
                    .getState()
                    .continueUnheard()
                    .catch(() => undefined);
                },
              }
            : undefined
        }
      />
    ) : undefined;
  const pauseLabel = reading.paused ? tr.read.resume : tr.read.pause;
  const pauseIcon = reading.paused ? 'play' : 'pause';
  // The button ends a reading only once the child has read in it. The next reading starts as soon
  // as one is stored, so a tap after the text was read to its end, or a double tap's second, lands
  // on a reading that has just begun and would store it empty.
  const canFinish = view.position > 0 && view.ended === null;
  const finishReading = () => {
    if (canFinish) {
      reading.finish().catch(() => undefined);
    }
  };
  const micButton = (size: 76 | 84) => (
    <MicButton
      className={styles.mic}
      state={micState}
      labels={tr.mic}
      size={size}
      onClick={tapMicrophone}
    />
  );

  return (
    <SessionLayout
      title={tr.session.steps.read}
      chip={<Chip tone="saffronLight">{tr.read.attemptChip(attempt, readingsPerSession)}</Chip>}
      // The design's help moment keeps Tıkır listening while he says the word.
      companion={{ expression: 'listen', bubble }}
      controls={
        <div className={styles.side}>
          <div className={styles.counters}>
            <Chip>{tr.read.elapsed(formatClock(reading.elapsedMs))}</Chip>
            <Chip tone="turquoiseLight">{tr.read.correct(reading.counters.correct)}</Chip>
            <Chip tone="saffronLight">{tr.read.stuck(reading.counters.stuck)}</Chip>
          </div>
          <p className={styles.hint}>{tr.read.spaceHint}</p>
          <div className={styles.phoneControls}>
            <IconButton
              icon={pauseIcon}
              label={pauseLabel}
              size={52}
              raised
              onClick={togglePause}
            />
            {micButton(76)}
            <IconButton
              icon="flag"
              label={tr.read.finish}
              size={52}
              raised
              disabled={!canFinish}
              onClick={finishReading}
            />
          </div>
          <div className={styles.wideControls}>
            <Button variant="secondary" icon={pauseIcon} onClick={togglePause}>
              {pauseLabel}
            </Button>
            {micButton(84)}
            <Button variant="secondary" icon="flag" disabled={!canFinish} onClick={finishReading}>
              {tr.read.finish}
            </Button>
          </div>
        </div>
      }
    >
      {records && (
        // TODO(design): the recording mark is not drawn (docs/ekranlar.md, G4).
        <p className={styles.recording}>
          <span className={styles.recordingDot} aria-hidden="true" />
          {tr.read.recording}
        </p>
      )}
      {screen !== undefined && (
        <PageCard
          className={styles.page}
          title={pageTitle(data, chapter)}
          counter={tr.page.counter(pages.indexOf(screen) + 1, pages.length)}
        >
          <ReadingStyleScope style={data.child.readingStyle}>
            <ReadingText
              page={screen.page}
              firstIndex={screen.firstIndex}
              currentIndex={view.ended === null ? view.position : null}
              ghostIndex={reading.ghostIndex}
              readCount={Math.max(0, position - screen.firstIndex)}
              marks={reading.marks}
            />
          </ReadingStyleScope>
        </PageCard>
      )}
      <div className={styles.race}>
        <RaceBar
          progress={position / tokens.length}
          ghost={reading.ghostIndex === null ? null : reading.ghostIndex / tokens.length}
          youLabel={tr.race.you}
          ghostLabel={tr.race.ghost}
        />
        {reading.raceLead !== null && (
          <p className={styles.raceSentence}>{tr.read.raceLead(reading.raceLead)}</p>
        )}
      </div>
    </SessionLayout>
  );
}

/** The unheard reading (docs/kararlar.md P13): the whole text, read aloud without listening. */
function UnheardReading({ attempt, data, chapter }: ReadingProps) {
  const store = useSessionStore();
  const page = useMemo(() => chapter.pages.flat(), [chapter]);
  const wordCount = useMemo(() => tokenizePage(page).length, [page]);
  const finish = () => {
    store
      .getState()
      .skipUnheardReading()
      .catch(() => undefined);
  };
  const micLabels = { ...tr.mic, denied: tr.mic.listeningOff };
  const micButton = (size: 76 | 84) => (
    <MicButton className={styles.mic} state="denied" labels={micLabels} size={size} aria-disabled />
  );

  return (
    <SessionLayout
      title={tr.session.steps.read}
      chip={<Chip tone="saffronLight">{tr.read.attemptChip(attempt, readingsPerSession)}</Chip>}
      companion={{ expression: 'listen', bubble: tr.read.unheardBubble }}
      controls={
        <>
          <div className={styles.phoneControls}>
            {micButton(76)}
            <IconButton icon="flag" label={tr.read.finish} size={52} raised onClick={finish} />
          </div>
          <div className={styles.wideControls}>
            {micButton(84)}
            <Button variant="secondary" icon="flag" onClick={finish}>
              {tr.read.finish}
            </Button>
          </div>
        </>
      }
    >
      {/* TODO(design): the unheard reading is not drawn; the whole chapter is one page. */}
      <PageCard className={styles.page} title={pageTitle(data, chapter)}>
        <ReadingStyleScope style={data.child.readingStyle}>
          <ReadingText page={page} readCount={wordCount} />
        </ReadingStyleScope>
      </PageCard>
    </SessionLayout>
  );
}
