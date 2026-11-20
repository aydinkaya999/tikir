// Where recordings are kept: the recordings store of the app's IndexedDB (src/services/repository/db.ts).
import type { IDBPDatabase } from 'idb';
import type { Id } from '../../domain/types';
import { openTikirDb, type StoredRecording, type TikirSchema } from '../repository/db';

export type { StoredRecording } from '../repository/db';

/** A stored recording without its sound, for the lists. */
export type StoredRecordingInfo = Omit<StoredRecording, 'wav'>;

export interface RecordingStore {
  put(recording: StoredRecording): Promise<void>;
  get(id: Id): Promise<StoredRecording | null>;
  remove(id: Id): Promise<void>;
  /** Every recording without its sound, in no particular order. */
  list(): Promise<StoredRecordingInfo[]>;
}

export class IndexedDbRecordingStore implements RecordingStore {
  private database: Promise<IDBPDatabase<TikirSchema>> | null = null;

  async put(recording: StoredRecording): Promise<void> {
    await (await this.db()).put('recordings', recording);
  }

  async get(id: Id): Promise<StoredRecording | null> {
    return (await (await this.db()).get('recordings', id)) ?? null;
  }

  async remove(id: Id): Promise<void> {
    await (await this.db()).delete('recordings', id);
  }

  /** One recording at a time through a cursor, so the sounds never pile up in memory. */
  async list(): Promise<StoredRecordingInfo[]> {
    const listed: StoredRecordingInfo[] = [];
    let cursor = await (await this.db()).transaction('recordings').store.openCursor();
    while (cursor !== null) {
      const { id, createdAt, seconds, levels, approval } = cursor.value;
      listed.push({
        id,
        createdAt,
        seconds,
        levels,
        ...(approval === undefined ? {} : { approval }),
      });
      cursor = await cursor.continue();
    }
    return listed;
  }

  /** Opened on first use; a failed open is tried again next time. */
  private db(): Promise<IDBPDatabase<TikirSchema>> {
    this.database ??= openTikirDb().catch((error: unknown) => {
      this.database = null;
      throw error;
    });
    return this.database;
  }
}
