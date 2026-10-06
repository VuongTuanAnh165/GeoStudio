import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  distance,
  distancePointToLine,
  angle,
  area,
  perimeter,
  arcLength,
  sectorArea,
} from '../../../../../core/geometry/measurements';
import { Line, Arc, Polygon } from '../../../../../core/geometry/primitives/2d';

describe('Measurement Module', () => {
  describe('distance', () => {
    it('should calculate distance correctly', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('should return 0 for identical points', () => {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });

    it('property-based: distance >= 0', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }),
          (x1, y1, x2, y2) => distance({ x: x1, y: y1 }, { x: x2, y: y2 }) >= 0
        )
      );
    });
  });

  describe('distancePointToLine', () => {
    it('should calculate distance correctly', () => {
      const l = Line.fromTwoPoints({ x: 0, y: 0 }, { x: 10, y: 0 });
      expect(distancePointToLine({ x: 5, y: 5 }, l)).toBeCloseTo(5);
    });

    it('should return 0 if point is on the line', () => {
      const l = Line.fromTwoPoints({ x: 0, y: 0 }, { x: 10, y: 10 });
      expect(distancePointToLine({ x: 5, y: 5 }, l)).toBeCloseTo(0);
    });

    it('property-based: distance >= 0', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }), fc.double({ min: -1000, max: 1000, noNaN: true }),
          (px, py, lx1, ly1, lx2, ly2) => {
            if (lx1 === lx2 && ly1 === ly2) return true;
            const l = Line.fromTwoPoints({ x: lx1, y: ly1 }, { x: lx2, y: ly2 });
            return distancePointToLine({ x: px, y: py }, l) >= 0;
          }
        )
      );
    });
  });

  describe('angle', () => {
    it('should calculate 90 degrees', () => {
      expect(angle({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
    });

    it('property-based: 0 <= angle <= PI', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100, max: 100, noNaN: true }), fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }), fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }), fc.double({ min: -100, max: 100, noNaN: true }),
          (ax, ay, bx, by, cx, cy) => {
            if (ax === bx && ay === by) return true;
            if (cx === bx && cy === by) return true;
            const a = angle({ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy });
            return a >= 0 && a <= Math.PI + 1e-6;
          }
        )
      );
    });
  });

  describe('Polygon area & perimeter', () => {
    it('should compute area and perimeter of a square', () => {
      const p = new Polygon([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 }
      ]);
      expect(area(p)).toBe(4);
      expect(perimeter(p)).toBe(8);
    });

    it('property-based: non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ x: fc.double({ min: -100, max: 100, noNaN: true }), y: fc.double({ min: -100, max: 100, noNaN: true }) })),
          (pts) => {
            const p = new Polygon(pts);
            return area(p) >= 0 && perimeter(p) >= 0;
          }
        )
      );
    });
  });

  describe('Arc length and sector area', () => {
    it('should compute for semi-circle', () => {
      const a = new Arc({ x: 0, y: 0 }, 10, 0, Math.PI);
      expect(arcLength(a)).toBeCloseTo(10 * Math.PI);
      expect(sectorArea(a)).toBeCloseTo(0.5 * 100 * Math.PI);
    });

    it('should handle wrapping angle', () => {
      // From PI to -PI/2 (or 3PI/2) -> span is PI/2 if wrapped properly?
      // Wait, end - start = -PI/2 - PI = -1.5PI.
      // -1.5PI % 2PI = -1.5PI. + 2PI = 0.5PI. span = 0.5PI (90 deg).
      const a = new Arc({ x: 0, y: 0 }, 10, Math.PI, -Math.PI / 2);
      expect(arcLength(a)).toBeCloseTo(10 * Math.PI / 2);
    });
  });
});
