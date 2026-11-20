// G2 Isınma (docs/ekranlar.md, G2; docs/planlar/faz-2b.md, karar 12): the stuck words before the
// text. Each card is read as a one-word reading; a wrong first try gets Tıkır's reading and one
// more try, and only the first try scores the card.
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { MicButton, type MicState } from '../../components/MicButton/MicButton';
import { Monster } from '../../components/Monster/Monster';
import {
  isWarmupCorrect,
  remainingToTame,
  type WarmupItem,
  warmupItems,
} from '../../domain/stuckWords';
import { tr } from '../../i18n/tr';
import type { ListenerOutcome } from '../../services/listener/types';
import { narrationTiming, type Narrator } from '../../services/narrator/Narrator';
import { useMicrophone } from '../reading/useMicrophone';
import { useReading } from '../reading/useReading';
import { useExitDialogOpen } from './exitDialogState';
import { MicrophoneProblem } from './MicrophoneProblem';
import { useSession, useSessionDevices, useSessionStore } from './sessionContext';
import { SessionLayout } from './SessionLayout';
import { placeOf } from './sessionMachine';
import { SyllableTiles } from './SyllableTiles';
import { useManualKeys } from './useManualKeys';
import { useNarrator } from './useNarrator';
import { chapterWarmupSource, monsterKindOf, warmupToken } from './views';
import styles from './WarmupPage.module.css';

const streakSlots = [0, 1, 2] as const;

export function WarmupPage() {
  const data = useSession((state) => state.data);
  const narrator = useNarrator();
  // The card whose first try ended in help: Tıkır has just read it, the second try starts at once.
  const [helpedCard, setHelpedCard] = useState<number | null>(null);

  const session = data?.session ?? null;
  const chapter = data?.chapter ?? null;
  const place = session === null ? null : placeOf(session);
  if (data === null || session === null || chapter === null || place?.step !== 'warmup') {
    return null;
  }
  const items = warmupItems(session.warmup?.words ?? [], data.cards, chapterWarmupSource(chapter));
  const item = items[place.card];
  if (item === undefined || narrator === null) {
    return <SessionLayout title={tr.session.steps.warmup} companion={{ expression: 'listen' }} />;
  }
  return (
    <WarmupAttempt
      key={`${String(place.card)}-${place.secondAttempt ? 'second' : 'first'}`}
      item={item}
      card={place.card}
      total={items.length}
      secondAttempt={place.secondAttempt}
      heard={data.parent.consent.voiceProcessing}
      narrator={narrator}
      helpedFirst={helpedCard === place.card}
      onHelped={() => {
        setHelpedCard(place.card);
      }}
    />
  );
}

interface WarmupAttemptProps {
  item: WarmupItem;
  card: number;
  total: number;
  secondAttempt: boolean;
  /** The parent's consent: without it the session is unheard (docs/kararlar.md P13). */
  heard: boolean;
  narrator: Narrator;
  helpedFirst: boolean;
  onHelped: () => void;
}

/** One try at one card; a new try is a new listener, so the parent keys this by card and try. */
function WarmupAttempt({
  item,
  card,
  total,
  secondAttempt,
  heard,
  narrator,
  helpedFirst,
  onHelped,
}: WarmupAttemptProps) {
  const store = useSessionStore();
  const devices = useSessionDevices();
  const exitOpen = useExitDialogOpen();
  const microphone = useMicrophone(devices.audio, heard);
  const [choice] = useState(() => devices.listener('warmup', 1));
  const tokens = useMemo(() => [warmupToken(item)], [item]);
  const [userPaused, setUserPaused] = useState(false);
  const userPausedNow = useRef(false);
  const [narrationStartedAt, setNarrationStartedAt] = useState<number | null>(null);
  const narrations = useRef(0);
  // Before the second try Tıkır reads the word, unless the first try ended in his help.
  const [intro, setIntro] = useState(heard && secondAttempt && !helpedFirst);

  const finish = (outcome: ListenerOutcome) => {
    const status = outcome.words[0]?.status;
    if (status === undefined) {
      return;
    }
    if (secondAttempt) {
      store
        .getState()
        .nextWarmupCard()
        .catch(() => undefined);
      return;
    }
    if (status === 'helped') {
      onHelped();
    }
    store
      .getState()
      .answerWarmupCard(isWarmupCorrect(status))
      .catch(() => undefined);
  };

  const reading = useReading({
    listener: choice.listener,
    audio: devices.audio,
    narrator,
    tokens,
    ghostPaceWpm: null,
    onFinish: finish,
  });
  useManualKeys(heard ? choice.mark : undefined);

  useEffect(() => {
    userPausedNow.current = userPaused;
  }, [userPaused]);

  /** Tıkır reads the word; the syllables follow him. Only the latest reading updates the tiles. */
  const speak = async (): Promise<void> => {
    narrations.current += 1;
    const narration = narrations.current;
    setNarrationStartedAt(performance.now());
    try {
      await narrator.speakWord(item.spoken);
    } finally {
      if (narrations.current === narration) {
        setNarrationStartedAt(null);
      }
    }
  };

  const speakIntro = useEffectEvent(() => speak());
  useEffect(() => {
    if (!intro) {
      return undefined;
    }
    let current = true;
    // Started a step later, so the effect itself sets no state.
    void Promise.resolve()
      .then(() => (current ? speakIntro() : undefined))
      .then(() => {
        if (current) {
          setIntro(false);
        }
      });
    return () => {
      current = false;
      narrator.stop();
    };
  }, [intro, narrator]);

  const capturing = microphone.state === 'capturing';
  const startReading = useEffectEvent(() => {
    reading.start().catch(() => undefined);
  });
  useEffect(() => {
    if (heard && !intro && capturing && !exitOpen) {
      startReading();
    }
  }, [heard, intro, capturing, exitOpen]);

  // The exit dialog holds the reading and Tıkır's voice while it is open.
  const holdForExit = useEffectEvent((open: boolean) => {
    if (open) {
      reading.pause();
      narrator.pause();
    } else {
      narrator.resume();
      if (!userPausedNow.current) {
        reading.resume();
      }
    }
  });
  useEffect(() => {
    holdForExit(exitOpen);
  }, [exitOpen]);

  const listenToWord = () => {
    if (narrationStartedAt !== null || intro) {
      return;
    }
    reading.pause();
    void speak().then(() => {
      if (!userPausedNow.current) {
        reading.resume();
      }
    });
  };

  const tapMicrophone = () => {
    if (!heard) {
      return;
    }
    if (!capturing) {
      microphone.start();
      return;
    }
    if (userPaused) {
      setUserPaused(false);
      if (narrationStartedAt === null) {
        reading.resume();
      }
    } else {
      setUserPaused(true);
      reading.pause();
    }
  };

  const last = card === total - 1;
  const forward = () => {
    const state = store.getState();
    const step = heard ? state.skipWarmup() : state.nextWarmupCard();
    step.catch(() => undefined);
  };
  const forwardLabel = heard || last ? tr.warmup.next : tr.warmup.nextWord;
  const forwardShortLabel = heard || last ? tr.warmup.nextShort : tr.warmup.nextWord;

  const problem =
    heard &&
    (microphone.state === 'denied' ||
      microphone.state === 'unavailable' ||
      microphone.state === 'error')
      ? microphone.state
      : null;
  const micState: MicState =
    !heard || microphone.state === 'denied'
      ? 'denied'
      : capturing && !userPaused
        ? 'listening'
        : 'paused';
  const micLabels = { ...tr.mic, denied: heard ? tr.mic.denied : tr.mic.listeningOff };
  const bubble =
    problem !== null ? (
      <MicrophoneProblem
        kind={problem}
        onRetry={() => {
          microphone.start();
        }}
      />
    ) : heard ? (
      tr.warmup.bubble
    ) : (
      tr.warmup.unheardBubble
    );

  const micButton = (size: 76 | 84) => (
    <MicButton
      className={styles.mic}
      state={micState}
      labels={micLabels}
      size={size}
      aria-disabled={heard ? undefined : true}
      onClick={tapMicrophone}
    />
  );

  return (
    <SessionLayout
      title={tr.session.steps.warmup}
      chip={<Chip tone="saffronLight">{tr.warmup.wordCount(total)}</Chip>}
      companion={{ expression: 'listen', bubble }}
      controls={
        <>
          <div className={styles.phoneControls}>
            <IconButton
              icon="volume"
              label={tr.warmup.listen}
              size={52}
              raised
              onClick={listenToWord}
            />
            {micButton(76)}
            <IconButton icon="right" label={forwardShortLabel} size={52} raised onClick={forward} />
          </div>
          <div className={styles.wideControls}>
            <Button variant="secondary" icon="volume" onClick={listenToWord}>
              {tr.warmup.listen}
            </Button>
            {micButton(84)}
            <Button variant="secondary" icon="right" onClick={forward}>
              {forwardLabel}
            </Button>
          </div>
        </>
      }
    >
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <Monster
            className={styles.monster}
            kind={monsterKindOf(item.word)}
            state="wild"
            size={92}
          />
          <div className={styles.cardInfo}>
            <p className={styles.counter}>{tr.warmup.cardCounter(card + 1, total)}</p>
            {item.card !== null && (
              <>
                <div className={styles.dots} aria-hidden="true">
                  {streakSlots.map((slot) => (
                    <span
                      key={slot}
                      className={styles.dot}
                      data-filled={
                        item.card !== null && slot < item.card.correctStreak ? '' : undefined
                      }
                    />
                  ))}
                </div>
                <p className={styles.remaining}>
                  {tr.warmup.remaining(remainingToTame(item.card))}
                </p>
              </>
            )}
          </div>
        </div>
        <p className={styles.word}>{item.word}</p>
        <SyllableTiles
          syllables={item.syllables}
          narrationStartedAt={narrationStartedAt}
          syllableMs={1000 / narrationTiming.syllablesPerSecond[narrator.rate]}
          label={tr.warmup.syllablesLabel}
        />
        {item.chain.length > 0 && (
          <div className={styles.chain}>
            <p className={styles.counter}>{tr.warmup.chainLabel}</p>
            <ol className={styles.chainList}>
              {item.chain.map((step, index) => {
                const known = index < item.chain.length - 1;
                return (
                  <li key={step} className={styles.chainItem}>
                    <span className={styles.chainChip} data-known={known ? '' : undefined}>
                      {known && <Icon name="check" size={16} strokeWidth={3} />}
                      <span>{step}</span>
                    </span>
                    {known && <Icon name="right" size={16} />}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </SessionLayout>
  );
}
