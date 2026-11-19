// The reading listener (docs/dinleme-hatti.md, sections 2 and 3; docs/mimari.md, "Servisler").
// FakeListener is the first implementation; speech recognition comes in phase 3 behind the
// same interface.
import type { MiscueType, ProsodyScore, ReadingOutcome, WordResult } from '../../domain/types';
import type { AudioCapture } from '../audio/AudioCapture';
import type { Unsubscribe } from '../types';

/** How a fake reading goes. Positions count from 0; positions past the text are ignored. */
export interface FakeScenario {
  /** Words correct per minute of an untimed reading. */
  wcpm?: number;
  /** A one-minute assessment: the reading stops after wordsRead words. */
  timed?: { seconds: number; wordsRead: number };
  /** Random spread of the word durations, 0 to 1; with seed, the same every run. */
  jitter?: number;
  seed?: number;
  miscues: { index: number; type: MiscueType }[];
  /** A pause before the word; from config.helpThresholdMs on it opens the help. */
  hesitations: { index: number; ms: number }[];
  prosodyScore?: ProsodyScore;
}

export type ListenerEvent =
  | { type: 'position'; index: number }
  | { type: 'word'; result: WordResult }
  | { type: 'hesitation'; index: number; ms: number }
  | { type: 'end'; reason: 'completed' | 'stopped' };

export type ListenerOutcome = ReadingOutcome;

export interface ReadingListener {
  /** words: the spoken forms the reader is expected to say. Throws if audio is not capturing. */
  start(words: readonly string[], audio: AudioCapture): Promise<void>;
  pause(): void;
  resume(): void;
  /** Tıkır reads the word at index: the listener waits until resume(). */
  help(index: number): void;
  stop(): Promise<ListenerOutcome>;
  on(callback: (event: ListenerEvent) => void): Unsubscribe;
}
