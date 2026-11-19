// A reading listener without speech recognition (docs/dinleme-hatti.md, section 3). It plays a
// simulated reading on a clock that runs only while the microphone is capturing, the user has not
// paused and Tıkır is not reading a word for help; or, in the manual mode, a person marks each
// word. Either way the screens get the events a real listener will give.
import { helpThresholdMs } from '../../domain/config';
import type { WordResult } from '../../domain/types';
import type { AudioCapture } from '../audio/AudioCapture';
import { notifyAll } from '../notify';
import type { Unsubscribe } from '../types';
import { simulateReading, toWordResults, type Simulation } from './simulateReading';
import type { FakeScenario, ListenerEvent, ListenerOutcome, ReadingListener } from './types';

/** While a word is awaited, a hesitation event comes this often. */
export const hesitationEventIntervalMs = 500;

export type FakeListenerMode = { kind: 'scenario'; scenario?: FakeScenario } | { kind: 'manual' };

export type ManualMark = 'correct' | 'misread' | 'skipped' | 'hesitate';

const defaultScenario: FakeScenario = { wcpm: 60, miscues: [], hesitations: [] };

/** A step of the reading at an active time (ms from the start, pauses excluded). */
type Step =
  | { at: number; kind: 'hesitation'; index: number; ms: number }
  | { at: number; kind: 'word'; result: WordResult }
  /** The help threshold: the last hesitation event, then the listener waits for Tıkır. */
  | { at: number; kind: 'help'; result: WordResult };

function hesitationSteps(index: number, from: number, until: number): Step[] {
  const steps: Step[] = [];
  for (let ms = hesitationEventIntervalMs; ms < until; ms += hesitationEventIntervalMs) {
    steps.push({ at: from + ms, kind: 'hesitation', index, ms });
  }
  return steps;
}

function stepsOf(simulation: Simulation): Step[] {
  const results = toWordResults(simulation);
  const steps: Step[] = [];
  let previousEnd = 0;
  simulation.words.forEach((word, position) => {
    const result = results[position];
    if (result === undefined) {
      return;
    }
    if (word.status === 'helped') {
      steps.push(...hesitationSteps(word.index, previousEnd, word.hesitationMs));
      steps.push({ at: word.startMs, kind: 'help', result });
    } else {
      steps.push(...hesitationSteps(word.index, previousEnd, word.hesitationMs + 1));
      steps.push({ at: word.endMs, kind: 'word', result });
    }
    previousEnd = word.endMs;
  });
  return steps;
}

export class FakeListener implements ReadingListener {
  private readonly mode: FakeListenerMode;
  private readonly now: () => number;
  private readonly listeners = new Set<(event: ListenerEvent) => void>();
  private phase: 'ready' | 'reading' | 'ended' = 'ready';
  private wordCount = 0;
  private simulation: Simulation | null = null;
  private steps: Step[] = [];
  private nextStep = 0;
  private readonly results: WordResult[] = [];
  private lastEnd = 0;
  private userPaused = false;
  private microphoneAway = false;
  /** The word Tıkır is reading for the child; given once help() is called. */
  private pendingHelp: { result: WordResult; given: boolean } | null = null;
  private activeBefore = 0;
  private runningSince: number | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private releaseMicrophone: Unsubscribe | null = null;
  private outcome: ListenerOutcome | null = null;

  constructor(mode: FakeListenerMode = { kind: 'scenario' }, options: { now?: () => number } = {}) {
    this.mode = mode;
    this.now = options.now ?? (() => performance.now());
  }

  start(words: readonly string[], audio: AudioCapture): Promise<void> {
    if (this.phase !== 'ready') {
      return Promise.reject(new Error('The listener has already started.'));
    }
    if (audio.state !== 'capturing') {
      return Promise.reject(new Error('The microphone is not capturing.'));
    }
    this.wordCount = words.length;
    if (this.mode.kind === 'scenario') {
      this.simulation = simulateReading(words, this.mode.scenario ?? defaultScenario);
      this.steps = stepsOf(this.simulation);
      this.wordCount = this.simulation.words.length;
    }
    this.phase = 'reading';
    this.releaseMicrophone = audio.onStateChange((state) => {
      this.microphoneAway = state !== 'capturing';
      this.update();
    });
    if (this.wordCount === 0) {
      this.finish('completed');
      return Promise.resolve();
    }
    this.emit({ type: 'position', index: 0 });
    this.update();
    return Promise.resolve();
  }

  pause(): void {
    this.userPaused = true;
    this.update();
  }

  /** Also ends a help: the word Tıkır read comes as helped, then the next position. */
  resume(): void {
    if (this.phase !== 'reading') {
      return;
    }
    this.userPaused = false;
    const help = this.pendingHelp;
    if (help !== null) {
      this.pendingHelp = null;
      this.deliver(help.result);
    }
    this.update();
  }

  /** Called at the help threshold of the word at index; ignored anywhere else. */
  help(index: number): void {
    if (this.pendingHelp?.result.index === index) {
      this.pendingHelp.given = true;
    }
  }

  stop(): Promise<ListenerOutcome> {
    if (this.outcome === null) {
      // A word Tıkır already read counts once, even if the reading stops before resume().
      if (this.pendingHelp?.given === true) {
        this.results.push(this.pendingHelp.result);
      }
      this.pendingHelp = null;
      this.finish('stopped');
    }
    return Promise.resolve(this.outcomeOrEmpty());
  }

  on(callback: (event: ListenerEvent) => void): Unsubscribe {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /** The manual mode: the word being read is marked; ignored while paused or hesitating. */
  mark(mark: ManualMark): void {
    if (this.mode.kind !== 'manual') {
      throw new Error('mark() works only in the manual mode.');
    }
    if (this.runningSince === null || this.nextStep < this.steps.length) {
      return;
    }
    const index = this.results.length;
    const now = this.activeNow();
    if (mark === 'hesitate') {
      const at = now + helpThresholdMs;
      this.steps.push(...hesitationSteps(index, now, helpThresholdMs), {
        at,
        kind: 'help',
        result: { index, status: 'helped', tStart: at, tEnd: at, hesitationMs: helpThresholdMs },
      });
      this.update();
      return;
    }
    this.deliver({ index, status: mark, tStart: this.lastEnd, tEnd: now });
    this.update();
  }

  private activeNow(): number {
    return this.activeBefore + (this.runningSince === null ? 0 : this.now() - this.runningSince);
  }

  /** Runs the clock and the timer exactly when nothing holds the reading. */
  private update(): void {
    const running =
      this.phase === 'reading' &&
      !this.userPaused &&
      !this.microphoneAway &&
      this.pendingHelp === null;
    if (running && this.runningSince === null) {
      this.runningSince = this.now();
    } else if (!running && this.runningSince !== null) {
      this.activeBefore = this.activeNow();
      this.runningSince = null;
    }
    clearTimeout(this.timer);
    this.timer = undefined;
    const step = this.steps[this.nextStep];
    if (!running || step === undefined) {
      return;
    }
    const target = step.at;
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        this.advance(target);
      },
      Math.max(0, Math.ceil(target - this.activeNow())),
    );
  }

  private advance(target: number): void {
    // A browser timer never fires early; a test clock that lags behind its timers catches up.
    const lag = target - this.activeNow();
    if (lag > 0) {
      this.activeBefore += lag;
    }
    const now = this.activeNow();
    let step = this.steps[this.nextStep];
    while (step !== undefined && step.at <= now && this.runningSince !== null) {
      this.nextStep += 1;
      this.take(step);
      step = this.steps[this.nextStep];
    }
    this.update();
  }

  private take(step: Step): void {
    switch (step.kind) {
      case 'hesitation':
        this.emit({ type: 'hesitation', index: step.index, ms: step.ms });
        break;
      case 'word':
        this.deliver(step.result);
        break;
      case 'help':
        this.pendingHelp = { result: step.result, given: false };
        this.update();
        this.emit({
          type: 'hesitation',
          index: step.result.index,
          ms: step.result.hesitationMs ?? helpThresholdMs,
        });
        break;
    }
  }

  private deliver(result: WordResult): void {
    this.results.push(result);
    this.lastEnd = result.tEnd;
    this.emit({ type: 'word', result });
    if (this.phase !== 'reading') {
      return;
    }
    if (result.index >= this.wordCount - 1) {
      this.finish('completed');
    } else {
      this.emit({ type: 'position', index: result.index + 1 });
    }
  }

  private finish(reason: 'completed' | 'stopped'): void {
    if (this.phase === 'reading') {
      this.activeBefore = this.activeNow();
    }
    this.runningSince = null;
    this.phase = 'ended';
    clearTimeout(this.timer);
    this.timer = undefined;
    this.releaseMicrophone?.();
    this.releaseMicrophone = null;
    const completedSimulation = reason === 'completed' ? this.simulation : null;
    this.outcome = {
      words: [...this.results],
      seconds: completedSimulation?.seconds ?? this.activeBefore / 1000,
    };
    if (this.simulation?.prosodyScore !== undefined) {
      this.outcome.prosodyScore = this.simulation.prosodyScore;
    }
    this.emit({ type: 'end', reason });
  }

  private outcomeOrEmpty(): ListenerOutcome {
    return this.outcome ?? { words: [], seconds: 0 };
  }

  private emit(event: ListenerEvent): void {
    notifyAll(this.listeners, event);
  }
}
