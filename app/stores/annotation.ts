import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Annotation, AnnotationType, AnnotationStyle } from '../../core/types/annotation';
import type { Coords2D } from '../../core/types/geometry';
import type { GeoDocument } from '../../core/types/document';
import { useGeometryStore } from './geometry';

export const useAnnotationStore = defineStore('annotation', () => {
  const geometryStore = useGeometryStore();

  const annotations = ref<Annotation[]>([]);
  const isVisible = ref(true); // Global toggle
  const activeTool = ref<AnnotationType | null>(null);
  const selectedId = ref<string | null>(null);
  const isModalOpen = ref(false);
  const editingAnnotation = ref<Partial<Annotation> | null>(null);

  const visibleAnnotations = computed<Annotation[]>(() => {
    if (!isVisible.value) return [];
    return annotations.value.filter(a => a.visible !== false);
  });

  const selectedAnnotation = computed<Annotation | null>(() => {
    if (!selectedId.value) return null;
    return annotations.value.find(a => a.id === selectedId.value) || null;
  });

  const count = computed(() => annotations.value.length);

  const syncToDocument = () => {
    if (geometryStore.currentDocument) {
      geometryStore.currentDocument.annotations = JSON.parse(JSON.stringify(annotations.value));
    }
  };

  const loadFromDocument = (doc: GeoDocument) => {
    if (doc && Array.isArray(doc.annotations)) {
      annotations.value = JSON.parse(JSON.stringify(doc.annotations));
    } else {
      annotations.value = [];
    }
    selectedId.value = null;
  };

  // Watch for document changes in geometry store
  watch(
    () => geometryStore.currentDocument?.metadata?.id,
    () => {
      if (geometryStore.currentDocument) {
        loadFromDocument(geometryStore.currentDocument);
      }
    },
    { immediate: true }
  );

  const addAnnotation = (
    data: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ): Annotation => {
    const now = new Date().toISOString();
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAnn: Annotation = {
      ...data,
      id,
      visible: data.visible !== false,
      createdAt: now,
      updatedAt: now
    };

    annotations.value.push(newAnn);
    syncToDocument();
    return newAnn;
  };

  const updateAnnotation = (
    id: string,
    updates: Partial<Omit<Annotation, 'id'>>
  ): boolean => {
    const index = annotations.value.findIndex(a => a.id === id);
    if (index === -1) return false;

    const existing = annotations.value[index]!;
    annotations.value[index] = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    syncToDocument();
    return true;
  };

  const deleteAnnotation = (id: string): boolean => {
    const initialLen = annotations.value.length;
    annotations.value = annotations.value.filter(a => a.id !== id);
    if (selectedId.value === id) {
      selectedId.value = null;
    }
    if (annotations.value.length !== initialLen) {
      syncToDocument();
      return true;
    }
    return false;
  };

  const toggleAllVisibility = () => {
    isVisible.value = !isVisible.value;
  };

  const toggleAnnotationVisibility = (id: string) => {
    const ann = annotations.value.find(a => a.id === id);
    if (ann) {
      ann.visible = !ann.visible;
      syncToDocument();
    }
  };

  const selectAnnotation = (id: string | null) => {
    selectedId.value = id;
  };

  const clearAnnotations = () => {
    annotations.value = [];
    selectedId.value = null;
    syncToDocument();
  };

  // Quick pedagogical creation helpers
  const addTextAnnotation = (
    position: Coords2D,
    content: string,
    style?: AnnotationStyle
  ): Annotation => {
    return addAnnotation({
      type: 'text',
      position,
      content,
      style: {
        color: '#1e293b',
        fontSize: 14,
        ...style
      },
      visible: true
    });
  };

  const addFormulaAnnotation = (
    position: Coords2D,
    content: string,
    style?: AnnotationStyle
  ): Annotation => {
    return addAnnotation({
      type: 'formula',
      position,
      content,
      style: {
        color: '#2563eb',
        fontSize: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        ...style
      },
      visible: true
    });
  };

  const addArrowAnnotation = (
    from: Coords2D,
    to: Coords2D,
    content = '',
    style?: AnnotationStyle
  ): Annotation => {
    return addAnnotation({
      type: 'arrow',
      position: from,
      targetPosition: to,
      content,
      style: {
        color: '#ef4444',
        arrowHead: true,
        ...style
      },
      visible: true
    });
  };

  const addStepLabel = (
    position: Coords2D,
    stepNumber: number,
    content: string,
    style?: AnnotationStyle
  ): Annotation => {
    return addAnnotation({
      type: 'step_label',
      position,
      stepNumber,
      content,
      style: {
        color: '#4f46e5',
        backgroundColor: '#e0e7ff',
        borderRadius: 8,
        ...style
      },
      visible: true
    });
  };

  const addHighlight = (
    position: Coords2D,
    targetObjectId?: string,
    content = '',
    style?: AnnotationStyle
  ): Annotation => {
    return addAnnotation({
      type: 'highlight',
      position,
      targetObjectId,
      content,
      style: {
        highlightColor: '#f59e0b',
        ...style
      },
      visible: true
    });
  };

  // Modal handlers
  const openCreateModal = (type: AnnotationType = 'text', defaultPos?: Coords2D) => {
    editingAnnotation.value = {
      type,
      position: defaultPos || { x: 0, y: 0 },
      targetPosition: type === 'arrow' ? { x: (defaultPos?.x || 0) + 2, y: (defaultPos?.y || 0) + 2 } : undefined,
      content: '',
      stepNumber: type === 'step_label' ? count.value + 1 : undefined,
      visible: true,
      style: {
        color: '#1e293b',
        fontSize: 14
      }
    };
    isModalOpen.value = true;
  };

  const openEditModal = (ann: Annotation) => {
    editingAnnotation.value = JSON.parse(JSON.stringify(ann));
    isModalOpen.value = true;
  };

  const closeModal = () => {
    isModalOpen.value = false;
    editingAnnotation.value = null;
  };

  const saveEditingAnnotation = () => {
    if (!editingAnnotation.value) {
      return false;
    }

    const ann = editingAnnotation.value;
    const type = ann.type || 'text';
    const content = ann.content ? ann.content.trim() : '';

    if ((type === 'text' || type === 'formula' || type === 'step_label') && !content) {
      return false;
    }

    ann.content = ann.content || '';
    isVisible.value = true;

    if (ann.id) {
      updateAnnotation(ann.id, ann);
    } else {
      addAnnotation(ann as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>);
    }

    closeModal();
    return true;
  };

  return {
    annotations,
    isVisible,
    activeTool,
    selectedId,
    isModalOpen,
    editingAnnotation,
    visibleAnnotations,
    selectedAnnotation,
    count,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    toggleAllVisibility,
    toggleAnnotationVisibility,
    selectAnnotation,
    clearAnnotations,
    loadFromDocument,
    syncToDocument,
    addTextAnnotation,
    addFormulaAnnotation,
    addArrowAnnotation,
    addStepLabel,
    addHighlight,
    openCreateModal,
    openEditModal,
    closeModal,
    saveEditingAnnotation
  };
});
