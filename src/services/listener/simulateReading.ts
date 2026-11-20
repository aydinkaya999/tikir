// A fake reading, timed word by word (docs/dinleme-hatti.md, section 3). Pure: the same words
// and scenario always give the same simulation, so a screen can be reproduced exactly.
import { helpThresholdMs, hesitationMarkMs } from '../../domain/config';
import { isCountedError } from '../../domain/scoring';
import { countSyllables } from '../../domain/text';
import type { ProsodyScore, WordResult, WordStatus } from '../../domain/types';
import type { FakeScenario } from './types';

export interface SimulatedWord {
  index: number;
  status: WordStatus;
  /** The pause before the word, capped at the help threshold. */
  hesitationMs: number;
  /** From the start of the reading, pauses for help excluded. */
  startMs: number;
  endMs: number;
}

export interface Simulation {
  words: SimulatedWord[];
  seconds: number;
  prosodyScore?: ProsodyScore;
}

interface PlannedWord {
  spoken: string;
  status: WordStatus;
  hesitationMs: number;
}

/** mulberry32: a small seeded generator, uniform in [0, 1). */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function totalSeconds(scenario: FakeScenario, correctWords: number): number {
  if (scenario.timed !== undefined) {
    return scenario.timed.seconds;
  }
  if (scenario.wcpm !== undefined) {
    return (correctWords * 60) / scenario.wcpm;
  }
  throw new TypeError('A fake scenario needs wcpm or timed.');
}

/**
 * Each word reached gets its status and hesitation from the scenario; a hesitation from the help
 * threshold on makes the word helped. The reading lasts correctWords × 60 / wcpm seconds (or the
 * timed seconds); what the hesitations leave is shared out by syllables, skipped and helped
 * words taking no time.
 */
export function simulateReading(
  spokenWords: readonly string[],
  scenario: FakeScenario,
): Simulation {
  const count =
    scenario.timed === undefined
      ? spokenWords.length
      : Math.min(spokenWords.length, Math.max(0, Math.floor(scenario.timed.wordsRead)));

  const planned = spokenWords.slice(0, count).map((spoken, index): PlannedWord => {
    const pause = scenario.hesitations.find((item) => item.index === index)?.ms ?? 0;
    const miscue = scenario.miscues.find((item) => item.index === index)?.type;
    if (pause >= helpThresholdMs) {
      return { spoken, status: 'helped', hesitationMs: helpThresholdMs };
    }
    return { spoken, status: miscue ?? 'correct', hesitationMs: Math.max(0, pause) };
  });

  const correctWords = planned.filter((word) => !isCountedError(word.status)).length;
  const seconds = totalSeconds(scenario, correctWords);
  const simulation: Simulation = { words: [], seconds };
  if (scenario.prosodyScore !== undefined) {
    simulation.prosodyScore = scenario.prosodyScore;
  }
  if (count === 0) {
    return simulation;
  }

  const pool = seconds * 1000 - planned.reduce((sum, word) => sum + word.hesitationMs, 0);
  if (pool <= 0) {
    throw new RangeError('The hesitations leave no time for reading.');
  }
  const random = seededRandom(scenario.seed ?? 1);
  const jitter = scenario.jitter ?? 0;
  const weights = planned.map((word) => {
    const spread = 1 + jitter * (2 * random() - 1);
    const reads = word.status !== 'skipped' && word.status !== 'helped';
    return reads ? countSyllables(word.spoken) * spread : 0;
  });
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const msPerWeight = weightSum > 0 ? pool / weightSum : 0;

  let time = 0;
  simulation.words = planned.map((word, index) => {
    time += word.hesitationMs;
    const startMs = time;
    time += (weights[index] ?? 0) * msPerWeight;
    return { index, status: word.status, hesitationMs: word.hesitationMs, startMs, endMs: time };
  });
  return simulation;
}

/** hesitationMs is reported from config.hesitationMarkMs on. */
export function toWordResults(simulation: Simulation): WordResult[] {
  return simulation.words.map((word) => {
    const result: WordResult = {
      index: word.index,
      status: word.status,
      tStart: word.startMs,
      tEnd: word.endMs,
    };
    if (word.hesitationMs >= hesitationMarkMs) {
      result.hesitationMs = word.hesitationMs;
    }
    return result;
  });
}
