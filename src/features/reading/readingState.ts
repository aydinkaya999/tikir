// What a reading screen shows, folded from the listener's events (docs/dinleme-hatti.md, section
// 2; docs/planlar/faz-2a.md, karar 5 and 6). Pure, so the G4 moment can be checked without a screen.
import { helpThresholdMs, hesitationMarkMs } from '../../domain/config';
import { isCountedError } from '../../domain/scoring';
import type { WordResult } from '../../domain/types';
import type { ListenerEvent } from '../../services/listener/types';
import type { WordMark } from './ReadingText';

export interface ReadingView {
  /** The word being read. */
  position: number;
  results: ReadonlyMap<number, WordResult>;
  /** The pause on the current word, while it lasts. */
  hesitation: { index: number; ms: number } | null;
  /** The word whose help bubble is open. */
  helpIndex: number | null;
  ended: 'completed' | 'stopped' | null;
}

export const initialReadingView: ReadingView = {
  position: 0,
  results: new Map(),
  hesitation: null,
  helpIndex: null,
  ended: null,
};

export function reduceReading(view: ReadingView, event: ListenerEvent): ReadingView {
  switch (event.type) {
    case 'position':
      return {
        ...view,
        position: event.index,
        hesitation: view.hesitation?.index === event.index ? view.hesitation : null,
      };
    case 'hesitation':
      if (event.index !== view.position) {
        return view;
      }
      return {
        ...view,
        hesitation: { index: event.index, ms: event.ms },
        helpIndex: event.ms >= helpThresholdMs ? event.index : view.helpIndex,
      };
    case 'word': {
      const results = new Map(view.results);
      results.set(event.result.index, event.result);
      const index = event.result.index;
      return {
        ...view,
        results,
        hesitation: view.hesitation?.index === index ? null : view.hesitation,
        helpIndex: view.helpIndex === index ? null : view.helpIndex,
      };
    }
    case 'end':
      return { ...view, ended: event.reason, hesitation: null, helpIndex: null };
  }
}

const errorStatuses = new Set<WordResult['status']>(['misread', 'suffix', 'skipped']);

/**
 * The marks the child sees: a wavy line for a misread, suffix or skipped word, a dotted line for
 * a hesitation of a second or more and for a helped word. Repetitions, insertions and
 * self-corrections are shown only to the parent (docs/urun.md section 2).
 */
function markOf(result: WordResult): WordMark | null {
  if (errorStatuses.has(result.status)) {
    return 'error';
  }
  if (result.status === 'helped' || (result.hesitationMs ?? 0) >= hesitationMarkMs) {
    return 'hesitation';
  }
  return null;
}

export function wordMarks(view: ReadingView): Partial<Record<number, WordMark>> {
  const marks: Partial<Record<number, WordMark>> = {};
  for (const result of view.results.values()) {
    const mark = markOf(result);
    if (mark !== null) {
      marks[result.index] = mark;
    }
  }
  return marks;
}

/** "Doğru" (words not counted as errors) and "Takılma" (words with the dotted mark) on G4. */
export function readingCounters(view: ReadingView): { correct: number; stuck: number } {
  let correct = 0;
  let stuck = 0;
  for (const result of view.results.values()) {
    if (!isCountedError(result.status)) {
      correct += 1;
    }
    if (markOf(result) === 'hesitation') {
      stuck += 1;
    }
  }
  return { correct, stuck };
}
