// K3 Seviye tespiti (docs/ekranlar.md, K3; docs/planlar/faz-3.md, kararlar 14–18): the child reads
// the grade's first measurement text for one minute of reading time. The listener follows, Tıkır
// helps at three seconds and the page turns with the reading; at the minute or at "Okumayı bitir"
// the reading is stored, recorded, as the first measurement. A microphone that a retry does not
// bring back lets the level check be skipped (docs/kararlar.md P14).
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import { MicButton, type MicState } from '../../components/MicButton/MicButton';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import { assessmentGraceMs, assessmentMs } from '../../domain/config';
import { chapterTokens, passageChapter } from '../../domain/text';
import type { Child, Passage } from '../../domain/types';
import { tr } from '../../i18n/tr';
import type { ListenerOutcome } from '../../services/listener/types';
import type { Narrator } from '../../services/narrator/Narrator';
import { screenPageOf, screenPages } from '../reading/pages';
import { ReadingStyleScope } from '../reading/ReadingStyleScope';
import { ReadingText } from '../reading/ReadingText';
import { useMicrophone } from '../reading/useMicrophone';
import { useReading } from '../reading/useReading';
import { useReadingRecorder } from '../reading/useReadingRecorder';
import { formatClock } from '../session/format';
import { MicrophoneProblem } from '../session/MicrophoneProblem';
import { useSession, useSessionDevices, useSessionStore } from '../session/sessionContext';
import { useManualKeys } from '../session/useManualKeys';
import { useNarrator } from '../session/useNarrator';
import styles from './LevelPage.module.css';
import { OnboardingLayout } from './OnboardingLayout';

const copy = tr.onboarding.level;

export function LevelPage() {
  const setup = useSession((state) => state.setup);
  const narrator = useNarrator();
  const child = setup?.child ?? null;
  const passage = setup?.passage ?? null;
  if (setup?.step !== 'level' || child === null || passage === null) {
    // The setup guard takes any other step to its own address.
    return null;
  }
  if (narrator === null) {
    return (
      <OnboardingLayout
        step={3}
        title={copy.title}
        lead={copy.lead(child.name)}
        companion={{ expression: 'listen' }}
      />
    );
  }
  return (
    <LevelCheck
      child={child}
      passage={passage}
      narrator={narrator}
      consent={setup.parent?.consent.voiceProcessing ?? false}
    />
  );
}

interface LevelCheckProps {
  child: Child;
  passage: Passage;
  narrator: Narrator;
  consent: boolean;
}

function LevelCheck({ child, passage, narrator, consent }: LevelCheckProps) {
  const store = useSessionStore();
  const devices = useSessionDevices();
  const microphone = useMicrophone(devices.audio, consent);
  const [choice] = useState(() => devices.listener('assessment', 1));
  const chapter = useMemo(() => passageChapter(passage), [passage]);
  const tokens = useMemo(() => chapterTokens(chapter), [chapter]);
  const pages = useMemo(() => screenPages(chapter), [chapter]);
  const startedAt = useRef<string | null>(null);
  const [retried, setRetried] = useState(false);

  /** The reading ended: its recording stops, and it is stored as the first measurement. */
  const finish = (outcome: ListenerOutcome) => {
    const save = async () => {
      const recordingId = await readingRecorder.finish();
      // The words of the minute count over the minute, a word finished in its grace included.
      const minute = { ...outcome, seconds: Math.min(outcome.seconds, assessmentMs / 1000) };
      await store.getState().saveBaseline(minute, {
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
    // No ghost in the level check (karar 15).
    ghostPaceWpm: null,
    onFinish: finish,
  });
  useManualKeys(choice.mark);

  const capturing = microphone.state === 'capturing';
  // With the parent's consent the reading is recorded (V3 plays it in phase 4).
  const readingRecorder = useReadingRecorder({
    enabled: consent,
    recorder: devices.recorder,
    audio: devices.audio,
    running:
      capturing && !reading.paused && reading.helpIndex === null && reading.view.ended === null,
  });
  // The reading starts once the microphone listens (K2's tap opened it, T22).
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
    if (capturing) {
      begin();
    }
  }, [capturing]);

  // The minute is reading time: pauses and Tıkır's help stay out of it. At its end the reading
  // stops by itself, a moment later, so the word being finished counts.
  const timeUp = reading.elapsedMs >= assessmentMs;
  const endAtTheMinute = useEffectEvent(() => {
    reading.finish().catch(() => undefined);
  });
  useEffect(() => {
    if (!timeUp) {
      return undefined;
    }
    const timer = setTimeout(() => {
      endAtTheMinute();
    }, assessmentGraceMs);
    return () => {
      clearTimeout(timer);
    };
  }, [timeUp]);

  const view = reading.view;
  const position = Math.min(view.position, tokens.length);
  const shown = pages[screenPageOf(pages, Math.min(position, tokens.length - 1))];
  const elapsedMs = Math.min(reading.elapsedMs, assessmentMs);
  // The countdown shows a second until it has fully passed: "1:00" at the start.
  const remaining = formatClock(Math.ceil((assessmentMs - elapsedMs) / 1000) * 1000);

  const problem =
    microphone.state === 'denied' ||
    microphone.state === 'unavailable' ||
    microphone.state === 'error'
      ? microphone.state
      : null;
  const retry = () => {
    setRetried(true);
    microphone.start();
  };
  const skip = () => {
    store
      .getState()
      .skipBaseline()
      .catch(() => undefined);
  };
  const bubble =
    reading.helpSyllables !== null ? (
      <>
        {tr.read.helpLead} <strong>{reading.helpSyllables.join('-')}</strong>
      </>
    ) : problem !== null ? (
      <MicrophoneProblem
        kind={problem}
        onRetry={retry}
        afterRetry={retried ? { label: copy.skip, onChoose: skip } : undefined}
      />
    ) : (
      copy.bubble
    );

  const micState: MicState =
    microphone.state === 'denied'
      ? 'denied'
      : capturing && !reading.paused
        ? 'listening'
        : 'paused';
  const tapMicrophone = () => {
    if (!capturing) {
      microphone.start();
    } else if (reading.paused) {
      reading.resume();
    } else {
      reading.pause();
    }
  };
  // The button ends the reading only once the child has read in it (G4's rule).
  const canFinish = view.position > 0 && view.ended === null;
  const finishEarly = () => {
    if (canFinish) {
      reading.finish().catch(() => undefined);
    }
  };

  return (
    <OnboardingLayout
      step={3}
      title={copy.title}
      lead={copy.lead(child.name)}
      companion={{ expression: 'listen', bubble, phone: problem !== null }}
      action={
        <div className={styles.controls}>
          <MicButton
            className={styles.mic}
            state={micState}
            labels={tr.mic}
            size={72}
            onClick={tapMicrophone}
          />
          <Button
            className={styles.finish}
            variant="secondary"
            size="large"
            icon="flag"
            disabled={!canFinish}
            onClick={finishEarly}
          >
            {copy.finish}
          </Button>
        </div>
      }
    >
      <div className={styles.card}>
        {shown !== undefined && (
          // The reading moves as on G4 (read, current, ahead), without marks: the level check
          // shows no mistakes (the design; "Hata yapması sorun değil").
          <ReadingStyleScope style={child.readingStyle}>
            <ReadingText
              page={shown.page}
              firstIndex={shown.firstIndex}
              currentIndex={view.ended === null ? view.position : null}
              readCount={Math.max(0, position - shown.firstIndex)}
            />
          </ReadingStyleScope>
        )}
        <div className={styles.timer}>
          <Icon name="clock" size={22} strokeWidth={2.2} />
          <ProgressBar
            className={styles.bar}
            label={copy.elapsed}
            value={Math.floor(elapsedMs / 1000)}
            max={assessmentMs / 1000}
          />
          <p className={styles.remaining}>{copy.remaining(remaining)}</p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
