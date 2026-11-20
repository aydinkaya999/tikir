import { describe, expect, it } from 'vitest';
import seriesBook from '../../seed/kayip-fenerin-izinde.json';
import assessmentPassages from '../../seed/olcum-metinleri.json';
import sampleBooks from '../../seed/ornek-kitaplar.json';
import { gradeLimits } from './config';
import { atesman, levelCheck, textStats } from './readability';
import type { Grade } from './types';

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

interface SeedText {
  name: string;
  grade: Grade;
  sentences: string[];
  stats: {
    words: number;
    sentences: number;
    syllablesPerWord: number;
    wordsPerSentence: number;
    atesman: number;
  };
}

function asGrade(value: number): Grade {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }
  throw new Error(`Not a grade: ${value}`);
}

// Every seed text carries reference stats (seed/README.md): averages to two decimals,
// the Ateşman score to one; the sentence count is the length of the sentence array.
const seedTexts: SeedText[] = [
  ...seriesBook.chapters.map((chapter) => ({
    name: `${seriesBook.id} #${chapter.number}`,
    grade: asGrade(seriesBook.grade),
    sentences: chapter.pages.flat(),
    stats: chapter.stats,
  })),
  ...assessmentPassages.passages.map((passage) => ({
    name: passage.id,
    grade: asGrade(passage.grade),
    sentences: passage.sentences,
    stats: passage.stats,
  })),
  ...sampleBooks.books.flatMap((book) =>
    book.chapters.map((chapter) => ({
      name: `${book.id} #${chapter.number}`,
      grade: asGrade(book.grade),
      sentences: chapter.pages.flat(),
      stats: chapter.stats,
    })),
  ),
];

function passage(id: string): string[] {
  const found = assessmentPassages.passages.find((item) => item.id === id);
  if (!found) {
    throw new Error(`No seed passage ${id}`);
  }
  return found.sentences;
}

describe('gradeLimits', () => {
  it('holds the starting thresholds from docs/urun.md section 6', () => {
    expect(gradeLimits).toEqual({
      1: { maxSyllablesPerWord: 2.2, maxWordsPerSentence: 5 },
      2: { maxSyllablesPerWord: 2.4, maxWordsPerSentence: 6 },
      3: { maxSyllablesPerWord: 2.7, maxWordsPerSentence: 8 },
      4: { maxSyllablesPerWord: 2.9, maxWordsPerSentence: 10 },
    });
  });
});

describe('atesman', () => {
  it('scores from unrounded averages', () => {
    expect(atesman(28 / 11, 5.5)).toBeCloseTo(82.2064, 4);
  });
});

describe('levelCheck', () => {
  it('reproduces the Ateşman example from docs/mimari.md', () => {
    const { stats } = levelCheck(
      'Deniz sırt çantasını omzuna aldı. Tıkır kulaklarını dikti ve rüzgârı dinledi.',
      3,
    );

    expect(stats.words).toBe(11);
    expect(stats.sentences).toBe(2);
    expect(round(stats.syllablesPerWord, 2)).toBe(2.55);
    expect(round(stats.wordsPerSentence, 2)).toBe(5.5);
    expect(round(stats.atesman, 1)).toBe(82.2);
  });

  it.each(seedTexts.map((text) => [text.name, text] as const))(
    'matches the reference stats of %s',
    (_name, text) => {
      const { stats } = levelCheck(text.sentences, text.grade);

      expect({
        words: stats.words,
        sentences: stats.sentences,
        syllablesPerWord: round(stats.syllablesPerWord, 2),
        wordsPerSentence: round(stats.wordsPerSentence, 2),
        atesman: round(stats.atesman, 1),
      }).toEqual(text.stats);
    },
  );

  it('measures pasted decomposed (NFD) text exactly like composed text', () => {
    const text = 'Göz ağacı gördü. Şiir çok güzeldi.';

    expect(levelCheck(text.normalize('NFD'), 3).stats).toEqual(levelCheck(text, 3).stats);
  });

  it('counts each array item as one sentence', () => {
    expect(levelCheck(['Bir. İki.'], 3).stats.sentences).toBe(1);
  });

  it('flags a grade-4 passage against both grade-1 limits and passes it at grade 4', () => {
    const atGrade1 = levelCheck(passage('olcum-4a'), 1);
    expect(atGrade1.withinSyllableLimit).toBe(false);
    expect(atGrade1.withinSentenceLimit).toBe(false);
    expect(atGrade1.ok).toBe(false);

    expect(levelCheck(passage('olcum-4a'), 4).ok).toBe(true);
  });

  it('flags only the syllable limit when sentences are short enough', () => {
    const result = levelCheck(passage('olcum-3b'), 2);

    expect(result.limits).toEqual(gradeLimits[2]);
    expect(result.withinSyllableLimit).toBe(false);
    expect(result.withinSentenceLimit).toBe(true);
    expect(result.ok).toBe(false);
  });

  it('passes a text that sits exactly on both limits', () => {
    // 5 words, 11 syllables, 1 sentence: 2.2 syllables per word, 5 words per sentence.
    const result = levelCheck(['Ayşe bahçede top ile oynadı.'], 1);

    expect(result.withinSyllableLimit).toBe(true);
    expect(result.withinSentenceLimit).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('reports an empty text as not ok, with zeros instead of NaN', () => {
    const result = levelCheck('', 2);

    expect(result.stats).toEqual(textStats([]));
    expect(result.stats).toEqual({
      words: 0,
      sentences: 0,
      syllables: 0,
      syllablesPerWord: 0,
      wordsPerSentence: 0,
      atesman: 0,
    });
    expect(result.ok).toBe(false);
  });
});

describe('textStats with digits', () => {
  it('counts a written number as one word and its syllables from the reading', () => {
    const stats = textStats(['Deniz 3 elma aldı.']);
    expect(stats.words).toBe(4);
    expect(stats.syllables).toBe(7);
  });
});
