// Tıkır's reading voice (docs/mimari.md, "Servisler"; docs/kararlar.md T8; docs/planlar/faz-2a.md,
// karar 11). A page is read phrase unit by phrase unit; the screen follows the units.
import { countSyllables, tokenize } from '../../domain/text';
import type { NarrationRate, Page } from '../../domain/types';

export type { NarrationRate } from '../../domain/types';

/** completed: the whole text was read; stopped: stop() or a new narration cut it short. */
export type NarrationEnd = 'completed' | 'stopped';

export interface Narrator {
  readonly rate: NarrationRate;
  /** onUnit(i) when unit i (counted over the page) starts. */
  speakPage(page: Page, onUnit: (unitIndex: number) => void): Promise<NarrationEnd>;
  /** The caller passes the spoken form ('üç', not '3'). */
  speakWord(word: string): Promise<NarrationEnd>;
  /** Applies from the next unit. */
  setRate(rate: NarrationRate): void;
  pause(): void;
  resume(): void;
  stop(): void;
  /** How long the page takes at the current rate (G3's time display). */
  estimateSeconds(page: Page): number;
}

/** Calibrated on G3: chapter 4's merged page 1–2 lasts 47.0 s slow. */
export const narrationTiming = {
  syllablesPerSecond: { slow: 2.8, normal: 3.5 },
  unitGapMs: 250,
  /** A unit whose speech has not started by then is timed silently. */
  startTimeoutMs: 1500,
  /**
   * A unit whose speech started but has not ended after this many times its slow syllable time,
   * plus endGraceMs, is ended by hand: some engines drop the end event, and iOS can leave speech
   * paused after the app comes back.
   */
  endGraceFactor: 2,
  endGraceMs: 2000,
  speechRate: { slow: 0.85, normal: 1 },
  /** How long createNarrator waits for the voice list to load. */
  voiceWaitMs: 1000,
} as const;

/** The syllables of the spoken forms at the rate, plus the gap after the unit. */
export function unitDurationMs(text: string, rate: NarrationRate): number {
  const syllables = tokenize(text).reduce((sum, token) => sum + countSyllables(token.spoken), 0);
  return (syllables / narrationTiming.syllablesPerSecond[rate]) * 1000 + narrationTiming.unitGapMs;
}
