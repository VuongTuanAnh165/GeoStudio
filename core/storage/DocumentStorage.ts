import { openDB, type IDBPDatabase } from 'idb';
import type { GeoDocument } from '../types/document';

const DB_NAME = 'GeoStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

export class DocumentStorage {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'metadata.id' });
          store.createIndex('updatedAt', 'metadata.updatedAt');
        }
      },
    });
  }

  async save(document: GeoDocument): Promise<void> {
    const db = await this.dbPromise;
    document.metadata.updatedAt = new Date().toISOString();
    await db.put(STORE_NAME, document);
  }

  async load(id: string): Promise<GeoDocument | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_NAME, id);
  }

  async list(): Promise<GeoDocument[]> {
    const db = await this.dbPromise;
    // We can use the index to sort by updatedAt descending, 
    // but idb getAll returns in key order. We'll sort in memory.
    const docs = await db.getAll(STORE_NAME);
    return docs.sort((a, b) => {
      const dateA = new Date(a.metadata.updatedAt).getTime();
      const dateB = new Date(b.metadata.updatedAt).getTime();
      return dateB - dateA; // Descending
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }
}
