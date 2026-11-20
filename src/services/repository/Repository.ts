// The app's data (docs/mimari.md, "Servisler" → Depo). IndexedDbRepository keeps it on the device;
// an HttpRepository will keep it on the server with the same interface (phase 6).
import type {
  Assessment,
  Book,
  Child,
  DrillSuggestion,
  Grade,
  Id,
  LocalDate,
  Parent,
  Passage,
  Session,
  StuckWord,
} from '../../domain/types';

export interface Repository {
  getParent(): Promise<Parent | null>;
  saveParent(parent: Parent): Promise<void>;
  getChild(): Promise<Child | null>;
  saveChild(child: Child): Promise<void>;
  getBook(id: Id): Promise<Book | null>;
  listBooks(): Promise<Book[]>;
  saveBook(book: Book): Promise<void>;
  /** One session a day (docs/kararlar.md P5). */
  getSession(date: LocalDate): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  /** Both ends included, in date order. */
  listSessions(from: LocalDate, to: LocalDate): Promise<Session[]>;
  listStuckWords(): Promise<StuckWord[]>;
  /** Replaces the whole set. */
  saveStuckWords(words: StuckWord[]): Promise<void>;
  /** In date order. */
  listAssessments(): Promise<Assessment[]>;
  saveAssessment(assessment: Assessment): Promise<void>;
  listPassages(grade: Grade): Promise<Passage[]>;
  getDrillSuggestion(): Promise<DrillSuggestion | null>;
  saveDrillSuggestion(drill: DrillSuggestion | null): Promise<void>;
  /** Deletes the user's data and loads the content (series book, passages) again. */
  clearAll(): Promise<void>;
}

/** IndexedDB is missing or refuses to open (a private window, storage blocked, no quota). */
export class RepositoryUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'RepositoryUnavailableError';
  }
}
