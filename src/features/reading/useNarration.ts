// The listen step (G3): Tıkır reads the pages one after another, unit by unit, and the screen
// follows (docs/ekranlar.md, G3; docs/planlar/faz-2a.md, karar 11). The child may go on once the
// whole text has been read at least once.
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { NarrationRate, Narrator } from '../../services/narrator/Narrator';
import { notifyAll } from '../../services/notify';
import type { Unsubscribe } from '../../services/types';
import type { ScreenPage } from './pages';
import { readingClockTickMs } from './useReading';

export interface NarrationController {
  pageIndex: number;
  /** The unit being read on the page; null when nothing is being read. */
  currentUnit: number | null;
  /** Units of the page already read. */
  readUnits: number;
  /** Time spent on this page, pauses excluded. */
  elapsedMs: number;
  /** The page's estimate at the current rate. */
  totalMs: number;
  finishedOnce: boolean;
  playing: boolean;
  play(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  setRate(rate: NarrationRate): void;
}

interface Snapshot {
  pageIndex: number;
  currentUnit: number | null;
  readUnits: number;
  elapsedMs: number;
  totalMs: number;
  finishedOnce: boolean;
  playing: boolean;
}

const defaultNow = () => performance.now();

class NarrationRun {
  private readonly narrator: Narrator;
  private readonly pages: readonly ScreenPage[];
  private readonly now: { readonly current: () => number };
  private readonly subscribers = new Set<() => void>();
  private pageIndex = 0;
  private currentUnit: number | null = null;
  private readUnits = 0;
  private finishedOnce = false;
  private playing = false;
  private paused = false;
  /** Bumped by every new narration: a narration it replaced is ignored when it settles. */
  private run = 0;
  private activeBefore = 0;
  private runningSince: number | null = null;
  private ticker: ReturnType<typeof setInterval> | undefined;
  private snapshot: Snapshot;

  constructor(
    narrator: Narrator,
    pages: readonly ScreenPage[],
    now: { readonly current: () => number },
  ) {
    this.narrator = narrator;
    this.pages = pages;
    this.now = now;
    this.snapshot = this.build();
  }

  readonly subscribe = (callback: () => void): Unsubscribe => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  readonly getSnapshot = (): Snapshot => this.snapshot;

  detach(): void {
    this.run += 1;
    this.narrator.stop();
    this.playing = false;
    this.paused = false;
    this.freeze();
  }

  play(): void {
    if (this.playing || this.paused) {
      return;
    }
    const finished =
      this.pageIndex === this.pages.length - 1 && this.currentUnit === null && this.finishedOnce;
    this.playFrom(finished ? 0 : this.pageIndex);
  }

  pause(): void {
    if (!this.playing) {
      return;
    }
    this.narrator.pause();
    this.playing = false;
    this.paused = true;
    this.freeze();
    this.publish();
  }

  resume(): void {
    if (!this.paused) {
      return;
    }
    this.narrator.resume();
    this.paused = false;
    this.playing = true;
    this.thaw();
    this.publish();
  }

  restart(): void {
    this.run += 1;
    this.narrator.stop();
    this.paused = false;
    this.playFrom(0);
  }

  setRate(rate: NarrationRate): void {
    this.narrator.setRate(rate);
    this.publish();
  }

  private playFrom(pageIndex: number): void {
    const screenPage = this.pages[pageIndex];
    if (screenPage === undefined) {
      return;
    }
    this.run += 1;
    const run = this.run;
    this.pageIndex = pageIndex;
    this.currentUnit = null;
    this.readUnits = 0;
    this.playing = true;
    this.paused = false;
    this.freeze();
    this.activeBefore = 0;
    this.thaw();
    void this.narrator
      .speakPage(screenPage.page, (unit) => {
        if (run === this.run) {
          this.currentUnit = unit;
          this.readUnits = unit;
          this.publish();
        }
      })
      .then((end) => {
        if (run !== this.run || end !== 'completed') {
          return;
        }
        if (pageIndex + 1 < this.pages.length) {
          this.playFrom(pageIndex + 1);
          return;
        }
        this.finishedOnce = true;
        this.playing = false;
        this.currentUnit = null;
        this.readUnits = screenPage.unitCount;
        this.freeze();
        this.publish();
      });
    this.publish();
  }

  private elapsed(): number {
    return (
      this.activeBefore + (this.runningSince === null ? 0 : this.now.current() - this.runningSince)
    );
  }

  private thaw(): void {
    if (this.runningSince === null) {
      this.runningSince = this.now.current();
      this.ticker = setInterval(() => {
        this.publish();
      }, readingClockTickMs);
    }
  }

  private freeze(): void {
    if (this.runningSince !== null) {
      this.activeBefore = this.elapsed();
      this.runningSince = null;
    }
    clearInterval(this.ticker);
    this.ticker = undefined;
  }

  private build(): Snapshot {
    const page = this.pages[this.pageIndex];
    return {
      pageIndex: this.pageIndex,
      currentUnit: this.currentUnit,
      readUnits: this.readUnits,
      elapsedMs: this.elapsed(),
      totalMs: page === undefined ? 0 : this.narrator.estimateSeconds(page.page) * 1000,
      finishedOnce: this.finishedOnce,
      playing: this.playing,
    };
  }

  private publish(): void {
    const next = this.build();
    const current = this.snapshot;
    const same = (Object.keys(next) as (keyof Snapshot)[]).every(
      (key) => next[key] === current[key],
    );
    if (same) {
      return;
    }
    this.snapshot = next;
    notifyAll<undefined>(this.subscribers, undefined);
  }
}

export function useNarration(options: {
  narrator: Narrator;
  pages: readonly ScreenPage[];
  now?: () => number;
}): NarrationController {
  const { narrator, pages } = options;
  const now = useRef(options.now ?? defaultNow);
  const run = useMemo(() => new NarrationRun(narrator, pages, now), [narrator, pages]);
  useEffect(
    () => () => {
      run.detach();
    },
    [run],
  );
  const snapshot = useSyncExternalStore(run.subscribe, run.getSnapshot);
  return {
    ...snapshot,
    play: () => {
      run.play();
    },
    pause: () => {
      run.pause();
    },
    resume: () => {
      run.resume();
    },
    restart: () => {
      run.restart();
    },
    setRate: (rate) => {
      run.setRate(rate);
    },
  };
}
