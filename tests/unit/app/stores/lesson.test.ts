import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGeometryStore } from '../../../../app/stores/geometry';
import { useLessonStore } from '../../../../app/stores/lesson';
import type { GeometryObject } from '../../../../core/types/geometry';

describe('useLessonStore', () => {
  let geometryStore: ReturnType<typeof useGeometryStore>;
  let lessonStore: ReturnType<typeof useLessonStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    geometryStore = useGeometryStore();
    lessonStore = useLessonStore();

    // Populate dummy canvas objects
    const p1: GeometryObject = {
      id: 'p1',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: { x: 0, y: 0 } },
      metadata: { label: 'A' }
    };
    const p2: GeometryObject = {
      id: 'p2',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: { x: 4, y: 0 } },
      metadata: { label: 'B' }
    };
    const s1: GeometryObject = {
      id: 's1',
      type: 'segment',
      dimension: 2,
      parents: ['p1', 'p2'],
      definition: { kind: 'segment', point1: 'p1', point2: 'p2' },
      metadata: { label: 'AB' }
    };

    geometryStore.objects.set('p1', p1);
    geometryStore.objects.set('p2', p2);
    geometryStore.objects.set('s1', s1);
  });

  describe('Lesson Initialization', () => {
    it('creates a new lesson with title, grade and description', () => {
      lessonStore.createNewLesson({
        title: 'Bài giảng đoạn thẳng',
        grade: 6,
        description: 'Hướng dẫn vẽ đoạn thẳng AB'
      });

      expect(lessonStore.currentLesson).toBeDefined();
      expect(lessonStore.currentLesson?.title).toBe('Bài giảng đoạn thẳng');
      expect(lessonStore.currentLesson?.grade).toBe(6);
      expect(lessonStore.currentLesson?.description).toBe('Hướng dẫn vẽ đoạn thẳng AB');
      expect(lessonStore.steps.length).toBe(3); // A, B, AB
    });

    it('generates steps automatically from geometry objects', () => {
      lessonStore.createNewLesson();
      expect(lessonStore.steps.length).toBe(3);
      expect(lessonStore.steps[0]?.objectIds).toContain('p1');
      expect(lessonStore.steps[1]?.objectIds).toContain('p2');
      expect(lessonStore.steps[2]?.objectIds).toContain('s1');
      expect(lessonStore.steps[0]?.stepNumber).toBe(1);
      expect(lessonStore.steps[1]?.stepNumber).toBe(2);
      expect(lessonStore.steps[2]?.stepNumber).toBe(3);
    });
  });

  describe('Step Manipulation & Reordering', () => {
    beforeEach(() => {
      lessonStore.createNewLesson();
    });

    it('adds a new manual step and indexes correctly', () => {
      const initialCount = lessonStore.steps.length;
      lessonStore.addStep({
        title: 'Bước bổ sung',
        description: 'Vẽ trung điểm M',
        annotation: 'Chú ý lấy đúng trung điểm'
      });

      expect(lessonStore.steps.length).toBe(initialCount + 1);
      const added = lessonStore.steps[lessonStore.steps.length - 1];
      expect(added?.stepNumber).toBe(initialCount + 1);
      expect(added?.title).toBe('Bước bổ sung');
      expect(added?.annotation).toBe('Chú ý lấy đúng trung điểm');
    });

    it('removes a step and recalculates step numbers', () => {
      const stepToRemove = lessonStore.steps[1]; // Step 2 (p2)
      expect(stepToRemove).toBeDefined();

      lessonStore.removeStep(stepToRemove!.id);
      expect(lessonStore.steps.length).toBe(2);
      expect(lessonStore.steps[0]?.stepNumber).toBe(1);
      expect(lessonStore.steps[1]?.stepNumber).toBe(2);
    });

    it('reorders steps by moving up and down', () => {
      const step1Id = lessonStore.steps[0]!.id;
      const step2Id = lessonStore.steps[1]!.id;

      // Move Step 1 down (swapping with Step 2)
      lessonStore.moveStep(0, 'down');
      expect(lessonStore.steps[0]?.id).toBe(step2Id);
      expect(lessonStore.steps[1]?.id).toBe(step1Id);
      expect(lessonStore.steps[0]?.stepNumber).toBe(1);
      expect(lessonStore.steps[1]?.stepNumber).toBe(2);

      // Move Step 2 up (swapping back)
      lessonStore.moveStep(1, 'up');
      expect(lessonStore.steps[0]?.id).toBe(step1Id);
      expect(lessonStore.steps[1]?.id).toBe(step2Id);
    });

    it('ignores invalid move operations at boundaries', () => {
      const firstStepId = lessonStore.steps[0]!.id;
      lessonStore.moveStep(0, 'up'); // Cannot move up beyond 0
      expect(lessonStore.steps[0]?.id).toBe(firstStepId);

      const lastIndex = lessonStore.steps.length - 1;
      const lastStepId = lessonStore.steps[lastIndex]!.id;
      lessonStore.moveStep(lastIndex, 'down'); // Cannot move down beyond last
      expect(lessonStore.steps[lastIndex]?.id).toBe(lastStepId);
    });
  });

  describe('Annotations & Formulas', () => {
    beforeEach(() => {
      lessonStore.createNewLesson();
    });

    it('updates text annotations on a step', () => {
      const stepId = lessonStore.steps[0]!.id;
      lessonStore.setStepAnnotation(stepId, 'Điểm A là điểm mút thứ nhất.');
      expect(lessonStore.steps[0]?.annotation).toBe('Điểm A là điểm mút thứ nhất.');
    });

    it('updates KaTeX formula on a step', () => {
      const stepId = lessonStore.steps[2]!.id;
      lessonStore.setStepFormula(stepId, 'AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2}');
      expect(lessonStore.steps[2]?.formula).toBe('AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2}');
    });

    it('updates lesson metadata correctly', () => {
      lessonStore.updateLessonMetadata({
        title: 'Tên bài mới',
        grade: 8,
        description: 'Mô tả mới',
        tags: ['tam giác', 'đường cao']
      });

      expect(lessonStore.currentLesson?.title).toBe('Tên bài mới');
      expect(lessonStore.currentLesson?.grade).toBe(8);
      expect(lessonStore.currentLesson?.description).toBe('Mô tả mới');
      expect(lessonStore.currentLesson?.tags).toEqual(['tam giác', 'đường cao']);
    });
  });

  describe('Preview Controls', () => {
    beforeEach(() => {
      lessonStore.createNewLesson();
    });

    it('controls preview step navigation', () => {
      expect(lessonStore.isPreviewActive).toBe(false);
      lessonStore.startPreview();

      expect(lessonStore.isPreviewActive).toBe(true);
      expect(lessonStore.previewStepIndex).toBe(1);
      expect(lessonStore.currentPreviewStep?.stepNumber).toBe(1);

      lessonStore.nextPreviewStep();
      expect(lessonStore.previewStepIndex).toBe(2);

      lessonStore.nextPreviewStep();
      expect(lessonStore.previewStepIndex).toBe(3);

      // Boundary: Cannot go beyond total steps
      lessonStore.nextPreviewStep();
      expect(lessonStore.previewStepIndex).toBe(3);

      lessonStore.prevPreviewStep();
      expect(lessonStore.previewStepIndex).toBe(2);

      lessonStore.goToPreviewStep(1);
      expect(lessonStore.previewStepIndex).toBe(1);

      lessonStore.stopPreview();
      expect(lessonStore.isPreviewActive).toBe(false);
    });

    it('computes visible object IDs progressively during preview', () => {
      lessonStore.startPreview();
      lessonStore.goToPreviewStep(1);
      expect(lessonStore.visibleObjectIdsInPreview.has('p1')).toBe(true);
      expect(lessonStore.visibleObjectIdsInPreview.has('p2')).toBe(false);
      expect(lessonStore.visibleObjectIdsInPreview.has('s1')).toBe(false);

      lessonStore.goToPreviewStep(2);
      expect(lessonStore.visibleObjectIdsInPreview.has('p1')).toBe(true);
      expect(lessonStore.visibleObjectIdsInPreview.has('p2')).toBe(true);
      expect(lessonStore.visibleObjectIdsInPreview.has('s1')).toBe(false);

      lessonStore.goToPreviewStep(3);
      expect(lessonStore.visibleObjectIdsInPreview.has('p1')).toBe(true);
      expect(lessonStore.visibleObjectIdsInPreview.has('p2')).toBe(true);
      expect(lessonStore.visibleObjectIdsInPreview.has('s1')).toBe(true);
    });
  });

  describe('Validation & Saving', () => {
    it('fails to save when title is empty', async () => {
      lessonStore.createNewLesson({ title: '' });
      const result = await lessonStore.saveLesson();
      expect(result).toBe(false);
      expect(lessonStore.errorMessage).toBeTruthy();
    });
  });
});
