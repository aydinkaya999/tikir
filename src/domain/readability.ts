// Readability and grade-level check (docs/mimari.md, "Okunabilirlik (Ateşman)"; docs/urun.md 6).
// Everything is computed from unrounded values; rounding belongs to the screen.
import { gradeLimits, type GradeLimits } from './config';
import { countSyllables, splitPhraseUnits, splitSentences, tokenize } from './text';
import type { Grade } from './types';

export interface TextStats {
  words: number;
  sentences: number;
  syllables: number;
  syllablesPerWord: number;
  wordsPerSentence: number;
  atesman: number;
}

export interface LevelCheck {
  stats: TextStats;
  limits: Readonly<GradeLimits>;
  withinSyllableLimit: boolean;
  withinSentenceLimit: boolean;
  ok: boolean;
}

/** Ateşman score: 198.825 − 40.175 × (syllables per word) − 2.610 × (words per sentence). */
export function atesman(syllablesPerWord: number, wordsPerSentence: number): number {
  return 198.825 - 40.175 * syllablesPerWord - 2.61 * wordsPerSentence;
}

/** Stats of a text given as sentences; " | " phrase-unit markers are ignored. */
export function textStats(sentences: readonly string[]): TextStats {
  // A written number is one word; its syllables are those of its reading (docs/kararlar.md C5).
  const words = sentences.flatMap((sentence) => tokenize(splitPhraseUnits(sentence).join(' ')));
  const syllables = words.reduce((sum, token) => sum + countSyllables(token.spoken), 0);

  if (words.length === 0) {
    return {
      words: 0,
      sentences: 0,
      syllables: 0,
      syllablesPerWord: 0,
      wordsPerSentence: 0,
      atesman: 0,
    };
  }

  const syllablesPerWord = syllables / words.length;
  const wordsPerSentence = words.length / sentences.length;
  return {
    words: words.length,
    sentences: sentences.length,
    syllables,
    syllablesPerWord,
    wordsPerSentence,
    atesman: atesman(syllablesPerWord, wordsPerSentence),
  };
}

/**
 * Checks a text against the grade limits. An array is taken as already split into sentences
 * (seed content); a string is split with splitSentences (a parent's pasted text).
 * The Ateşman score is reported but does not decide `ok`: no grade threshold exists for it.
 */
export function levelCheck(input: string | readonly string[], grade: Grade): LevelCheck {
  const sentences = typeof input === 'string' ? splitSentences(input) : input;
  const stats = textStats(sentences);
  const limits = gradeLimits[grade];
  const withinSyllableLimit = stats.syllablesPerWord <= limits.maxSyllablesPerWord;
  const withinSentenceLimit = stats.wordsPerSentence <= limits.maxWordsPerSentence;

  return {
    stats,
    limits,
    withinSyllableLimit,
    withinSentenceLimit,
    ok: stats.words > 0 && withinSyllableLimit && withinSentenceLimit,
  };
}
