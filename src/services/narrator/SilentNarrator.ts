// Narration without a voice: each unit lasts its syllable time (docs/kararlar.md T8). Also the
// fallback of the speaking narrator for a unit the voice does not speak.
import type { Page } from '../../domain/types';
import { notifyAll } from '../notify';
import { type NarrationEnd, type NarrationRate, type Narrator, unitDurationMs } from './Narrator';

/** One narration: a page's units or a single word. */
export interface NarrationJob {
  readonly units: readonly string[];
  readonly onUnit: (unitIndex: number) => void;
  readonly resolve: (end: NarrationEnd) => void;
  index: number;
  paused: boolean;
  /** The last unit announced through onUnit. */
  announced: number;
  /** The silent timing of the current unit. */
  remainingMs: number;
  startedAt: number | null;
  timer: ReturnType<typeof setTimeout> | undefined;
}

export class SilentNarrator implements Narrator {
  protected readonly now: () => number;
  protected job: NarrationJob | null = null;
  private currentRate: NarrationRate = 'slow';

  constructor(options: { now?: () => number } = {}) {
    this.now = options.now ?? (() => performance.now());
  }

  get rate(): NarrationRate {
    return this.currentRate;
  }

  setRate(rate: NarrationRate): void {
    this.currentRate = rate;
  }

  speakPage(page: Page, onUnit: (unitIndex: number) => void): Promise<NarrationEnd> {
    return this.run(page.flat(), onUnit);
  }

  speakWord(word: string): Promise<NarrationEnd> {
    return this.run([word], () => undefined);
  }

  estimateSeconds(page: Page): number {
    const ms = page.flat().reduce((sum, unit) => sum + unitDurationMs(unit, this.currentRate), 0);
    return ms / 1000;
  }

  pause(): void {
    const job = this.job;
    if (job === null || job.paused) {
      return;
    }
    job.paused = true;
    this.holdUnit(job);
  }

  resume(): void {
    const job = this.job;
    if (job === null || !job.paused) {
      return;
    }
    job.paused = false;
    this.continueUnit(job);
  }

  stop(): void {
    this.finish('stopped');
  }

  /** Plays the job's current unit. */
  protected playUnit(job: NarrationJob): void {
    this.playSilently(job);
  }

  /** Holds the unit being played. */
  protected holdUnit(job: NarrationJob): void {
    if (job.startedAt !== null) {
      job.remainingMs -= this.now() - job.startedAt;
      job.startedAt = null;
    }
    clearTimeout(job.timer);
    job.timer = undefined;
  }

  /** Goes on with the held unit. */
  protected continueUnit(job: NarrationJob): void {
    this.runTimer(job);
  }

  protected playSilently(job: NarrationJob): void {
    // Timed before it is announced: a rate set from onUnit applies from the next unit.
    job.remainingMs = unitDurationMs(job.units[job.index] ?? '', this.currentRate);
    job.startedAt = null;
    this.announce(job);
    if (this.job === job && !job.paused) {
      this.runTimer(job);
    }
  }

  protected announce(job: NarrationJob): void {
    if (job.announced < job.index) {
      job.announced = job.index;
      notifyAll([job.onUnit], job.index);
    }
  }

  protected nextUnit(job: NarrationJob): void {
    if (this.job !== job) {
      return;
    }
    job.index += 1;
    if (job.index >= job.units.length) {
      this.finish('completed');
    } else {
      this.playUnit(job);
    }
  }

  protected finish(end: NarrationEnd): void {
    const job = this.job;
    if (job === null) {
      return;
    }
    this.job = null;
    clearTimeout(job.timer);
    job.timer = undefined;
    job.resolve(end);
  }

  private runTimer(job: NarrationJob): void {
    clearTimeout(job.timer);
    job.startedAt = this.now();
    job.timer = setTimeout(
      () => {
        job.timer = undefined;
        job.startedAt = null;
        this.nextUnit(job);
      },
      Math.max(0, Math.round(job.remainingMs)),
    );
  }

  /** A new narration replaces the one running, which ends as stopped. */
  private run(
    units: readonly string[],
    onUnit: (unitIndex: number) => void,
  ): Promise<NarrationEnd> {
    this.finish('stopped');
    if (units.length === 0) {
      return Promise.resolve('completed');
    }
    return new Promise((resolve) => {
      const job: NarrationJob = {
        units,
        onUnit,
        resolve,
        index: 0,
        paused: false,
        announced: -1,
        remainingMs: 0,
        startedAt: null,
        timer: undefined,
      };
      this.job = job;
      this.playUnit(job);
    });
  }
}
