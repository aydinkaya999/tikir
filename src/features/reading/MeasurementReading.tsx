// The timed one-minute reading of K3 and of the weekly measurement (docs/planlar/faz-3.md, kararlar
// 14–18; docs/planlar/faz-4.md, karar 32): the listener follows, Tıkır helps at three seconds and
// the page turns with the reading; at the minute (P15) or at "Okumayı bitir" the reading ends and
// is recorded with the parent's consent. The caller lays out the parts and keeps the result.
import { type ReactNode, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import { MicButton, type MicState } from '../../components/MicButton/MicButton';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import { assessmentGraceMs, assessmentMs } from '../../domain/config';
import { chapterTokens, passageChapter } from '../../domain/text';
import type { Id, Passage, ReadingOutcome, ReadingStyle } from '../../domain/types';
import { tr } from '../../i18n/tr';
import type { ListenerOutcome } from '../../services/listener/types';
import type { Narrator } from '../../services/narrator/Narrator';
import { formatClock } from '../session/format';
import { MicrophoneProblem } from '../session/MicrophoneProblem';
import { useSessionDevices } from '../session/sessionContext';
import { useManualKeys } from '../session/useManualKeys';
import styles from './MeasurementReading.module.css';
import { screenPageOf, screenPages } from './pages';
import { ReadingStyleScope } from './ReadingStyleScope';
import { ReadingText } from './ReadingText';
import { useMicrophone } from './useMicrophone';
import { useReading } from './useReading';
import { useReadingRecorder } from './useReadingRecorder';

const copy = tr.onboarding.level;

export interface MeasurementParts {
  /** The text with the minute at its foot. */
  card: ReactNode;
  /** The microphone and "Okumayı bitir". */
  controls: ReactNode;
  /** Tıkır's words: the help, a microphone problem, or the caller's own line. */
  bubble: ReactNode;
  /** A microphone problem is shown: phones bring Tıkır's bubble to the content. */
  problem: boolean;
}

interface MeasurementReadingProps {
  passage: Passage;
  style: ReadingStyle;
  /** The parent's consent: with it the reading is recorded. */
  consent: boolean;
  narrator: Narrator;
  /** What Tıkır says while there is no help and no problem. */
  bubble: ReactNode;
  /**
   * The reading waits for a tap on the microphone even when it already listens (a trial week's
   * second reading). Otherwise it starts as soon as the microphone listens (K2's tap, T22).
   */
  startOnTap?: boolean;
  /** Offered once a retry did not bring the microphone back (K3: skipping the level check). */
  afterRetry?: { label: string; onChoose: () => void };
  /** The words of the minute, the reading's start and its recording, once the reading ends. */
  onFinish: (outcome: ReadingOutcome, meta: { startedAt: string; recordingId: Id | null }) => void;
  render: (parts: MeasurementParts) => ReactNode;
}

export function MeasurementReading({
  passage,
  style,
  consent,
  narrator,
  bubble,
  startOnTap = false,
  afterRetry,
  onFinish,
  render,
}: MeasurementReadingProps) {
  const devices = useSessionDevices();
  const microphone = useMicrophone(devices.audio, consent);
  const [choice] = useState(() => devices.listener('assessment', 1));
  const chapter = useMemo(() => passageChapter(passage), [passage]);
  const tokens = useMemo(() => chapterTokens(chapter), [chapter]);
  const pages = useMemo(() => screenPages(chapter), [chapter]);
  const startedAt = useRef<string | null>(null);
  const [retried, setRetried] = useState(false);
  // The second reading of a trial week waits for the child's tap (docs/planlar/faz-4.md, karar 32).
  const [armed, setArmed] = useState(!startOnTap);

  /** The reading ended: its recording stops and the caller keeps the minute's words. */
  const finish = (outcome: ListenerOutcome) => {
    const save = async () => {
      const recordingId = await readingRecorder.finish();
      // The words of the minute count over the minute, a word finished in its grace included.
      const minute = { ...outcome, seconds: Math.min(outcome.seconds, assessmentMs / 1000) };
      onFinish(minute, {
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
    // No ghost in a measurement (docs/planlar/faz-3.md, karar 15).
    ghostPaceWpm: null,
    onFinish: finish,
  });
  useManualKeys(choice.mark);

  const capturing = microphone.state === 'capturing';
  const readingRecorder = useReadingRecorder({
    enabled: consent,
    recorder: devices.recorder,
    audio: devices.audio,
    running:
      capturing && !reading.paused && reading.helpIndex === null && reading.view.ended === null,
  });
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
    if (capturing && armed) {
      begin();
    }
  }, [capturing, armed]);

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
  const said =
    reading.helpSyllables !== null ? (
      <>
        {tr.read.helpLead} <strong>{reading.helpSyllables.join('-')}</strong>
      </>
    ) : problem !== null ? (
      <MicrophoneProblem
        kind={problem}
        onRetry={retry}
        afterRetry={retried ? afterRetry : undefined}
      />
    ) : (
      bubble
    );

  const micState: MicState =
    microphone.state === 'denied'
      ? 'denied'
      : capturing && armed && !reading.paused
        ? 'listening'
        : 'paused';
  const tapMicrophone = () => {
    if (!capturing) {
      setArmed(true);
      microphone.start();
    } else if (!armed) {
      setArmed(true);
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

  return render({
    problem: problem !== null,
    bubble: said,
    controls: (
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
    ),
    card: (
      <div className={styles.card}>
        {shown !== undefined && (
          // The reading moves as on G4 (read, current, ahead), without marks: a measurement shows
          // no mistakes (K3's design; "Hata yapması sorun değil").
          <ReadingStyleScope style={style}>
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
    ),
  });
}
