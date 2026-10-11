import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useGeometryStore } from './geometry';
import { ConstructionProtocol } from '../../core/geometry/replay/ConstructionProtocol';
import { defaultLessonStorage } from '../../core/storage/LessonStorage';
import type { Lesson, LessonStep } from '../../core/types/lesson';
import { LessonSchema } from '../../core/types/lesson';
import type { GeoDocument } from '../../core/types/document';

export const useLessonStore = defineStore('lesson', () => {
  const geometryStore = useGeometryStore();
  const storage = defaultLessonStorage;

  // State
  const isBuilderOpen = ref(false);
  const isPreviewActive = ref(false);
  const previewStepIndex = ref(0);
  const currentLesson = ref<Lesson | null>(null);
  const savedLessons = ref<Lesson[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  // Getters
  const steps = computed<LessonStep[]>(() => {
    return currentLesson.value?.steps || [];
  });

  const totalSteps = computed(() => steps.value.length);

  const currentPreviewStep = computed<LessonStep | null>(() => {
    if (!currentLesson.value || previewStepIndex.value <= 0 || previewStepIndex.value > steps.value.length) {
      return null;
    }
    return steps.value[previewStepIndex.value - 1] ?? null;
  });

  const visibleObjectIdsInPreview = computed<Set<string>>(() => {
    const visible = new Set<string>();
    if (!currentLesson.value || previewStepIndex.value <= 0) {
      return visible;
    }

    const maxIdx = Math.min(previewStepIndex.value, steps.value.length);
    for (let i = 0; i < maxIdx; i++) {
      const step = steps.value[i];
      if (step) {
        for (const id of step.objectIds) {
          visible.add(id);
        }
      }
    }
    return visible;
  });

  // Actions
  const reindexSteps = (items: LessonStep[]) => {
    return items.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1
    }));
  };

  const createNewLesson = (initialData?: Partial<Lesson>) => {
    const doc = JSON.parse(JSON.stringify(geometryStore.currentDocument)) as GeoDocument;
    const objs = Array.from(geometryStore.objects.values());
    const baseSteps = ConstructionProtocol.generateSteps(objs, 'vi');

    const lessonSteps: LessonStep[] = baseSteps.map((s, idx) => ({
      id: `step_${idx + 1}_${s.id}`,
      stepNumber: idx + 1,
      objectIds: s.objectIds,
      title: s.label,
      description: s.description,
      annotation: s.annotation || '',
      formula: '',
      duration: 2000
    }));

    const now = new Date().toISOString();
    currentLesson.value = {
      id: initialData?.id || `lesson-${Date.now()}`,
      title: initialData?.title !== undefined ? initialData.title : (doc.metadata?.title || 'Bài giảng hình học mới'),
      grade: initialData?.grade || (typeof doc.metadata?.grade === 'number' ? doc.metadata.grade : 7),
      description: initialData?.description !== undefined ? initialData.description : (doc.metadata?.description || ''),
      tags: initialData?.tags || doc.metadata?.tags || [],
      document: doc,
      steps: initialData?.steps || lessonSteps,
      createdAt: initialData?.createdAt || now,
      updatedAt: now
    };

    errorMessage.value = null;
    successMessage.value = null;
  };

  const generateStepsFromCanvas = () => {
    if (!currentLesson.value) {
      createNewLesson();
      return;
    }

    const objs = Array.from(geometryStore.objects.values());
    const baseSteps = ConstructionProtocol.generateSteps(objs, 'vi');

    // Preserve existing annotations and formulas if objectId matches
    const existingByObjectId = new Map<string, { annotation?: string; formula?: string; duration?: number }>();
    for (const step of currentLesson.value.steps) {
      for (const objId of step.objectIds) {
        existingByObjectId.set(objId, {
          annotation: step.annotation,
          formula: step.formula,
          duration: step.duration
        });
      }
    }

    const newSteps: LessonStep[] = baseSteps.map((s, idx) => {
      const match = s.objectIds.length > 0 ? existingByObjectId.get(s.objectIds[0] ?? '') : undefined;
      return {
        id: `step_${idx + 1}_${s.id}`,
        stepNumber: idx + 1,
        objectIds: s.objectIds,
        title: s.label,
        description: s.description,
        annotation: match?.annotation || s.annotation || '',
        formula: match?.formula || '',
        duration: match?.duration || 2000
      };
    });

    currentLesson.value.steps = newSteps;
    currentLesson.value.document = JSON.parse(JSON.stringify(geometryStore.currentDocument)) as GeoDocument;
  };

  const addStep = (stepData?: Partial<LessonStep>) => {
    if (!currentLesson.value) {
      createNewLesson();
    }
    if (!currentLesson.value) return;

    const nextIndex = currentLesson.value.steps.length + 1;
    const newStep: LessonStep = {
      id: stepData?.id || `step_${Date.now()}`,
      stepNumber: nextIndex,
      objectIds: stepData?.objectIds || [],
      title: stepData?.title || `Bước ${nextIndex}`,
      description: stepData?.description || '',
      annotation: stepData?.annotation || '',
      formula: stepData?.formula || '',
      duration: stepData?.duration || 2000
    };

    currentLesson.value.steps = [...currentLesson.value.steps, newStep];
  };

  const removeStep = (stepId: string) => {
    if (!currentLesson.value) return;
    const remaining = currentLesson.value.steps.filter(s => s.id !== stepId);
    currentLesson.value.steps = reindexSteps(remaining);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!currentLesson.value) return;
    const list = [...currentLesson.value.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= list.length) {
      return;
    }

    const currentItem = list[index];
    const targetItem = list[targetIndex];
    if (!currentItem || !targetItem) return;

    list[index] = targetItem;
    list[targetIndex] = currentItem;

    currentLesson.value.steps = reindexSteps(list);
  };

  const updateStep = (stepId: string, updates: Partial<LessonStep>) => {
    if (!currentLesson.value) return;
    currentLesson.value.steps = currentLesson.value.steps.map(step => {
      if (step.id === stepId) {
        return { ...step, ...updates };
      }
      return step;
    });
  };

  const setStepAnnotation = (stepId: string, annotation: string) => {
    updateStep(stepId, { annotation });
  };

  const setStepFormula = (stepId: string, formula: string) => {
    updateStep(stepId, { formula });
  };

  const updateLessonMetadata = (metadata: {
    title?: string;
    grade?: number;
    description?: string;
    tags?: string[];
  }) => {
    if (!currentLesson.value) return;
    if (metadata.title !== undefined) currentLesson.value.title = metadata.title;
    if (metadata.grade !== undefined) currentLesson.value.grade = metadata.grade;
    if (metadata.description !== undefined) currentLesson.value.description = metadata.description;
    if (metadata.tags !== undefined) currentLesson.value.tags = metadata.tags;
  };

  const saveLesson = async (): Promise<boolean> => {
    if (!currentLesson.value) {
      errorMessage.value = 'Chưa có bài giảng nào được khởi tạo.';
      return false;
    }

    // Always update document snapshot
    currentLesson.value.document = JSON.parse(JSON.stringify(geometryStore.currentDocument)) as GeoDocument;
    currentLesson.value.updatedAt = new Date().toISOString();

    const parseResult = LessonSchema.safeParse(currentLesson.value);
    if (!parseResult.success) {
      errorMessage.value = parseResult.error.issues?.[0]?.message || 'Dữ liệu bài giảng không hợp lệ.';
      return false;
    }

    isSaving.value = true;
    errorMessage.value = null;
    try {
      await storage.save(currentLesson.value);
      successMessage.value = 'Đã lưu bài giảng thành công vào IndexedDB!';
      await fetchSavedLessons();
      return true;
    } catch (err) {
      console.error('Failed to save lesson:', err);
      errorMessage.value = 'Lỗi lưu bài giảng vào IndexedDB.';
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  const loadLesson = async (id: string, applyToCanvas = true): Promise<boolean> => {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const lesson = await storage.load(id);
      if (!lesson) {
        errorMessage.value = 'Không tìm thấy bài giảng trong cơ sở dữ liệu.';
        return false;
      }

      currentLesson.value = lesson;
      if (applyToCanvas && lesson.document) {
        geometryStore.loadDocument(lesson.document);
      }
      return true;
    } catch (err) {
      console.error('Failed to load lesson:', err);
      errorMessage.value = 'Lỗi tải bài giảng từ IndexedDB.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchSavedLessons = async (): Promise<void> => {
    isLoading.value = true;
    try {
      savedLessons.value = await storage.list();
    } catch (err) {
      console.error('Failed to fetch saved lessons:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteLesson = async (id: string): Promise<void> => {
    try {
      await storage.delete(id);
      await fetchSavedLessons();
      if (currentLesson.value?.id === id) {
        currentLesson.value = null;
      }
    } catch (err) {
      console.error('Failed to delete lesson:', err);
    }
  };

  const openBuilder = () => {
    if (!currentLesson.value) {
      createNewLesson();
    }
    isBuilderOpen.value = true;
    fetchSavedLessons();
  };

  const closeBuilder = () => {
    isBuilderOpen.value = false;
    stopPreview();
  };

  const startPreview = () => {
    isPreviewActive.value = true;
    previewStepIndex.value = totalSteps.value > 0 ? 1 : 0;
  };

  const stopPreview = () => {
    isPreviewActive.value = false;
    previewStepIndex.value = 0;
  };

  const nextPreviewStep = () => {
    if (previewStepIndex.value < totalSteps.value) {
      previewStepIndex.value++;
    }
  };

  const prevPreviewStep = () => {
    if (previewStepIndex.value > 1) {
      previewStepIndex.value--;
    }
  };

  const goToPreviewStep = (index: number) => {
    previewStepIndex.value = Math.max(1, Math.min(totalSteps.value, index));
  };

  return {
    // State
    isBuilderOpen,
    isPreviewActive,
    previewStepIndex,
    currentLesson,
    savedLessons,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,

    // Getters
    steps,
    totalSteps,
    currentPreviewStep,
    visibleObjectIdsInPreview,

    // Actions
    createNewLesson,
    generateStepsFromCanvas,
    addStep,
    removeStep,
    moveStep,
    updateStep,
    setStepAnnotation,
    setStepFormula,
    updateLessonMetadata,
    saveLesson,
    loadLesson,
    fetchSavedLessons,
    deleteLesson,
    openBuilder,
    closeBuilder,
    startPreview,
    stopPreview,
    nextPreviewStep,
    prevPreviewStep,
    goToPreviewStep
  };
});
