import { describe, it, expect } from 'vitest';
import { EquationFormatter } from '../../../../../core/geometry/coordinate/EquationFormatter';
import type { GeometryObject } from '../../../../../core/types/geometry';

describe('EquationFormatter', () => {
  describe('Line formatting', () => {
    it('formats a line passing through (0, 2) and (2, 6)', () => {
      // Slope m = (6-2)/(2-0) = 2, y = 2x + 2 => 2x - y + 2 = 0
      const lineInfo = EquationFormatter.calculateLineFromPoints({ x: 0, y: 2 }, { x: 2, y: 6 });
      expect(lineInfo.type).toBe('line');
      expect(lineInfo.slope).toBe(2);
      expect(lineInfo.intercept).toBe(2);
      expect(lineInfo.slopeInterceptForm).toBe('y = 2x + 2');
    });

    it('formats a vertical line x = 3', () => {
      const lineInfo = EquationFormatter.calculateLineFromPoints({ x: 3, y: 0 }, { x: 3, y: 5 });
      expect(lineInfo.slope).toBeUndefined();
      expect(lineInfo.slopeInterceptForm).toBe('x = 3');
      expect(lineInfo.b).toBe(0);
    });

    it('formats a horizontal line y = -4', () => {
      const lineInfo = EquationFormatter.calculateLineFromPoints({ x: -2, y: -4 }, { x: 5, y: -4 });
      expect(lineInfo.slope).toBe(0);
      expect(lineInfo.intercept).toBe(-4);
      expect(lineInfo.slopeInterceptForm).toBe('y = -4');
    });

    it('formats line from a Segment GeometryObject', () => {
      const segmentObj: GeometryObject = {
        id: 'seg_1',
        type: 'segment',
        dimension: 2,
        definition: {
          kind: 'segment',
          p1: { x: 1, y: 1 },
          p2: { x: 4, y: 4 }
        }
      };

      const formatted = EquationFormatter.format(segmentObj);
      expect(formatted).not.toBeNull();
      if (formatted && formatted.type === 'line') {
        expect(formatted.slope).toBe(1);
        expect(formatted.intercept).toBe(0);
        expect(formatted.slopeInterceptForm).toBe('y = x');
      }
    });
  });

  describe('Circle formatting', () => {
    it('formats circle with center (2, -3) and radius 5', () => {
      const circleInfo = EquationFormatter.calculateCircle({ x: 2, y: -3 }, 5);
      expect(circleInfo.type).toBe('circle');
      expect(circleInfo.standardForm).toBe('(x - 2)^2 + (y + 3)^2 = 25');
      expect(circleInfo.generalForm).toBe('x^2 + y^2 - 4x + 6y - 12 = 0');
      expect(circleInfo.radius).toBe(5);
    });

    it('formats circle at origin (0, 0) with radius 4', () => {
      const circleInfo = EquationFormatter.calculateCircle({ x: 0, y: 0 }, 4);
      expect(circleInfo.standardForm).toBe('x^2 + y^2 = 16');
      expect(circleInfo.generalForm).toBe('x^2 + y^2 - 16 = 0');
    });

    it('formats circle from a Circle GeometryObject', () => {
      const circleObj: GeometryObject = {
        id: 'c_1',
        type: 'circle',
        dimension: 2,
        definition: {
          kind: 'circle',
          center: { x: -1, y: 2 },
          radius: 3
        }
      };

      const formatted = EquationFormatter.format(circleObj);
      expect(formatted).not.toBeNull();
      if (formatted && formatted.type === 'circle') {
        expect(formatted.standardForm).toBe('(x + 1)^2 + (y - 2)^2 = 9');
      }
    });
  });

  describe('Function formatting', () => {
    it('formats function graph object', () => {
      const fnObj: GeometryObject = {
        id: 'fn_1',
        type: 'function_graph',
        dimension: 2,
        definition: {
          kind: 'function_graph',
          expression: 'x^2 - 4'
        }
      };

      const formatted = EquationFormatter.format(fnObj);
      expect(formatted).not.toBeNull();
      if (formatted && formatted.type === 'function') {
        expect(formatted.formula).toBe('y = x^2 - 4');
      }
    });
  });
});
