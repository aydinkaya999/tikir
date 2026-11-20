// U1's and U4's views of the day's data (docs/ekranlar.md, U1 and U4; docs/planlar/faz-5.md,
// kararlar 10–13 and 21–29).
import type { TilePattern } from '../../components/illustrations';
import { chapterSentences, readingMinutes } from '../../domain/books';
import { lastMeasurement } from '../../domain/measurement';
import { completedSeriesChapters } from '../../domain/progress';
import { levelCheck } from '../../domain/readability';
import { stuckKey } from '../../domain/stuckWords';
import { chapterTokens, withGenitiveSuffix, withPossessiveSuffix } from '../../domain/text';
import type { Book, Id } from '../../domain/types';
import { tr } from '../../i18n/tr';
import type { SessionData } from '../session/sessionStore';

export interface LibraryBook {
  id: Id;
  title: string;
  /** "Kartlarla yaptın" or "Velin ekledi". */
  source: string;
  patterns: readonly [TilePattern, TilePattern];
}

export interface LibraryView {
  series: { title: string; completed: number; total: number; progress: string };
  books: LibraryBook[];
  /** A book starts today's session only while the day has none (P5); else "Yarın okuyabilirsin.". */
  canStart: boolean;
}

/** The patterns a book's cover takes: cini-1 is the series' own (U1). */
const bookPatterns: readonly TilePattern[] = [2, 3, 4, 5, 6];

/**
 * A book's two cover patterns, the same every time for the same book (karar 11). TODO(design):
 * the design's covers use a pattern design/svg does not have (docs/kararlar.md, question 10).
 */
export function coverPatterns(bookId: Id): readonly [TilePattern, TilePattern] {
  // FNV-1a: a small, stable hash of the id.
  let hash = 0x811c9dc5;
  for (const character of bookId) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 0x01000193) >>> 0;
  }
  const first = bookPatterns[hash % bookPatterns.length] ?? 2;
  const others = bookPatterns.filter((pattern) => pattern !== first);
  const second = others[Math.floor(hash / bookPatterns.length) % others.length] ?? 3;
  return [first, second];
}

function sourceOf(book: Book): string {
  return book.source === 'parentText' ? tr.library.source.parentText : tr.library.source.cards;
}

export function libraryView(data: SessionData): LibraryView {
  const completed = completedSeriesChapters(data.sessions, data.series.id).length;
  const total = data.series.totalChapters;
  return {
    series: {
      title: data.series.title,
      completed,
      total,
      progress: tr.road.completed(total, withPossessiveSuffix(completed)),
    },
    books: data.books.map((book) => ({
      id: book.id,
      title: book.title,
      source: sourceOf(book),
      patterns: coverPatterns(book.id),
    })),
    canStart: data.session === null,
  };
}

// U4 Kitap hazır.

export interface ReadyLine {
  text: string;
  /** Within the grade's limit: a check; over it: a cross (D18). */
  ok: boolean;
}

export interface ReadyView {
  title: string;
  patterns: readonly [TilePattern, TilePattern];
  /** The level check passed: the subtitle says so, else it says it did not (karar 21). */
  passed: boolean;
  /** "6 sayfa, 176 kelime, yaklaşık 3 dakika": the real counts (karar 22). */
  meta: string;
  /** "2 soru", only when the book asks some (karar 23). */
  questions: string | null;
  /** The verdict, then the syllables a word and the words a sentence (karar 24). */
  level: [ReadyLine, ReadyLine, ReadyLine];
  /**
   * The inserted words that are the child's cards (karar 25); null hides the section. The note
   * says they come three times only when each one does.
   */
  inserted: { words: string[]; note: string | null } | null;
  /** A parent asked the mock for stuck words or questions: the backend brings them (karar 26). */
  backendNote: boolean;
  /** "Yeniden üret": a book made from a request that no session has read (karar 29). */
  canRemake: boolean;
  /** "Okumaya başla" while today has no session (P5); else "Yarın okuyabilirsin.". */
  canStart: boolean;
}

const oneDecimal = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

/** The design's claim: each stuck word is in the story three times. */
const insertedTimes = 3;

function insertedWords(data: SessionData, book: Book): ReadyView['inserted'] {
  const cards = new Set(data.cards.map((card) => stuckKey(card.word)));
  const words = (book.insertedWords ?? []).filter((word) => cards.has(stuckKey(word)));
  if (words.length === 0) {
    return null;
  }
  const keys = book.chapters.flatMap((chapter) =>
    chapterTokens(chapter).map((token) => stuckKey(token.word)),
  );
  const thrice = words.every(
    (word) => keys.filter((key) => key === stuckKey(word)).length === insertedTimes,
  );
  return {
    words,
    note: thrice ? tr.focus.bookReady.inserted.note(withGenitiveSuffix(data.child.name)) : null,
  };
}

export function readyView(data: SessionData, book: Book): ReadyView {
  const copy = tr.focus.bookReady;
  const check = levelCheck(book.chapters.flatMap(chapterSentences), book.grade);
  const { stats, limits } = check;
  const pages = book.chapters.reduce((sum, chapter) => sum + chapter.pages.length, 0);
  const questions = book.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
  const minutes = readingMinutes(
    stats.words,
    lastMeasurement(data.assessments)?.result.wcpm ?? null,
  );
  const over = (ok: boolean, limit: number) =>
    ok ? '' : copy.level.limit(oneDecimal.format(limit));
  const request = book.request;
  return {
    title: book.title,
    patterns: coverPatterns(book.id),
    passed: check.ok,
    meta: copy.meta(pages, stats.words, minutes),
    questions: questions > 0 ? copy.questions(questions) : null,
    level: [
      {
        text: check.ok ? copy.level.passed(book.grade) : copy.level.failed(book.grade),
        ok: check.ok,
      },
      {
        text:
          copy.level.syllables(oneDecimal.format(stats.syllablesPerWord)) +
          over(check.withinSyllableLimit, limits.maxSyllablesPerWord),
        ok: check.withinSyllableLimit,
      },
      {
        text:
          copy.level.words(oneDecimal.format(stats.wordsPerSentence)) +
          over(check.withinSentenceLimit, limits.maxWordsPerSentence),
        ok: check.withinSentenceLimit,
      },
    ],
    inserted: insertedWords(data, book),
    backendNote: request?.kind === 'text' && (request.insertStuckWords || request.addQuestions),
    canRemake:
      request !== undefined &&
      !data.sessions.some((session) => session.chapterRef.bookId === book.id),
    canStart: data.session === null,
  };
}
