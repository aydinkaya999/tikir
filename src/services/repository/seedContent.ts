// The content bundled with the app: the series book and the assessment passages (seed/). Seed
// sentences mark phrase units with " | "; the reference stats stay in seed/ for the tests.
import seriesJson from '../../../seed/kayip-fenerin-izinde.json';
import passagesJson from '../../../seed/olcum-metinleri.json';
import { splitPhraseUnits } from '../../domain/text';
import type { Book, Grade, Passage, Question } from '../../domain/types';

export interface SeedChapter {
  number: number;
  title: string;
  pages: string[][];
  questions: Question[];
  chains?: Readonly<Record<string, readonly string[] | undefined>>;
}

export interface SeedBook {
  id: string;
  title: string;
  grade: number;
  source?: string;
  totalChapters: number;
  chapters: readonly SeedChapter[];
  /** A made book's stuck words in its text (U4). */
  insertedWords?: readonly string[];
}

const grades: readonly Grade[] = [1, 2, 3, 4];
const sources: readonly Book['source'][] = ['series', 'cards', 'parentText'];

function asGrade(value: number): Grade {
  const grade = grades.find((item) => item === value);
  if (grade === undefined) {
    throw new RangeError(`Not a grade: ${value}`);
  }
  return grade;
}

function chainsOf(seed: SeedChapter['chains']): Record<string, string[]> {
  const chains: Record<string, string[]> = {};
  for (const [word, chain] of Object.entries(seed ?? {})) {
    if (chain !== undefined) {
      chains[word] = [...chain];
    }
  }
  return chains;
}

export function bookFromSeed(json: SeedBook): Book {
  return {
    id: json.id,
    title: json.title,
    grade: asGrade(json.grade),
    source: sources.find((source) => source === json.source) ?? 'series',
    totalChapters: json.totalChapters,
    ...(json.insertedWords === undefined ? {} : { insertedWords: [...json.insertedWords] }),
    chapters: json.chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      pages: chapter.pages.map((page) => page.map(splitPhraseUnits)),
      questions: chapter.questions.map((question) => ({
        prompt: question.prompt,
        options: [...question.options],
        correctIndex: question.correctIndex,
      })),
      chains: chainsOf(chapter.chains),
    })),
  };
}

export function seriesBook(): Book {
  return bookFromSeed(seriesJson);
}

export function seedPassages(): Passage[] {
  return passagesJson.passages.map((passage) => ({
    id: passage.id,
    grade: asGrade(passage.grade),
    title: passage.title,
    sentences: [...passage.sentences],
  }));
}
