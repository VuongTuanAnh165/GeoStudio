import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAnnotationStore } from '../../../../app/stores/annotation';
import { useGeometryStore } from '../../../../app/stores/geometry';
import type { GeoDocument } from '../../../../core/types/document';

describe('useAnnotationStore', () => {
  let annotationStore: ReturnType<typeof useAnnotationStore>;
  let geometryStore: ReturnType<typeof useGeometryStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    geometryStore = useGeometryStore();
    annotationStore = useAnnotationStore();
  });

  describe('CRUD operations', () => {
    it('adds a text annotation via helper', () => {
      const ann = annotationStore.addTextAnnotation({ x: 2, y: 3 }, 'Đoạn thẳng AB');
      expect(ann).toBeDefined();
      expect(ann.type).toBe('text');
      expect(ann.content).toBe('Đoạn thẳng AB');
      expect(ann.position).toEqual({ x: 2, y: 3 });
      expect(annotationStore.count).toBe(1);
      expect(annotationStore.annotations[0]?.id).toBe(ann.id);
    });

    it('adds a formula annotation (KaTeX) via helper', () => {
      const ann = annotationStore.addFormulaAnnotation({ x: 0, y: 1 }, 'AH \\perp BC');
      expect(ann.type).toBe('formula');
      expect(ann.content).toBe('AH \\perp BC');
      expect(ann.style?.color).toBe('#2563eb');
      expect(annotationStore.count).toBe(1);
    });

    it('adds an arrow annotation via helper', () => {
      const ann = annotationStore.addArrowAnnotation({ x: 0, y: 0 }, { x: 4, y: 4 }, 'Hướng dịch chuyển');
      expect(ann.type).toBe('arrow');
      expect(ann.position).toEqual({ x: 0, y: 0 });
      expect(ann.targetPosition).toEqual({ x: 4, y: 4 });
      expect(ann.content).toBe('Hướng dịch chuyển');
    });

    it('adds a step label via helper', () => {
      const ann = annotationStore.addStepLabel({ x: -2, y: 2 }, 1, 'Dựng đường tròn (O)');
      expect(ann.type).toBe('step_label');
      expect(ann.stepNumber).toBe(1);
      expect(ann.content).toBe('Dựng đường tròn (O)');
    });

    it('adds a highlight annotation via helper', () => {
      const ann = annotationStore.addHighlight({ x: 1, y: 1 }, 'p1', 'Tâm O');
      expect(ann.type).toBe('highlight');
      expect(ann.targetObjectId).toBe('p1');
      expect(ann.content).toBe('Tâm O');
      expect(ann.style?.highlightColor).toBe('#f59e0b');
    });

    it('updates an existing annotation', () => {
      const ann = annotationStore.addTextAnnotation({ x: 0, y: 0 }, 'Gốc tọa độ');
      const updated = annotationStore.updateAnnotation(ann.id, {
        content: 'Điểm O',
        position: { x: 1, y: 1 }
      });
      expect(updated).toBe(true);
      expect(annotationStore.annotations[0]?.content).toBe('Điểm O');
      expect(annotationStore.annotations[0]?.position).toEqual({ x: 1, y: 1 });
    });

    it('returns false when updating a non-existent annotation', () => {
      const updated = annotationStore.updateAnnotation('non_existent_id', { content: 'Test' });
      expect(updated).toBe(false);
    });

    it('deletes an annotation', () => {
      const ann = annotationStore.addTextAnnotation({ x: 0, y: 0 }, 'Xóa tôi đi');
      expect(annotationStore.count).toBe(1);

      const deleted = annotationStore.deleteAnnotation(ann.id);
      expect(deleted).toBe(true);
      expect(annotationStore.count).toBe(0);
    });

    it('clears all annotations', () => {
      annotationStore.addTextAnnotation({ x: 0, y: 0 }, 'Note 1');
      annotationStore.addFormulaAnnotation({ x: 1, y: 1 }, 'x + y = 1');
      expect(annotationStore.count).toBe(2);

      annotationStore.clearAnnotations();
      expect(annotationStore.count).toBe(0);
    });
  });

  describe('Visibility controls', () => {
    it('toggles global visibility of all annotations', () => {
      annotationStore.addTextAnnotation({ x: 0, y: 0 }, 'Note 1');
      expect(annotationStore.isVisible).toBe(true);
      expect(annotationStore.visibleAnnotations.length).toBe(1);

      annotationStore.toggleAllVisibility();
      expect(annotationStore.isVisible).toBe(false);
      expect(annotationStore.visibleAnnotations.length).toBe(0);

      annotationStore.toggleAllVisibility();
      expect(annotationStore.isVisible).toBe(true);
      expect(annotationStore.visibleAnnotations.length).toBe(1);
    });

    it('toggles per-annotation visibility', () => {
      const ann1 = annotationStore.addTextAnnotation({ x: 0, y: 0 }, 'Note 1');
      const ann2 = annotationStore.addTextAnnotation({ x: 1, y: 1 }, 'Note 2');
      expect(annotationStore.visibleAnnotations.length).toBe(2);

      annotationStore.toggleAnnotationVisibility(ann1.id);
      expect(annotationStore.visibleAnnotations.length).toBe(1);
      expect(annotationStore.visibleAnnotations[0]?.id).toBe(ann2.id);

      annotationStore.toggleAnnotationVisibility(ann1.id);
      expect(annotationStore.visibleAnnotations.length).toBe(2);
    });
  });

  describe('Selection & Modal', () => {
    it('manages annotation selection', () => {
      const ann = annotationStore.addTextAnnotation({ x: 0, y: 0 }, 'Note');
      expect(annotationStore.selectedId).toBeNull();
      expect(annotationStore.selectedAnnotation).toBeNull();

      annotationStore.selectAnnotation(ann.id);
      expect(annotationStore.selectedId).toBe(ann.id);
      expect(annotationStore.selectedAnnotation?.id).toBe(ann.id);

      annotationStore.selectAnnotation(null);
      expect(annotationStore.selectedId).toBeNull();
    });

    it('opens create modal with correct defaults', () => {
      annotationStore.openCreateModal('formula', { x: 3, y: 4 });
      expect(annotationStore.isModalOpen).toBe(true);
      expect(annotationStore.editingAnnotation).toBeDefined();
      expect(annotationStore.editingAnnotation?.type).toBe('formula');
      expect(annotationStore.editingAnnotation?.position).toEqual({ x: 3, y: 4 });

      annotationStore.closeModal();
      expect(annotationStore.isModalOpen).toBe(false);
      expect(annotationStore.editingAnnotation).toBeNull();
    });

    it('opens edit modal and saves changes', () => {
      const ann = annotationStore.addFormulaAnnotation({ x: 1, y: 2 }, 'E = mc^2');
      annotationStore.openEditModal(ann);

      expect(annotationStore.isModalOpen).toBe(true);
      expect(annotationStore.editingAnnotation?.content).toBe('E = mc^2');

      // Edit content
      if (annotationStore.editingAnnotation) {
        annotationStore.editingAnnotation.content = 'a^2 + b^2 = c^2';
      }
      const saved = annotationStore.saveEditingAnnotation();
      expect(saved).toBe(true);
      expect(annotationStore.isModalOpen).toBe(false);
      expect(annotationStore.annotations[0]?.content).toBe('a^2 + b^2 = c^2');
    });

    it('rejects saving text annotation if content is empty', () => {
      annotationStore.openCreateModal('text');
      if (annotationStore.editingAnnotation) {
        annotationStore.editingAnnotation.content = '   ';
      }
      const saved = annotationStore.saveEditingAnnotation();
      expect(saved).toBe(false);
      expect(annotationStore.count).toBe(0);
    });

    it('allows saving arrow annotation with empty content', () => {
      annotationStore.openCreateModal('arrow', { x: 0, y: 0 });
      if (annotationStore.editingAnnotation) {
        annotationStore.editingAnnotation.content = '';
      }
      const saved = annotationStore.saveEditingAnnotation();
      expect(saved).toBe(true);
      expect(annotationStore.count).toBe(1);
      expect(annotationStore.annotations[0]?.type).toBe('arrow');
    });
  });

  describe('Document Synchronization', () => {
    it('syncs annotations to geometry store currentDocument', () => {
      geometryStore.loadDocument({
        version: '1.0.0',
        schemaVersion: 1,
        metadata: {
          id: 'doc-sync-1',
          title: 'Hình học',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        settings: {
          theme: 'light',
          gridVisible: true,
          axisVisible: true,
          snapEnabled: true,
          dimension: 2
        },
        viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
        objects: [],
        annotations: []
      } as GeoDocument);

      annotationStore.addTextAnnotation({ x: 0, y: 0 }, 'Note trên tài liệu');
      expect(geometryStore.currentDocument?.annotations?.length).toBe(1);
      expect(geometryStore.currentDocument?.annotations?.[0]?.content).toBe('Note trên tài liệu');
    });

    it('loads annotations from document', () => {
      const doc: GeoDocument = {
        version: '1.0.0',
        schemaVersion: 1,
        metadata: {
          id: 'doc-sync-2',
          title: 'Hình học 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        settings: {
          theme: 'light',
          gridVisible: true,
          axisVisible: true,
          snapEnabled: true,
          dimension: 2
        },
        viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
        objects: [],
        annotations: [
          {
            id: 'ann_loaded_1',
            type: 'step_label',
            position: { x: 2, y: 2 },
            content: 'Bước 1: Vẽ đoạn thẳng AB',
            stepNumber: 1,
            visible: true
          }
        ]
      };

      annotationStore.loadFromDocument(doc);
      expect(annotationStore.count).toBe(1);
      expect(annotationStore.annotations[0]?.id).toBe('ann_loaded_1');
      expect(annotationStore.annotations[0]?.content).toBe('Bước 1: Vẽ đoạn thẳng AB');
    });
  });
});
