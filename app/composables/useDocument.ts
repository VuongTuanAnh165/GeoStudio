import { ref, watch, onUnmounted } from 'vue';
import { DocumentStorage } from '../../core/storage/DocumentStorage';
import { useGeometryStore } from '../stores/geometry';
import type { GeoDocument } from '../../core/types/document';

const storage = new DocumentStorage();

export function useDocument() {
  const store = useGeometryStore();
  const isSaving = ref(false);
  const lastSaved = ref<Date | null>(null);
  
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  const AUTOSAVE_INTERVAL = 30000; // 30s
  
  const save = async (customMetadata?: Partial<GeoDocument['metadata']>) => {
    isSaving.value = true;
    try {
      const doc = JSON.parse(JSON.stringify(store.currentDocument)) as GeoDocument;
      if (customMetadata) {
        doc.metadata = { ...doc.metadata, ...customMetadata };
      }
      
      // Keep store metadata up to date
      store.rawState.document.metadata = doc.metadata;
      
      await storage.save(doc);
      lastSaved.value = new Date();
    } catch (e) {
      console.error('Failed to save document:', e);
    } finally {
      isSaving.value = false;
    }
  };
  
  const load = async (id: string) => {
    try {
      const doc = await storage.load(id);
      if (doc) {
        store.loadDocument(doc);
        lastSaved.value = new Date(doc.metadata.updatedAt);
        return true;
      }
    } catch (e) {
      console.error('Failed to load document:', e);
    }
    return false;
  };
  
  const list = async () => {
    return storage.list();
  };
  
  const deleteDoc = async (id: string) => {
    return storage.delete(id);
  };
  
  const triggerAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
      save();
    }, AUTOSAVE_INTERVAL);
  };
  
  // Watch for ANY command execution or state changes to trigger autosave
  const unwatch = watch(
    () => store.lastModified,
    () => {
      triggerAutoSave();
    }
  );
  
  onUnmounted(() => {
    unwatch();
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
  });

  return {
    save,
    load,
    list,
    deleteDoc,
    isSaving,
    lastSaved
  };
}
