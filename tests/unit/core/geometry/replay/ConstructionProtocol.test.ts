import { describe, it, expect } from 'vitest';
import { ConstructionProtocol } from '../../../../../core/geometry/replay/ConstructionProtocol';
import type { GeometryObject } from '../../../../../core/types/geometry';

describe('ConstructionProtocol', () => {
  const pA: GeometryObject = {
    id: 'p_A',
    type: 'point',
    dimension: 2,
    definition: { kind: 'point', coords: { x: 1, y: 2 } },
    metadata: { label: 'A' }
  };

  const pB: GeometryObject = {
    id: 'p_B',
    type: 'point',
    dimension: 2,
    definition: { kind: 'point', coords: { x: 5, y: 6 } },
    metadata: { label: 'B' }
  };

  const segAB: GeometryObject = {
    id: 'seg_AB',
    type: 'segment',
    dimension: 2,
    parents: ['p_A', 'p_B'],
    definition: { kind: 'segment', point1: 'p_A', point2: 'p_B' },
    metadata: { label: 'AB' }
  };

  const circA: GeometryObject = {
    id: 'c_A',
    type: 'circle',
    dimension: 2,
    parents: ['p_A'],
    definition: { kind: 'circle', center: { x: 1, y: 2 }, radius: 4 },
    metadata: { label: 'c', annotation: 'Vẽ đường tròn tâm A bán kính 4' }
  };

  const midM: GeometryObject = {
    id: 'pt_M',
    type: 'point',
    dimension: 2,
    parents: ['p_A', 'p_B'],
    definition: { kind: 'midpoint', p1: 'p_A', p2: 'p_B' },
    metadata: { label: 'M', constructionKind: 'midpoint' }
  };

  const objects: GeometryObject[] = [pA, pB, segAB, circA, midM];

  describe('generateSteps', () => {
    it('should generate steps in sequential 1-based order', () => {
      const steps = ConstructionProtocol.generateSteps(objects, 'vi');
      expect(steps.length).toBe(5);
      expect(steps[0].index).toBe(1);
      expect(steps[0].id).toBe('p_A');
      expect(steps[1].index).toBe(2);
      expect(steps[2].index).toBe(3);
      expect(steps[3].index).toBe(4);
      expect(steps[4].index).toBe(5);
    });

    it('should generate descriptive text in Vietnamese', () => {
      const steps = ConstructionProtocol.generateSteps(objects, 'vi');
      expect(steps[0].description).toContain('Tạo điểm A');
      expect(steps[0].description).toContain('(1.0, 2.0)');
      expect(steps[2].description).toContain('Vẽ đoạn thẳng AB');
      expect(steps[3].description).toContain('Vẽ đường tròn c');
      expect(steps[4].description).toContain('Dựng trung điểm M');
    });

    it('should generate descriptive text in English', () => {
      const steps = ConstructionProtocol.generateSteps(objects, 'en');
      expect(steps[0].description).toContain('Create point A');
      expect(steps[2].description).toContain('Draw segment AB');
      expect(steps[3].description).toContain('Draw circle c');
      expect(steps[4].description).toContain('Construct midpoint M');
    });

    it('should extract annotations from metadata', () => {
      const steps = ConstructionProtocol.generateSteps(objects, 'vi');
      expect(steps[3].annotation).toBe('Vẽ đường tròn tâm A bán kính 4');
      expect(steps[0].annotation).toBeUndefined();
    });
  });

  describe('Visibility Computation', () => {
    const steps = ConstructionProtocol.generateSteps(objects, 'vi');

    it('should return empty set when stepIndex <= 0', () => {
      const visible = ConstructionProtocol.getVisibleObjectIds(steps, 0);
      expect(visible.size).toBe(0);
    });

    it('should return only prior objects for intermediate step', () => {
      const visible = ConstructionProtocol.getVisibleObjectIds(steps, 2);
      expect(visible.size).toBe(2);
      expect(visible.has('p_A')).toBe(true);
      expect(visible.has('p_B')).toBe(true);
      expect(visible.has('seg_AB')).toBe(false);
      expect(visible.has('c_A')).toBe(false);
    });

    it('should return all objects when at last step', () => {
      const visible = ConstructionProtocol.getVisibleObjectIds(steps, 5);
      expect(visible.size).toBe(5);
      expect(visible.has('p_A')).toBe(true);
      expect(visible.has('seg_AB')).toBe(true);
      expect(visible.has('pt_M')).toBe(true);
    });

    it('should clamp stepIndex beyond total steps safely', () => {
      const visible = ConstructionProtocol.getVisibleObjectIds(steps, 999);
      expect(visible.size).toBe(5);
    });
  });

  describe('Active Object Computation', () => {
    const steps = ConstructionProtocol.generateSteps(objects, 'vi');

    it('should return active object for step 3', () => {
      const active = ConstructionProtocol.getActiveObjectIds(steps, 3);
      expect(active).toEqual(['seg_AB']);
    });

    it('should return empty array for out of bounds step', () => {
      expect(ConstructionProtocol.getActiveObjectIds(steps, 0)).toEqual([]);
      expect(ConstructionProtocol.getActiveObjectIds(steps, 10)).toEqual([]);
    });
  });
});
