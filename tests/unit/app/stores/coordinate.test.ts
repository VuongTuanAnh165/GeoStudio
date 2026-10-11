import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCoordinateStore } from '../../../../app/stores/coordinate';
import { useGeometryStore } from '../../../../app/stores/geometry';
import type { GeometryObject } from '../../../../core/types/geometry';

describe('useCoordinateStore', () => {
  let coordinateStore: ReturnType<typeof useCoordinateStore>;
  let geometryStore: ReturnType<typeof useGeometryStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    geometryStore = useGeometryStore();
    coordinateStore = useCoordinateStore();
  });

  describe('Grid and Axis settings', () => {
    it('initializes with default grid and axis configuration', () => {
      expect(coordinateStore.gridConfig.visible).toBe(true);
      expect(coordinateStore.gridConfig.size).toBe(1);
      expect(coordinateStore.gridConfig.style).toBe('lines');
      expect(coordinateStore.axisConfig.visible).toBe(true);
      expect(coordinateStore.axisConfig.showLabels).toBe(true);
    });

    it('toggles grid visibility and synchronizes with geometry store', () => {
      coordinateStore.toggleGrid();
      expect(coordinateStore.gridConfig.visible).toBe(false);
      expect(geometryStore.settings.gridVisible).toBe(false);

      coordinateStore.toggleGrid();
      expect(coordinateStore.gridConfig.visible).toBe(true);
      expect(geometryStore.settings.gridVisible).toBe(true);
    });

    it('toggles axis visibility and synchronizes with geometry store', () => {
      coordinateStore.toggleAxis();
      expect(coordinateStore.axisConfig.visible).toBe(false);
      expect(geometryStore.settings.axisVisible).toBe(false);

      coordinateStore.toggleAxis();
      expect(coordinateStore.axisConfig.visible).toBe(true);
      expect(geometryStore.settings.axisVisible).toBe(true);
    });

    it('customizes grid step and style', () => {
      coordinateStore.setGridSize(0.5);
      expect(coordinateStore.gridConfig.size).toBe(0.5);

      coordinateStore.setGridStyle('dots');
      expect(coordinateStore.gridConfig.style).toBe('dots');

      coordinateStore.setAxisLabels(false);
      expect(coordinateStore.axisConfig.showLabels).toBe(false);
    });
  });

  describe('Panel and Tab Navigation', () => {
    it('opens and closes panel with tabs', () => {
      expect(coordinateStore.isPanelOpen).toBe(false);

      coordinateStore.openPanel('grid');
      expect(coordinateStore.isPanelOpen).toBe(true);
      expect(coordinateStore.activeTab).toBe('grid');

      coordinateStore.togglePanel('input');
      expect(coordinateStore.activeTab).toBe('input');
      expect(coordinateStore.isPanelOpen).toBe(true);

      coordinateStore.closePanel();
      expect(coordinateStore.isPanelOpen).toBe(false);
    });
  });

  describe('Equation Input -> Geometry Construction', () => {
    it('creates a line primitive from linear equation', () => {
      coordinateStore.inputEquation = 'y = 2x - 3';
      const success = coordinateStore.plotFromEquation();

      expect(success).toBe(true);
      expect(coordinateStore.successMessage).toBeTruthy();
      expect(coordinateStore.inputError).toBeNull();

      const createdObj = Array.from(geometryStore.objects.values()).find(o => o.type === 'line');
      expect(createdObj).toBeDefined();
    });

    it('creates a circle primitive from circle equation', () => {
      coordinateStore.inputEquation = '(x - 2)^2 + (y + 1)^2 = 16';
      const success = coordinateStore.plotFromEquation();

      expect(success).toBe(true);
      expect(coordinateStore.successMessage).toBeTruthy();

      const createdObj = Array.from(geometryStore.objects.values()).find(o => o.type === 'circle');
      expect(createdObj).toBeDefined();
      if (createdObj) {
        expect(createdObj.definition.center).toEqual({ x: 2, y: -1 });
        expect(createdObj.definition.radius).toBe(4);
      }
    });

    it('creates a function graph from non-linear equation', () => {
      coordinateStore.inputEquation = 'y = x^2 - 4';
      const success = coordinateStore.plotFromEquation();

      expect(success).toBe(true);
      expect(coordinateStore.successMessage).toBeTruthy();

      const createdObj = Array.from(geometryStore.objects.values()).find(o => o.type === 'function_graph');
      expect(createdObj).toBeDefined();
      if (createdObj) {
        expect(createdObj.definition.expression).toBe('x^2 - 4');
      }
    });

    it('handles invalid equation input gracefully with error message', () => {
      coordinateStore.inputEquation = 'invalid string += syntax';
      const success = coordinateStore.plotFromEquation();

      expect(success).toBe(false);
      expect(coordinateStore.inputError).toBeTruthy();
      expect(coordinateStore.successMessage).toBeNull();
    });
  });

  describe('Geometry -> Equation Display (Active selection)', () => {
    it('computes live equation for selected line or segment object', () => {
      const seg: GeometryObject = {
        id: 's_test',
        type: 'segment',
        dimension: 2,
        definition: {
          kind: 'segment',
          p1: { x: 0, y: 0 },
          p2: { x: 3, y: 3 }
        }
      };

      geometryStore.objects.set('s_test', seg);
      geometryStore.selectObject('s_test');

      const eq = coordinateStore.selectedEquation;
      expect(eq).not.toBeNull();
      if (eq && eq.type === 'line') {
        expect(eq.slope).toBe(1);
        expect(eq.slopeInterceptForm).toBe('y = x');
      }
    });

    it('computes live equation for selected circle object', () => {
      const circ: GeometryObject = {
        id: 'c_test',
        type: 'circle',
        dimension: 2,
        definition: {
          kind: 'circle',
          center: { x: 1, y: -2 },
          radius: 5
        }
      };

      geometryStore.objects.set('c_test', circ);
      geometryStore.selectObject('c_test');

      const eq = coordinateStore.selectedEquation;
      expect(eq).not.toBeNull();
      if (eq && eq.type === 'circle') {
        expect(eq.standardForm).toBe('(x - 1)^2 + (y + 2)^2 = 25');
      }
    });

    it('returns null when no object is selected', () => {
      geometryStore.selectObject(null);
      expect(coordinateStore.selectedEquation).toBeNull();
    });
  });
});
