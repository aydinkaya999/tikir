// A narrator the test finishes by hand: what was said is kept, and each narration ends when the
// test calls finish(). No timers, so screen tests can run on real time.
import { vi } from 'vitest';
import type { NarrationRate, Page } from '../domain/types';
import type { NarrationEnd, Narrator } from '../services/narrator/Narrator';

export class ControlledNarrator implements Narrator {
  rate: NarrationRate = 'slow';
  readonly words: string[] = [];
  readonly pages: Page[] = [];
  readonly pause = vi.fn();
  readonly resume = vi.fn();
  private pending: ((end: NarrationEnd) => void)[] = [];

  speakWord(word: string): Promise<NarrationEnd> {
    this.words.push(word);
    return new Promise((resolve) => this.pending.push(resolve));
  }

  speakPage(page: Page): Promise<NarrationEnd> {
    this.pages.push(page);
    return new Promise((resolve) => this.pending.push(resolve));
  }

  setRate(rate: NarrationRate): void {
    this.rate = rate;
  }

  readonly stop = vi.fn(() => {
    for (const resolve of this.pending.splice(0)) {
      resolve('stopped');
    }
  });

  estimateSeconds(): number {
    return 1;
  }

  /** Ends the narration running now, as if Tıkır had read it to the end. */
  finish(): void {
    this.pending.shift()?.('completed');
  }

  get speaking(): boolean {
    return this.pending.length > 0;
  }
}
