import { openDB, type IDBPDatabase } from 'idb';
import type { Lesson } from '../types/lesson';

export const DB_NAME = 'GeoStudioDB';
export const DB_VERSION = 2;
export const LESSONS_STORE_NAME = 'lessons';
export const DOCUMENTS_STORE_NAME = 'documents';

export class LessonStorage {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(DOCUMENTS_STORE_NAME)) {
            const docStore = db.createObjectStore(DOCUMENTS_STORE_NAME, { keyPath: 'metadata.id' });
            docStore.createIndex('updatedAt', 'metadata.updatedAt');
          }
          if (!db.objectStoreNames.contains(LESSONS_STORE_NAME)) {
            const lessonStore = db.createObjectStore(LESSONS_STORE_NAME, { keyPath: 'id' });
            lessonStore.createIndex('updatedAt', 'updatedAt');
            lessonStore.createIndex('grade', 'grade');
          }
        },
      });
    }
  }

  async save(lesson: Lesson): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    lesson.updatedAt = new Date().toISOString();
    await db.put(LESSONS_STORE_NAME, lesson);
  }

  async load(id: string): Promise<Lesson | undefined> {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    return db.get(LESSONS_STORE_NAME, id);
  }

  async list(): Promise<Lesson[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    const lessons: Lesson[] = await db.getAll(LESSONS_STORE_NAME);
    return lessons.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Descending
    });
  }

  async delete(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete(LESSONS_STORE_NAME, id);
  }
}

export const defaultLessonStorage = new LessonStorage();
