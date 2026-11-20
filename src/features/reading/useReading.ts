// The reading step's engine (docs/dinleme-hatti.md, section 2; docs/planlar/faz-2a.md, karar 5):
// the listener's events become the screen's view; at the help threshold Tıkır reads the word; the
// clock and the ghost run only while the child is reading. Opening the microphone is the caller's
// job (useMicrophone), behind the parent's consent.
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { helpThresholdMs } from '../../domain/config';
import { ghostIndex, raceLead } from '../../domain/ghost';
import { type ChapterToken, syllabify } from '../../domain/text';
import type { AudioCapture } from '../../services/audio/AudioCapture';
import type {
  ListenerEvent,
  ListenerOutcome,
  ReadingListener,
} from '../../services/listener/types';
import type { Narrator } from '../../services/narrator/Narrator';
import { notifyAll } from '../../services/notify';
import type { Unsubscribe } from '../../services/types';
import {
  initialReadingView,
  readingCounters,
  reduceReading,
  type ReadingView,
  wordMarks,
} from './readingState';
import type { WordMark } from './ReadingText';

/** How often the clock on screen moves. */
export const readingClockTickMs = 250;

export interface UseReadingOptions {
  /**
   * The listener, the microphone and the narrator identify the reading: keep the same instances
   * for the whole reading (a new listener is a new reading).
   */
  listener: ReadingListener;
  audio: AudioCapture;
  narrator: Narrator;
  /** May be a fresh array on every render; read when the reading starts and when help opens. */
  tokens: readonly ChapterToken[];
  /** The earlier reading's pace; null on the first day (no ghost). */
  ghostPaceWpm: number | null;
  onFinish: (outcome: ListenerOutcome) => void;
  now?: () => number;
}

export interface ReadingController {
  view: ReadingView;
  marks: Partial<Record<number, WordMark>>;
  counters: { correct: number; stuck: number };
  /** Reading time, pauses and help excluded. */
  elapsedMs: number;
  ghostIndex: number | null;
  raceLead: number | null;
  helpIndex: number | null;
  helpSyllables: string[] | null;
  paused: boolean;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  finish(): Promise<void>;
}

interface Snapshot {
  view: ReadingView;
  elapsedMs: number;
  paused: boolean;
}

const defaultNow = () => performance.now();

/** One reading: the imperative side of useReading, kept out of React's render. */
class ReadingRun {
  private readonly listener: ReadingListener;
  private readonly audio: AudioCapture;
  private readonly narrator: Narrator;
  private readonly tokens: { readonly current: readonly ChapterToken[] };
  /** The start in progress or done; a second start() shares it. */
  private starting: Promise<void> | null = null;
  private readonly now: { readonly current: () => number };
  private readonly onFinish: { readonly current: (outcome: ListenerOutcome) => void };
  private readonly subscribers = new Set<() => void>();
  private view: ReadingView = initialReadingView;
  private snapshot: Snapshot = { view: initialReadingView, elapsedMs: 0, paused: false };
  private started = false;
  private finished = false;
  private paused = false;
  private microphoneAway = false;
  /** The word Tıkır is reading, from the help threshold until the listener resumes. */
  private helping: number | null = null;
  private activeBefore = 0;
  private runningSince: number | null = null;
  private ticker: ReturnType<typeof setInterval> | undefined;

  constructor(
    options: Pick<UseReadingOptions, 'listener' | 'audio' | 'narrator'>,
    tokens: { readonly current: readonly ChapterToken[] },
    now: { readonly current: () => number },
    onFinish: { readonly current: (outcome: ListenerOutcome) => void },
  ) {
    this.listener = options.listener;
    this.audio = options.audio;
    this.narrator = options.narrator;
    this.tokens = tokens;
    this.now = now;
    this.onFinish = onFinish;
  }

  readonly subscribe = (callback: () => void): Unsubscribe => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  readonly getSnapshot = (): Snapshot => this.snapshot;

  /** Follows the listener and the microphone; on detach a started reading is stopped. */
  attach(): Unsubscribe {
    const offEvents = this.listener.on(this.handle);
    const offMicrophone = this.audio.onStateChange((state) => {
      this.microphoneAway = state !== 'capturing';
      this.sync();
    });
    return () => {
      offEvents();
      offMicrophone();
      this.narrator.stop();
      if (this.started && !this.finished) {
        this.finished = true;
        void this.listener.stop();
      }
      this.freeze();
    };
  }

  /** A double tap starts once; a start refused (no microphone) can be tried again. */
  start(): Promise<void> {
    this.starting ??= this.begin().catch((error: unknown) => {
      this.starting = null;
      throw error;
    });
    return this.starting;
  }

  private async begin(): Promise<void> {
    await this.listener.start(
      this.tokens.current.map((token) => token.spoken),
      this.audio,
    );
    this.started = true;
    this.microphoneAway = this.audio.state !== 'capturing';
    this.sync();
  }

  pause(): void {
    if (!this.started || this.finished || this.paused) {
      return;
    }
    this.paused = true;
    this.listener.pause();
    if (this.helping !== null) {
      this.narrator.pause();
    }
    this.sync();
  }

  resume(): void {
    if (!this.paused || this.finished) {
      return;
    }
    this.paused = false;
    // During a help the listener resumes when Tıkır has read the word.
    if (this.helping !== null) {
      this.narrator.resume();
    } else {
      this.listener.resume();
    }
    this.sync();
  }

  async finish(): Promise<void> {
    if (!this.started || this.finished) {
      return;
    }
    this.finished = true;
    if (this.helping !== null) {
      this.helping = null;
      this.narrator.stop();
    }
    this.sync();
    const outcome = await this.listener.stop();
    notifyAll([this.onFinish.current], outcome);
  }

  private readonly handle = (event: ListenerEvent): void => {
    this.view = reduceReading(this.view, event);
    if (
      event.type === 'hesitation' &&
      event.ms >= helpThresholdMs &&
      this.view.helpIndex === event.index &&
      this.helping === null &&
      !this.finished
    ) {
      this.openHelp(event.index);
    }
    if (event.type === 'end' && event.reason === 'completed') {
      void this.finish();
    }
    this.sync();
  };

  /** Pauses the listener at the word, reads it, then lets the listener go on. */
  private openHelp(index: number): void {
    this.helping = index;
    this.sync();
    this.listener.help(index);
    // However the narration ends (read, cut short, failed), the reading must go on.
    const release = () => {
      if (this.finished || this.helping !== index) {
        return;
      }
      this.helping = null;
      // A paused child resumes the listener with resume().
      if (!this.paused) {
        this.listener.resume();
      }
      this.sync();
    };
    this.narrator.speakWord(this.tokens.current[index]?.spoken ?? '').then(release, release);
  }

  private elapsed(): number {
    return (
      this.activeBefore + (this.runningSince === null ? 0 : this.now.current() - this.runningSince)
    );
  }

  private freeze(): void {
    if (this.runningSince !== null) {
      this.activeBefore = this.elapsed();
      this.runningSince = null;
    }
    clearInterval(this.ticker);
    this.ticker = undefined;
  }

  /** Runs the clock exactly while the child is reading, then publishes. */
  private sync(): void {
    const running =
      this.started &&
      !this.finished &&
      !this.paused &&
      !this.microphoneAway &&
      this.helping === null;
    if (running && this.runningSince === null) {
      this.runningSince = this.now.current();
      this.ticker = setInterval(() => {
        this.publish();
      }, readingClockTickMs);
    } else if (!running) {
      this.freeze();
    }
    this.publish();
  }

  private publish(): void {
    const next: Snapshot = { view: this.view, elapsedMs: this.elapsed(), paused: this.paused };
    const current = this.snapshot;
    if (
      next.view === current.view &&
      next.elapsedMs === current.elapsedMs &&
      next.paused === current.paused
    ) {
      return;
    }
    this.snapshot = next;
    notifyAll<undefined>(this.subscribers, undefined);
  }
}

export function useReading(options: UseReadingOptions): ReadingController {
  const { listener, audio, narrator, tokens, ghostPaceWpm, onFinish } = options;
  const now = useRef(options.now ?? defaultNow);
  const finishCallback = useRef(onFinish);
  useEffect(() => {
    finishCallback.current = onFinish;
  }, [onFinish]);

  const words = useRef(tokens);
  useEffect(() => {
    words.current = tokens;
  }, [tokens]);

  const run = useMemo(
    () => new ReadingRun({ listener, audio, narrator }, words, now, finishCallback),
    [listener, audio, narrator],
  );
  useEffect(() => run.attach(), [run]);
  const { view, elapsedMs, paused } = useSyncExternalStore(run.subscribe, run.getSnapshot);

  const marks = useMemo(() => wordMarks(view), [view]);
  const counters = useMemo(() => readingCounters(view), [view]);
  const ghost = ghostPaceWpm === null ? null : ghostIndex(ghostPaceWpm, elapsedMs, tokens.length);
  const helpWord = view.helpIndex === null ? undefined : tokens[view.helpIndex];

  return {
    view,
    marks,
    counters,
    elapsedMs,
    ghostIndex: ghost,
    raceLead: raceLead(view.position, ghost),
    helpIndex: view.helpIndex,
    helpSyllables: helpWord === undefined ? null : syllabify(helpWord.spoken),
    paused,
    start: () => run.start(),
    pause: () => {
      run.pause();
    },
    resume: () => {
      run.resume();
    },
    finish: () => run.finish(),
  };
}
