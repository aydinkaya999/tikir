// The app's data on the device (docs/mimari.md, "Depolama ve örnek veri"; docs/planlar/faz-2a.md,
// karar 12). The bundled content is loaded on first open and again when its version changes.
import type { IDBPDatabase } from 'idb';
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
import { contentVersion, currentKey, openTikirDb, type TikirSchema, tikirStores } from './db';
import { type Repository, RepositoryUnavailableError } from './Repository';
import { seedPassages, seriesBook } from './seedContent';

const contentVersionKey = 'contentVersion';

export class IndexedDbRepository implements Repository {
  private readonly db: IDBPDatabase<TikirSchema>;

  private constructor(db: IDBPDatabase<TikirSchema>) {
    this.db = db;
  }

  /** Rejects with RepositoryUnavailableError when IndexedDB is missing or cannot open. */
  static async open(): Promise<IndexedDbRepository> {
    if (typeof indexedDB === 'undefined') {
      throw new RepositoryUnavailableError('IndexedDB is not available in this browser.');
    }
    let db: IDBPDatabase<TikirSchema>;
    try {
      db = await openTikirDb();
    } catch (error) {
      throw new RepositoryUnavailableError('The database could not be opened.', { cause: error });
    }
    const repository = new IndexedDbRepository(db);
    await repository.loadContent(false);
    return repository;
  }

  async getParent(): Promise<Parent | null> {
    return (await this.db.get('parent', currentKey)) ?? null;
  }

  async saveParent(parent: Parent): Promise<void> {
    await this.db.put('parent', parent, currentKey);
  }

  async getChild(): Promise<Child | null> {
    return (await this.db.get('child', currentKey)) ?? null;
  }

  async saveChild(child: Child): Promise<void> {
    await this.db.put('child', child, currentKey);
  }

  async getBook(id: Id): Promise<Book | null> {
    return (await this.db.get('books', id)) ?? null;
  }

  listBooks(): Promise<Book[]> {
    return this.db.getAll('books');
  }

  async saveBook(book: Book): Promise<void> {
    await this.db.put('books', book);
  }

  async getSession(date: LocalDate): Promise<Session | null> {
    return (await this.db.get('sessions', date)) ?? null;
  }

  async saveSession(session: Session): Promise<void> {
    await this.db.put('sessions', session);
  }

  listSessions(from: LocalDate, to: LocalDate): Promise<Session[]> {
    if (from > to) {
      return Promise.resolve([]);
    }
    return this.db.getAll('sessions', IDBKeyRange.bound(from, to));
  }

  listStuckWords(): Promise<StuckWord[]> {
    return this.db.getAll('stuckWords');
  }

  async saveStuckWords(words: StuckWord[]): Promise<void> {
    const transaction = this.db.transaction('stuckWords', 'readwrite');
    await transaction.store.clear();
    for (const word of words) {
      await transaction.store.put(word);
    }
    await transaction.done;
  }

  async listAssessments(): Promise<Assessment[]> {
    const assessments = await this.db.getAll('assessments');
    return assessments.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  async saveAssessment(assessment: Assessment): Promise<void> {
    await this.db.put('assessments', assessment);
  }

  listPassages(grade: Grade): Promise<Passage[]> {
    return this.db.getAllFromIndex('passages', 'grade', grade);
  }

  async getDrillSuggestion(): Promise<DrillSuggestion | null> {
    return (await this.db.get('drill', currentKey)) ?? null;
  }

  async saveDrillSuggestion(drill: DrillSuggestion | null): Promise<void> {
    if (drill === null) {
      await this.db.delete('drill', currentKey);
    } else {
      await this.db.put('drill', drill, currentKey);
    }
  }

  async clearAll(): Promise<void> {
    const transaction = this.db.transaction([...tikirStores], 'readwrite');
    await Promise.all([
      ...tikirStores.map((name) => transaction.objectStore(name).clear()),
      transaction.done,
    ]);
    await this.loadContent(true);
  }

  /** The series book and the passages, unless this content version is already loaded. */
  private async loadContent(always: boolean): Promise<void> {
    const transaction = this.db.transaction(['meta', 'books', 'passages'], 'readwrite');
    const loaded = await transaction.objectStore('meta').get(contentVersionKey);
    if (always || loaded !== contentVersion) {
      await transaction.objectStore('books').put(seriesBook());
      for (const passage of seedPassages()) {
        await transaction.objectStore('passages').put(passage);
      }
      await transaction.objectStore('meta').put(contentVersion, contentVersionKey);
    }
    await transaction.done;
  }
}
