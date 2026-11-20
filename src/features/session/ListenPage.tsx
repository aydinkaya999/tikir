// G3 Dinle (docs/ekranlar.md, G3; docs/planlar/faz-2b.md, karar 13): Tıkır reads the chapter, the
// page split into phrase units; the child reads only after hearing it once (rule 2).
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { IconButton } from '../../components/IconButton/IconButton';
import { PageCard } from '../../components/PageCard/PageCard';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import type { NarrationRate } from '../../domain/types';
import { tr } from '../../i18n/tr';
import type { Narrator } from '../../services/narrator/Narrator';
import { screenPages } from '../reading/pages';
import { PhraseText } from '../reading/PhraseText';
import { useMicrophone } from '../reading/useMicrophone';
import { useNarration } from '../reading/useNarration';
import { useExitDialogOpen } from './exitDialogState';
import { formatClock } from './format';
import styles from './ListenPage.module.css';
import { useSession, useSessionDevices, useSessionStore } from './sessionContext';
import { SessionLayout } from './SessionLayout';
import { useNarrator } from './useNarrator';

const rates: readonly NarrationRate[] = ['slow', 'normal'];

export function ListenPage() {
  const narrator = useNarrator();
  if (narrator === null) {
    return <SessionLayout title={tr.session.steps.listen} companion={{ expression: 'talk' }} />;
  }
  return <Listening narrator={narrator} />;
}

function Listening({ narrator }: { narrator: Narrator }) {
  const data = useSession((state) => state.data);
  const store = useSessionStore();
  const devices = useSessionDevices();
  const exitOpen = useExitDialogOpen();
  const consent = data?.parent.consent.voiceProcessing ?? false;
  const microphone = useMicrophone(devices.audio, consent);
  const chapter = data?.chapter ?? null;
  const pages = useMemo(
    () => (chapter === null ? [] : screenPages(chapter, devices.scenario.layout)),
    [chapter, devices.scenario.layout],
  );
  const narration = useNarration({ narrator, pages });
  const [rate, setRate] = useState<NarrationRate>(data?.child.narrationRate ?? 'slow');
  // Paused by the child (not finished): the button resumes instead of starting over.
  const [held, setHeld] = useState(false);
  const heldForExit = useRef(false);

  const begin = useEffectEvent(() => {
    narration.setRate(rate);
    narration.play();
  });
  useEffect(() => {
    begin();
  }, []);

  const holdForExit = useEffectEvent((open: boolean) => {
    if (open && narration.playing) {
      heldForExit.current = true;
      narration.pause();
    } else if (!open && heldForExit.current) {
      heldForExit.current = false;
      narration.resume();
    }
  });
  useEffect(() => {
    holdForExit(exitOpen);
  }, [exitOpen]);

  if (data === null || chapter === null) {
    return null;
  }
  const screen = pages[narration.pageIndex];

  const togglePlayback = () => {
    if (narration.playing) {
      narration.pause();
      setHeld(true);
    } else if (held) {
      narration.resume();
      setHeld(false);
    } else {
      narration.play();
    }
  };

  const chooseRate = (next: NarrationRate) => {
    setRate(next);
    narration.setRate(next);
    store
      .getState()
      .setNarrationRate(next)
      .catch(() => undefined);
  };

  // The tap that leads into the reading opens the microphone (docs/kararlar.md T22).
  const startReading = () => {
    microphone.start();
    store
      .getState()
      .finishListening()
      .catch(() => undefined);
  };

  const restart = () => {
    setHeld(false);
    narration.restart();
  };

  const startButton = (
    <Button
      icon="mic"
      size="large"
      fullWidth
      disabled={!narration.finishedOnce}
      onClick={startReading}
    >
      {tr.listen.start}
    </Button>
  );

  return (
    <SessionLayout
      title={tr.session.steps.listen}
      chip={<Chip tone="saffronLight">{tr.listen.chip}</Chip>}
      companion={{ expression: 'talk', bubble: tr.listen.bubble }}
      controls={
        <>
          <div className={styles.phoneControls}>
            <IconButton
              icon="repeat"
              label={tr.listen.restart}
              size={52}
              raised
              onClick={restart}
            />
            <div className={styles.grow}>{startButton}</div>
          </div>
          <div className={styles.wideControls}>
            <Button variant="secondary" icon="repeat" onClick={restart}>
              {tr.listen.restart}
            </Button>
            <div>{startButton}</div>
          </div>
        </>
      }
    >
      <PageCard
        className={styles.page}
        title={tr.page.title(data.series.title, chapter.number)}
        counter={tr.page.counter(narration.pageIndex + 1, pages.length)}
      >
        {screen !== undefined && (
          <PhraseText
            page={screen.page}
            currentUnit={narration.currentUnit}
            readUnits={narration.readUnits}
          />
        )}
        <div className={styles.player}>
          <IconButton
            icon={narration.playing ? 'pause' : 'play'}
            label={narration.playing ? tr.listen.pause : tr.listen.resume}
            size={46}
            tone="saffron"
            onClick={togglePlayback}
          />
          <ProgressBar
            className={styles.progress}
            label={tr.listen.progressLabel}
            value={narration.elapsedMs}
            max={narration.totalMs}
          />
          <p className={styles.time}>
            {tr.listen.time(formatClock(narration.elapsedMs), formatClock(narration.totalMs))}
          </p>
          <div className={styles.rates} role="group" aria-label={tr.listen.rateLabel}>
            {rates.map((each) => (
              <button
                key={each}
                type="button"
                className={styles.rate}
                aria-pressed={rate === each}
                onClick={() => {
                  chooseRate(each);
                }}
              >
                {each === 'slow' ? tr.listen.slow : tr.listen.normal}
              </button>
            ))}
          </div>
        </div>
      </PageCard>
    </SessionLayout>
  );
}
