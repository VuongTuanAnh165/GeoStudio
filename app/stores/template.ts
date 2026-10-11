import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Template, TemplateCategory } from '../../core/types/template';
import { ALL_PREBUILT_TEMPLATES } from '../../content/templates';
import { defaultTemplateStorage } from '../../core/storage/TemplateStorage';
import { useGeometryStore } from './geometry';

export const useTemplateStore = defineStore('template', () => {
  const geometryStore = useGeometryStore();

  const isBrowserOpen = ref(false);
  const isSaveModalOpen = ref(false);
  const searchQuery = ref('');
  const selectedCategory = ref<TemplateCategory | 'all'>('all');
  const userTemplates = ref<Template[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const notificationMessage = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);

  const normalizeSearch = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  };

  const allTemplates = computed<Template[]>(() => {
    return [...ALL_PREBUILT_TEMPLATES, ...userTemplates.value];
  });

  const filteredTemplates = computed<Template[]>(() => {
    let list = allTemplates.value;

    // Filter by Category
    if (selectedCategory.value !== 'all') {
      if (selectedCategory.value === 'user') {
        list = list.filter(t => t.isUserCreated);
      } else {
        list = list.filter(t => t.category === selectedCategory.value && !t.isUserCreated);
      }
    }

    // Filter by Search Query
    const query = searchQuery.value.trim();
    if (query) {
      const normQuery = normalizeSearch(query);
      list = list.filter(t => {
        const normTitle = normalizeSearch(t.title);
        const normDesc = normalizeSearch(t.description || '');
        const matchTags = t.tags.some(tag => normalizeSearch(tag).includes(normQuery));
        return normTitle.includes(normQuery) || normDesc.includes(normQuery) || matchTags;
      });
    }

    return list;
  });

  const categoryCounts = computed(() => {
    const counts = {
      all: allTemplates.value.length,
      basic_shapes: 0,
      triangle_constructions: 0,
      circle_theorems: 0,
      '3d_solids': 0,
      user: userTemplates.value.length
    };

    ALL_PREBUILT_TEMPLATES.forEach(t => {
      if (t.category in counts) {
        counts[t.category as keyof typeof counts]++;
      }
    });

    return counts;
  });

  const fetchUserTemplates = async (): Promise<void> => {
    isLoading.value = true;
    try {
      userTemplates.value = await defaultTemplateStorage.list();
    } catch (err) {
      console.error('Failed to load user templates from storage:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const openBrowser = (category?: TemplateCategory | 'all') => {
    if (category) {
      selectedCategory.value = category;
    }
    isBrowserOpen.value = true;
    notificationMessage.value = null;
    errorMessage.value = null;
    fetchUserTemplates();
  };

  const closeBrowser = () => {
    isBrowserOpen.value = false;
    isSaveModalOpen.value = false;
  };

  const openSaveModal = () => {
    errorMessage.value = null;
    isSaveModalOpen.value = true;
  };

  const closeSaveModal = () => {
    isSaveModalOpen.value = false;
  };

  const saveCurrentAsTemplate = async (payload: {
    title: string;
    description?: string;
    category?: TemplateCategory;
    grade?: number;
    tags?: string[];
  }): Promise<boolean> => {
    if (geometryStore.objects.size === 0) {
      errorMessage.value = 'Bản vẽ hiện tại chưa có đối tượng hình học nào để lưu thành mẫu.';
      return false;
    }

    if (!payload.title || !payload.title.trim()) {
      errorMessage.value = 'Vui lòng nhập tên cho mẫu dựng.';
      return false;
    }

    const currentDoc = geometryStore.currentDocument;
    const allObjects = Array.from(geometryStore.objects.values());

    isSaving.value = true;
    errorMessage.value = null;

    try {
      const now = new Date().toISOString();
      const docSnapshot = currentDoc ? JSON.parse(JSON.stringify(currentDoc)) : {
        version: '1.0.0',
        schemaVersion: 1,
        metadata: { id: 'doc-' + Date.now(), title: payload.title, createdAt: now, updatedAt: now },
        settings: { theme: 'light', gridVisible: true, axisVisible: true, snapEnabled: true, dimension: geometryStore.is3DMode ? 3 : 2 },
        viewport: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
        objects: []
      };
      docSnapshot.objects = JSON.parse(JSON.stringify(allObjects));

      const newTemplate: Template = {
        id: 'user-tpl-' + Date.now(),
        title: payload.title.trim(),
        description: payload.description?.trim() || 'Mẫu dựng do người dùng tự tạo',
        category: payload.category || 'user',
        grade: payload.grade,
        tags: payload.tags || ['mẫu cá nhân'],
        isUserCreated: true,
        document: docSnapshot,
        createdAt: now,
        updatedAt: now
      };

      await defaultTemplateStorage.save(newTemplate);
      await fetchUserTemplates();
      notificationMessage.value = `Đã lưu thành công mẫu dựng "${newTemplate.title}"!`;
      closeSaveModal();
      return true;
    } catch (err) {
      console.error('Failed to save user template:', err);
      errorMessage.value = 'Lỗi lưu mẫu dựng vào bộ nhớ máy.';
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  const deleteUserTemplate = async (id: string): Promise<void> => {
    try {
      await defaultTemplateStorage.delete(id);
      await fetchUserTemplates();
      notificationMessage.value = 'Đã xóa mẫu dựng cá nhân.';
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const applyTemplate = (template: Template, mode: 'replace' | 'insert' = 'replace') => {
    if (!template || !template.document) return;

    if (mode === 'replace') {
      geometryStore.loadDocument(template.document);
      // Switch view mode if template specifies 3D vs 2D
      const is3D = template.document.settings?.dimension === 3;
      if (is3D && !geometryStore.is3DMode) {
        geometryStore.setViewMode('3d');
      } else if (!is3D && geometryStore.is3DMode) {
        geometryStore.setViewMode('2d');
      }
    } else {
      // Insert mode: import objects with prefixed IDs
      const prefix = `tpl_${Date.now()}_`;
      const idMap = new Map<string, string>();

      template.document.objects.forEach(obj => {
        idMap.set(obj.id, `${prefix}${obj.id}`);
      });

      const currentObjects = (geometryStore.currentDocument?.objects && geometryStore.currentDocument.objects.length > 0)
        ? geometryStore.currentDocument.objects
        : Array.from(geometryStore.objects.values());

      const newObjects = template.document.objects.map(obj => {
        const cloned = JSON.parse(JSON.stringify(obj));
        cloned.id = idMap.get(obj.id) || `${prefix}${obj.id}`;
        if (cloned.parents) {
          cloned.parents = cloned.parents.map((p: string) => idMap.get(p) || p);
        }
        if (cloned.definition) {
          if (cloned.definition.point1 && idMap.has(cloned.definition.point1)) {
            cloned.definition.point1 = idMap.get(cloned.definition.point1);
          }
          if (cloned.definition.point2 && idMap.has(cloned.definition.point2)) {
            cloned.definition.point2 = idMap.get(cloned.definition.point2);
          }
          if (cloned.definition.center && idMap.has(cloned.definition.center)) {
            cloned.definition.center = idMap.get(cloned.definition.center);
          }
          if (cloned.definition.pointOnCircle && idMap.has(cloned.definition.pointOnCircle)) {
            cloned.definition.pointOnCircle = idMap.get(cloned.definition.pointOnCircle);
          }
          if (Array.isArray(cloned.definition.vertices)) {
            cloned.definition.vertices = cloned.definition.vertices.map((v: string) => idMap.get(v) || v);
          }
        }
        return cloned;
      });

      const baseDoc = geometryStore.currentDocument || template.document;
      const mergedDoc = {
        ...baseDoc,
        objects: [...currentObjects, ...newObjects]
      };
      geometryStore.loadDocument(mergedDoc);
    }

    notificationMessage.value = `Đã sử dụng mẫu dựng "${template.title}"`;
    closeBrowser();
  };

  return {
    isBrowserOpen,
    isSaveModalOpen,
    searchQuery,
    selectedCategory,
    userTemplates,
    isLoading,
    isSaving,
    notificationMessage,
    errorMessage,
    allTemplates,
    filteredTemplates,
    categoryCounts,
    openBrowser,
    closeBrowser,
    openSaveModal,
    closeSaveModal,
    fetchUserTemplates,
    saveCurrentAsTemplate,
    deleteUserTemplate,
    applyTemplate
  };
});
