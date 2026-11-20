// Making a book (docs/mimari.md, "BookGenerator"; docs/urun.md section 6): from three cards (U3) or
// from a parent's text (U2). Until the backend (phase 6) the mock generator stands in for it.
import type { CardChoice, CardSet } from '../../domain/books';
import type { Book, BookRequest, Grade } from '../../domain/types';

export interface CardsInput {
  choice: CardChoice;
  /** The first hero's name and the sample text's hero (docs/kararlar.md C9). */
  childName: string;
  /** The book's grade: the child's. */
  grade: Grade;
}

export type TextInput = Extract<BookRequest, { kind: 'text' }>;

export interface BookGenerator {
  /** U3's cards. */
  cards(): CardSet;
  /** Rejects with an AbortError once the signal aborts ("Vazgeç"). */
  fromCards(input: CardsInput, signal?: AbortSignal): Promise<Book>;
  fromText(input: TextInput, signal?: AbortSignal): Promise<Book>;
}
