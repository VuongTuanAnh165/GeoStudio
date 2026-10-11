import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useExport } from '../../../../app/composables/useExport';
import { useGeometryStore } from '../../../../app/stores/geometry';
import { useLessonStore } from '../../../../app/stores/lesson';
import { useAnnotationStore } from '../../../../app/stores/annotation';
import { useCoordinateStore } from '../../../../app/stores/coordinate';
import { GeoPackageService } from '../../../../core/export/GeoPackageService';

describe('useExport', () => {
  let geometryStore: ReturnType<typeof useGeometryStore>;
  let lessonStore: ReturnType<typeof useLessonStore>;
  let annotationStore: ReturnType<typeof useAnnotationStore>;
  let coordinateStore: ReturnType<typeof useCoordinateStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    geometryStore = useGeometryStore();
    lessonStore = useLessonStore();
    annotationStore = useAnnotationStore();
    coordinateStore = useCoordinateStore();
  });

  it('generates a valid share URL with current state', () => {
    const { generateShareUrl, getCurrentShareState } = useExport();

    const state = getCurrentShareState();
    expect(state.format).toBe('geostudio');
    expect(state.type).toBe('geometry');

    const url = generateShareUrl('https://geostudio.edu.vn/workspace');
    expect(url.startsWith('https://geostudio.edu.vn/workspace?share=')).toBe(true);
  });

  it('loads state from a share token correctly', () => {
    const { generateShareUrl, loadShareState } = useExport();

    // Add dummy annotation
    annotationStore.addAnnotation({
      type: 'text',
      content: 'Ghi chú bài học',
      position: { x: 1, y: 1 },
      visible: true
    });

    const shareUrl = generateShareUrl('https://geostudio.edu.vn/workspace');

    // Reset store annotations
    annotationStore.annotations = [];
    expect(annotationStore.annotations.length).toBe(0);

    // Load from URL
    const success = loadShareState(shareUrl);
    expect(success).toBe(true);
    expect(annotationStore.annotations.length).toBe(1);
    expect(annotationStore.annotations[0]?.content).toBe('Ghi chú bài học');
  });

  it('imports a .geo file in replace mode', async () => {
    const { importGeoFile } = useExport();

    const samplePkg = GeoPackageService.createGeoPackage({
      document: geometryStore.currentDocument,
      metadata: { title: 'Gói nhập từ file', grade: 10 }
    });

    const fileContent = JSON.stringify(samplePkg);
    const mockFile = new File([fileContent], 'test_lesson.geo', { type: 'application/json' });

    const result = await importGeoFile(mockFile, 'replace');
    expect(result.success).toBe(true);
    expect(result.data?.metadata.title).toBe('Gói nhập từ file');
    expect(result.data?.metadata.grade).toBe(10);
  });

  it('handles invalid file gracefully during import', async () => {
    const { importGeoFile } = useExport();

    const corruptFile = new File(['not valid json'], 'bad.geo', { type: 'application/json' });
    const result = await importGeoFile(corruptFile, 'replace');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
