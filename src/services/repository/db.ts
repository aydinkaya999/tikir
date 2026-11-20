// The IndexedDB schema, in one place (docs/mimari.md, "Depolama ve örnek veri").
import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type {
  Assessment,
  Book,
  Child,
  DrillSuggestion,
  Parent,
  Passage,
  Session,
  StuckWord,
} from '../../domain/types';

export const dbName = 'tikir';
export const schemaVersion = 1;
/** Bumped when the bundled content (seed/) changes, so it is loaded again. */
export const contentVersion = 1;

/** The key of the single record in the parent, child and drill stores. */
export const currentKey = 'current';

/** A recording of a reading (docs/kararlar.md T21): 16 kHz mono WAV and its waveform. */
export interface StoredRecording {
  id: string;
  createdAt: string;
  seconds: number;
  levels: number[];
  wav: ArrayBuffer;
}

export interface TikirSchema extends DBSchema {
  meta: { key: string; value: number };
  parent: { key: string; value: Parent };
  child: { key: string; value: Child };
  drill: { key: string; value: DrillSuggestion };
  books: { key: string; value: Book };
  sessions: { key: string; value: Session };
  stuckWords: { key: string; value: StuckWord };
  assessments: { key: string; value: Assessment };
  passages: { key: string; value: Passage; indexes: { grade: number } };
  recordings: { key: string; value: StoredRecording };
}

export type TikirStore =
  | 'meta'
  | 'parent'
  | 'child'
  | 'drill'
  | 'books'
  | 'sessions'
  | 'stuckWords'
  | 'assessments'
  | 'passages'
  | 'recordings';

export const tikirStores: readonly TikirStore[] = [
  'meta',
  'parent',
  'child',
  'drill',
  'books',
  'sessions',
  'stuckWords',
  'assessments',
  'passages',
  'recordings',
];

/** Opens (and on first use creates) the database with the global indexedDB. */
export function openTikirDb(): Promise<IDBPDatabase<TikirSchema>> {
  return openDB<TikirSchema>(dbName, schemaVersion, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('meta');
        db.createObjectStore('parent');
        db.createObjectStore('child');
        db.createObjectStore('drill');
        db.createObjectStore('books', { keyPath: 'id' });
        db.createObjectStore('sessions', { keyPath: 'date' });
        db.createObjectStore('stuckWords', { keyPath: 'word' });
        db.createObjectStore('assessments', { keyPath: 'id' });
        db.createObjectStore('passages', { keyPath: 'id' }).createIndex('grade', 'grade');
        db.createObjectStore('recordings', { keyPath: 'id' });
      }
    },
  });
}
