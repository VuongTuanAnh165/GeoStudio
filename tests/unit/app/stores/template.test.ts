import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGeometryStore } from '../../../../app/stores/geometry';
import { useTemplateStore } from '../../../../app/stores/template';
import { ALL_PREBUILT_TEMPLATES } from '../../../../content/templates';
import type { GeometryObject } from '../../../../core/types/geometry';

describe('useTemplateStore', () => {
  let geometryStore: ReturnType<typeof useGeometryStore>;
  let templateStore: ReturnType<typeof useTemplateStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    geometryStore = useGeometryStore();
    templateStore = useTemplateStore();

    // Populate a test object in geometry store
    const testPoint: GeometryObject = {
      id: 'test_pt_1',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: { x: 1, y: 2 } },
      metadata: { label: 'P1' }
    };
    geometryStore.loadDocument({
      version: '1.0.0',
      schemaVersion: 1,
      metadata: { id: 'test-doc', title: 'Test Document', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      settings: { theme: 'light', gridVisible: true, axisVisible: true, snapEnabled: true, dimension: 2 },
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [testPoint]
    });
  });

  describe('Template Listing & Filtering', () => {
    it('initializes with all prebuilt templates', () => {
      expect(templateStore.allTemplates.length).toBe(ALL_PREBUILT_TEMPLATES.length);
      expect(templateStore.categoryCounts.all).toBe(ALL_PREBUILT_TEMPLATES.length);
    });

    it('filters templates by category', () => {
      templateStore.selectedCategory = 'basic_shapes';
      expect(templateStore.filteredTemplates.length).toBeGreaterThan(0);
      for (const tpl of templateStore.filteredTemplates) {
        expect(tpl.category).toBe('basic_shapes');
      }

      templateStore.selectedCategory = '3d_solids';
      expect(templateStore.filteredTemplates.length).toBeGreaterThan(0);
      for (const tpl of templateStore.filteredTemplates) {
        expect(tpl.category).toBe('3d_solids');
      }
    });

    it('searches templates by query case- and accent-insensitively', () => {
      templateStore.searchQuery = 'tam giác';
      expect(templateStore.filteredTemplates.length).toBeGreaterThan(0);
      for (const tpl of templateStore.filteredTemplates) {
        const text = `${tpl.title} ${tpl.description} ${tpl.tags.join(' ')}`.toLowerCase();
        expect(text).toContain('tam');
      }

      // Search without accents
      templateStore.searchQuery = 'truc tam';
      const results = templateStore.filteredTemplates;
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title.includes('Trực tâm'))).toBe(true);
    });
  });

  describe('Applying Templates', () => {
    it('applies a 2D template in replace mode', () => {
      const acuteTpl = ALL_PREBUILT_TEMPLATES.find(t => t.id === 'tpl-acute-triangle')!;
      expect(acuteTpl).toBeDefined();

      templateStore.applyTemplate(acuteTpl, 'replace');
      expect(geometryStore.objects.has('A')).toBe(true);
      expect(geometryStore.objects.has('B')).toBe(true);
      expect(geometryStore.objects.has('C')).toBe(true);
      expect(geometryStore.is3DMode).toBe(false);
      expect(templateStore.isBrowserOpen).toBe(false);
    });

    it('applies a 3D template and switches view mode to 3d', () => {
      const cubeTpl = ALL_PREBUILT_TEMPLATES.find(t => t.id === 'tpl-cube-3d')!;
      expect(cubeTpl).toBeDefined();

      templateStore.applyTemplate(cubeTpl, 'replace');
      expect(geometryStore.is3DMode).toBe(true);
      expect(geometryStore.objects.has('A')).toBe(true);
      expect(geometryStore.objects.has('A_prime')).toBe(true);
    });

    it('applies a template in insert mode preserving existing objects', () => {
      expect(geometryStore.objects.has('test_pt_1')).toBe(true);

      const rightTriangleTpl = ALL_PREBUILT_TEMPLATES.find(t => t.id === 'tpl-right-triangle')!;
      templateStore.applyTemplate(rightTriangleTpl, 'insert');

      // Original object still exists
      expect(geometryStore.objects.has('test_pt_1')).toBe(true);
      // New objects inserted with prefix
      const objectKeys = Array.from(geometryStore.objects.keys());
      expect(objectKeys.some(k => k.includes('A'))).toBe(true);
      expect(objectKeys.some(k => k.includes('B'))).toBe(true);
    });
  });

  describe('User-created Templates', () => {
    it('fails to save template when canvas is empty', async () => {
      geometryStore.objects.clear();
      const success = await templateStore.saveCurrentAsTemplate({
        title: 'Mẫu rỗng'
      });
      expect(success).toBe(false);
      expect(templateStore.errorMessage).toBeTruthy();
    });

    it('fails to save template when title is empty', async () => {
      const success = await templateStore.saveCurrentAsTemplate({
        title: '   '
      });
      expect(success).toBe(false);
      expect(templateStore.errorMessage).toBeTruthy();
    });

    it('successfully saves and deletes user template', async () => {
      const initialCount = templateStore.userTemplates.length;
      const success = await templateStore.saveCurrentAsTemplate({
        title: 'Mẫu tam giác tùy chỉnh',
        description: 'Mô tả mẫu tùy chỉnh',
        category: 'user',
        grade: 8,
        tags: ['tự tạo']
      });

      expect(success).toBe(true);
      expect(templateStore.userTemplates.length).toBe(initialCount + 1);

      const created = templateStore.userTemplates[0];
      expect(created?.title).toBe('Mẫu tam giác tùy chỉnh');
      expect(created?.isUserCreated).toBe(true);

      // Delete user template
      if (created) {
        await templateStore.deleteUserTemplate(created.id);
        expect(templateStore.userTemplates.some(t => t.id === created.id)).toBe(false);
      }
    });
  });
});
