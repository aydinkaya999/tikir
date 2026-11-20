// U1's view of the day's data (docs/ekranlar.md, U1; docs/planlar/faz-5.md, kararlar 10–13).
import type { TilePattern } from '../../components/illustrations';
import { completedSeriesChapters } from '../../domain/progress';
import { withPossessiveSuffix } from '../../domain/text';
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
