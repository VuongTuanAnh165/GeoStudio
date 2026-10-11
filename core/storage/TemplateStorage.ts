import { openDB, type IDBPDatabase } from 'idb';
import type { Template } from '../types/template';

export const DB_NAME = 'GeoStudioDB';
export const DB_VERSION = 3;
export const TEMPLATES_STORE_NAME = 'templates';
export const DOCUMENTS_STORE_NAME = 'documents';
export const LESSONS_STORE_NAME = 'lessons';

export class TemplateStorage {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private memoryFallback: Map<string, Template> = new Map();

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
          if (!db.objectStoreNames.contains(TEMPLATES_STORE_NAME)) {
            const templateStore = db.createObjectStore(TEMPLATES_STORE_NAME, { keyPath: 'id' });
            templateStore.createIndex('updatedAt', 'updatedAt');
            templateStore.createIndex('category', 'category');
          }
        },
      });
    }
  }

  async save(template: Template): Promise<void> {
    template.updatedAt = new Date().toISOString();
    if (!this.dbPromise) {
      this.memoryFallback.set(template.id, JSON.parse(JSON.stringify(template)));
      return;
    }
    const db = await this.dbPromise;
    await db.put(TEMPLATES_STORE_NAME, template);
  }

  async load(id: string): Promise<Template | undefined> {
    if (!this.dbPromise) {
      return this.memoryFallback.get(id);
    }
    const db = await this.dbPromise;
    return db.get(TEMPLATES_STORE_NAME, id);
  }

  async list(): Promise<Template[]> {
    if (!this.dbPromise) {
      return Array.from(this.memoryFallback.values()).sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
    }
    const db = await this.dbPromise;
    const items: Template[] = await db.getAll(TEMPLATES_STORE_NAME);
    return items.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });
  }

  async delete(id: string): Promise<void> {
    if (!this.dbPromise) {
      this.memoryFallback.delete(id);
      return;
    }
    const db = await this.dbPromise;
    await db.delete(TEMPLATES_STORE_NAME, id);
  }
}

export const defaultTemplateStorage = new TemplateStorage();
