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

  describe('Lesson Player (Task 9.3)', () => {
    beforeEach(() => {
      lessonStore.createNewLesson({
        title: 'Bài giảng tam giác',
        grade: 7,
        description: 'Mô tả bài giảng tam giác'
      });
    });

    it('starts player with current lesson', async () => {
      expect(lessonStore.isPlayerActive).toBe(false);
      await lessonStore.startPlayer();

      expect(lessonStore.isPlayerActive).toBe(true);
      expect(lessonStore.playerCurrentStepIndex).toBe(1);
      expect(lessonStore.playerCurrentStep).toBeDefined();
      expect(lessonStore.playerCurrentStep?.title).toBe(lessonStore.steps[0]?.title);
    });

    it('starts player with direct Lesson object snapshot', async () => {
      const mockLesson = {
        id: 'mock-lesson-99',
        title: 'Custom Snap Lesson',
        grade: 8,
        description: 'Direct lesson',
        tags: [],
        steps: [
          {
            id: 's-custom-1',
            stepNumber: 1,
            title: 'Bước A',
            description: 'Vẽ A',
            objectIds: ['custom-obj-1'],
            duration: 1500
          }
        ],
        document: {
          id: 'custom-doc-1',
          version: '1.0.0',
          metadata: { title: 'Custom Snap', createdAt: 1, updatedAt: 1 },
          settings: { dimension: 2, gridVisible: true, axisVisible: true, snapEnabled: true, theme: 'light' },
          viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
          objects: [
            {
              id: 'custom-obj-1',
              type: 'point',
              dimension: 2,
              definition: { kind: 'point', coords: { x: 10, y: 10 } }
            }
          ]
        },
        createdAt: 1,
        updatedAt: 1
      };

      await lessonStore.startPlayer(mockLesson as any);
      expect(lessonStore.isPlayerActive).toBe(true);
      expect(lessonStore.currentLesson?.title).toBe('Custom Snap Lesson');
      expect(geometryStore.objects.has('custom-obj-1')).toBe(true);
      expect(lessonStore.playerCurrentStepIndex).toBe(1);
    });

    it('navigates through steps with next, prev, first, last, goToStep', async () => {
      await lessonStore.startPlayer();
      expect(lessonStore.playerCurrentStepIndex).toBe(1);

      lessonStore.playerNextStep();
      expect(lessonStore.playerCurrentStepIndex).toBe(2);

      lessonStore.playerNextStep();
      expect(lessonStore.playerCurrentStepIndex).toBe(3);

      // Boundary: cannot advance past totalSteps
      lessonStore.playerNextStep();
      expect(lessonStore.playerCurrentStepIndex).toBe(3);

      lessonStore.playerPrevStep();
      expect(lessonStore.playerCurrentStepIndex).toBe(2);

      lessonStore.playerFirstStep();
      expect(lessonStore.playerCurrentStepIndex).toBe(1);

      // Boundary: cannot go before step 1 via prevStep
      lessonStore.playerPrevStep();
      expect(lessonStore.playerCurrentStepIndex).toBe(1);

      lessonStore.playerLastStep();
      expect(lessonStore.playerCurrentStepIndex).toBe(3);

      lessonStore.playerGoToStep(2);
      expect(lessonStore.playerCurrentStepIndex).toBe(2);
    });

    it('calculates playerVisibleObjectIds progressively', async () => {
      await lessonStore.startPlayer();

      lessonStore.playerGoToStep(1);
      expect(lessonStore.playerVisibleObjectIds.has('p1')).toBe(true);
      expect(lessonStore.playerVisibleObjectIds.has('p2')).toBe(false);
      expect(lessonStore.playerVisibleObjectIds.has('s1')).toBe(false);
      expect(lessonStore.playerActiveObjectIds).toEqual(['p1']);

      lessonStore.playerGoToStep(2);
      expect(lessonStore.playerVisibleObjectIds.has('p1')).toBe(true);
      expect(lessonStore.playerVisibleObjectIds.has('p2')).toBe(true);
      expect(lessonStore.playerVisibleObjectIds.has('s1')).toBe(false);
      expect(lessonStore.playerActiveObjectIds).toEqual(['p2']);

      lessonStore.playerGoToStep(3);
      expect(lessonStore.playerVisibleObjectIds.has('p1')).toBe(true);
      expect(lessonStore.playerVisibleObjectIds.has('p2')).toBe(true);
      expect(lessonStore.playerVisibleObjectIds.has('s1')).toBe(true);
      expect(lessonStore.playerActiveObjectIds).toEqual(['s1']);
    });

    it('manages auto-play mode and speed settings', () => {
      expect(lessonStore.isAutoPlaying).toBe(false);
      expect(lessonStore.playerSpeed).toBe(1);

      lessonStore.startAutoPlay();
      expect(lessonStore.isAutoPlaying).toBe(true);

      lessonStore.setPlayerSpeed(1.5);
      expect(lessonStore.playerSpeed).toBe(1.5);

      lessonStore.pauseAutoPlay();
      expect(lessonStore.isAutoPlaying).toBe(false);

      lessonStore.toggleAutoPlay();
      expect(lessonStore.isAutoPlaying).toBe(true);

      lessonStore.toggleAutoPlay();
      expect(lessonStore.isAutoPlaying).toBe(false);

      // Navigation automatically pauses autoplay
      lessonStore.startAutoPlay();
      lessonStore.playerPrevStep();
      expect(lessonStore.isAutoPlaying).toBe(false);
    });

    it('manages fullscreen mode', () => {
      expect(lessonStore.isPlayerFullscreen).toBe(false);

      lessonStore.enterPlayerFullscreen();
      expect(lessonStore.isPlayerFullscreen).toBe(true);

      lessonStore.exitPlayerFullscreen();
      expect(lessonStore.isPlayerFullscreen).toBe(false);

      lessonStore.togglePlayerFullscreen();
      expect(lessonStore.isPlayerFullscreen).toBe(true);

      lessonStore.togglePlayerFullscreen();
      expect(lessonStore.isPlayerFullscreen).toBe(false);
    });

    it('stops player and resets state cleanly', async () => {
      await lessonStore.startPlayer();
      lessonStore.startAutoPlay();
      lessonStore.enterPlayerFullscreen();

      expect(lessonStore.isPlayerActive).toBe(true);
      expect(lessonStore.isAutoPlaying).toBe(true);
      expect(lessonStore.isPlayerFullscreen).toBe(true);

      lessonStore.stopPlayer();

      expect(lessonStore.isPlayerActive).toBe(false);
      expect(lessonStore.isAutoPlaying).toBe(false);
      expect(lessonStore.isPlayerFullscreen).toBe(false);
    });
  });
});
