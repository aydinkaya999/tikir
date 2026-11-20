// The generator until the backend (docs/mimari.md, "MockBookGenerator"; docs/planlar/faz-5.md,
// kararlar 2–4): cards give the content's sample book with the cards' title and the child's name;
// a parent's text is cut into a chapter as written. A short wait stands for the generation.
import sampleBooks from '../../../seed/ornek-kitaplar.json';
import {
  bookChapterFromText,
  bookTitleFromText,
  type CardSet,
  cardsTitle,
  withChildName,
} from '../../domain/books';
import { splitPhraseUnits } from '../../domain/text';
import type { Book, Chapter, Grade, Id } from '../../domain/types';
import { createId as newId } from '../id';
import type { BookGenerator, CardsInput, TextInput } from './BookGenerator';

/** docs/mimari.md: a short wait of one to two seconds. */
const defaultDelayMs = 1500;

function abortError(): DOMException {
  return new DOMException('The book was not made.', 'AbortError');
}

/** The content's chapter: " | " marks the phrase units (seed/README.md). */
function sampleChapter(): Chapter {
  const sample = sampleBooks.books.find((book) => book.source === 'cards');
  const chapter = sample?.chapters[0];
  if (chapter === undefined) {
    throw new Error('The sample cards book is missing from the content.');
  }
  return {
    number: chapter.number,
    title: chapter.title,
    pages: chapter.pages.map((page) => page.map((sentence) => splitPhraseUnits(sentence))),
    questions: chapter.questions,
    chains: chapter.chains,
  };
}

function sampleInsertedWords(): string[] {
  return [...(sampleBooks.books.find((book) => book.source === 'cards')?.insertedWords ?? [])];
}

const grades: readonly Grade[] = [1, 2, 3, 4];

/**
 * The sample text's own grade: the mock cannot write it at the child's level, so the book says
 * what it is (review of phase 5, finding 1). The backend writes for the child's grade (phase 6).
 */
function sampleGrade(): Grade {
  const grade = sampleBooks.books.find((book) => book.source === 'cards')?.grade;
  const known = grades.find((each) => each === grade);
  if (known === undefined) {
    throw new Error('The sample cards book has no grade in the content.');
  }
  return known;
}

export class MockBookGenerator implements BookGenerator {
  private readonly delayMs: number;
  private readonly createId: () => Id;

  constructor(options: { delayMs?: number; createId?: () => Id } = {}) {
    this.delayMs = options.delayMs ?? defaultDelayMs;
    this.createId = options.createId ?? newId;
  }

  cards(): CardSet {
    return sampleBooks.cards;
  }

  async fromCards(input: CardsInput, signal?: AbortSignal): Promise<Book> {
    await this.wait(signal);
    const title = cardsTitle(sampleBooks.cards, input.choice);
    return {
      id: this.createId(),
      title,
      grade: sampleGrade(),
      source: 'cards',
      totalChapters: 1,
      chapters: [withChildName({ ...sampleChapter(), title }, input.childName)],
      insertedWords: sampleInsertedWords(),
      request: { kind: 'cards', ...input.choice },
    };
  }

  async fromText(input: TextInput, signal?: AbortSignal): Promise<Book> {
    await this.wait(signal);
    const title = bookTitleFromText(input.text);
    return {
      id: this.createId(),
      title,
      grade: input.grade,
      source: 'parentText',
      totalChapters: 1,
      chapters: [bookChapterFromText(input.text, title)],
      request: input,
    };
  }

  private wait(signal: AbortSignal | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted === true) {
        reject(abortError());
        return;
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, this.delayMs);
      const onAbort = () => {
        clearTimeout(timer);
        reject(abortError());
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }
}
