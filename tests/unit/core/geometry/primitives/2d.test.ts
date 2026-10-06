import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  Point,
  Segment,
  Line,
  Ray,
  Circle,
  Arc,
  Angle,
  Vector,
  Polygon
} from '../../../../../core/geometry/primitives/2d';

describe('2D Primitives', () => {
  describe('Point', () => {
    it('should create a point correctly', () => {
      const p = new Point(1, 2);
      expect(p.x).toBe(1);
      expect(p.y).toBe(2);
      expect(p.type).toBe('point');
    });

    it('should generate correct definition', () => {
      const p = new Point(1, 2);
      expect(p.definition).toEqual({ kind: 'point', coords: { x: 1, y: 2 } });
    });

    it('should generate string correctly', () => {
      const p = new Point(1.5, 2.2);
      expect(p.toString()).toBe('Point(1.50, 2.20)');
    });

    it('should generate toJSON correctly', () => {
      const p = new Point(1, 2, 'p1');
      const json = p.toJSON();
      expect(json.id).toBe('p1');
      expect(json.type).toBe('point');
      expect(json.definition.kind).toBe('point');
    });

    it('should be valid in property-based test', () => {
      fc.assert(
        fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), (x, y) => {
          const p = new Point(x, y);
          return p.x === x && p.y === y && p.type === 'point';
        })
      );
    });
  });

  describe('Segment', () => {
    it('should compute length correctly for horizontal segment', () => {
      const s = new Segment({ x: 0, y: 0 }, { x: 5, y: 0 });
      expect(s.length).toBe(5);
    });

    it('should compute length correctly for diagonal segment', () => {
      const s = new Segment({ x: 0, y: 0 }, { x: 3, y: 4 });
      expect(s.length).toBe(5);
    });

    it('should return 0 length for zero segment', () => {
      const s = new Segment({ x: 1, y: 1 }, { x: 1, y: 1 });
      expect(s.length).toBe(0);
    });

    it('should generate definition correctly', () => {
      const s = new Segment({ x: 1, y: 2 }, { x: 3, y: 4 });
      expect(s.definition).toEqual({ kind: 'segment', p1: { x: 1, y: 2 }, p2: { x: 3, y: 4 } });
    });

    it('should satisfy property-based length >= 0', () => {
      fc.assert(
        fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), (x1, y1, x2, y2) => {
          const s = new Segment({ x: x1, y: y1 }, { x: x2, y: y2 });
          return s.length >= 0;
        })
      );
    });
  });

  describe('Line', () => {
    it('should construct correctly from point and direction', () => {
      const l = new Line({ x: 0, y: 0 }, { x: 3, y: 4 });
      expect(l.direction.x).toBeCloseTo(0.6);
      expect(l.direction.y).toBeCloseTo(0.8);
    });

    it('should fallback to (1, 0) if direction is zero', () => {
      const l = new Line({ x: 0, y: 0 }, { x: 0, y: 0 });
      expect(l.direction).toEqual({ x: 1, y: 0 });
    });

    it('should construct correctly from two points', () => {
      const l = Line.fromTwoPoints({ x: 1, y: 1 }, { x: 4, y: 5 });
      expect(l.direction.x).toBeCloseTo(0.6);
      expect(l.direction.y).toBeCloseTo(0.8);
    });

    it('should generate string correctly', () => {
      const l = new Line({ x: 0, y: 0 }, { x: 1, y: 0 });
      expect(l.toString()).toBe('Line(pt: (0.00, 0.00), dir: (1.00, 0.00))');
    });

    it('should satisfy property-based normalization', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          (dx, dy) => {
            if (dx === 0 && dy === 0) return true;
            const l = new Line({ x: 0, y: 0 }, { x: dx, y: dy });
            const len = Math.sqrt(l.direction.x ** 2 + l.direction.y ** 2);
            return Math.abs(len - 1) < 1e-6;
          }
        )
      );
    });
  });

  describe('Ray', () => {
    it('should normalize direction like Line', () => {
      const r = new Ray({ x: 0, y: 0 }, { x: 3, y: 4 });
      expect(r.direction.x).toBeCloseTo(0.6);
      expect(r.direction.y).toBeCloseTo(0.8);
    });

    it('should fallback to (1, 0) if direction is zero', () => {
      const r = new Ray({ x: 0, y: 0 }, { x: 0, y: 0 });
      expect(r.direction).toEqual({ x: 1, y: 0 });
    });

    it('should construct from two points correctly', () => {
      const r = Ray.fromTwoPoints({ x: 1, y: 1 }, { x: 1, y: 6 });
      expect(r.direction.x).toBeCloseTo(0);
      expect(r.direction.y).toBeCloseTo(1);
    });

    it('should output definition correctly', () => {
      const r = new Ray({ x: 1, y: 1 }, { x: 1, y: 0 });
      expect(r.definition.kind).toBe('ray');
      expect(r.definition.origin).toEqual({ x: 1, y: 1 });
    });

    it('should satisfy property-based direction properties', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }),
          (dx, dy) => {
            if (dx === 0 && dy === 0) return true;
            const r = new Ray({ x: 0, y: 0 }, { x: dx, y: dy });
            const len = Math.sqrt(r.direction.x ** 2 + r.direction.y ** 2);
            return Math.abs(len - 1) < 1e-6;
          }
        )
      );
    });
  });

  describe('Circle', () => {
    it('should initialize center and radius', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      expect(c.center).toEqual({ x: 0, y: 0 });
      expect(c.radius).toBe(5);
    });

    it('should output correct string format', () => {
      const c = new Circle({ x: 1, y: 1 }, 2.5);
      expect(c.toString()).toBe('Circle(center: (1.00, 1.00), r: 2.50)');
    });

    it('should output correct toJSON', () => {
      const c = new Circle({ x: 0, y: 0 }, 5, 'c1');
      const json = c.toJSON();
      expect(json.id).toBe('c1');
      expect(json.type).toBe('circle');
    });

    it('should have correct definition', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      expect(c.definition).toEqual({ kind: 'circle', center: { x: 0, y: 0 }, radius: 5 });
    });

    it('should satisfy property-based values', () => {
      fc.assert(
        fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), (cx, cy, r) => {
          const c = new Circle({ x: cx, y: cy }, r);
          return c.radius === r && c.center.x === cx;
        })
      );
    });
  });

  describe('Arc', () => {
    it('should initialize correctly', () => {
      const a = new Arc({ x: 0, y: 0 }, 5, 0, Math.PI);
      expect(a.startAngle).toBe(0);
      expect(a.endAngle).toBe(Math.PI);
    });

    it('should output definition correctly', () => {
      const a = new Arc({ x: 0, y: 0 }, 5, 0, Math.PI);
      expect(a.definition.kind).toBe('arc');
      expect(a.definition.startAngle).toBe(0);
    });

    it('should output string correctly', () => {
      const a = new Arc({ x: 0, y: 0 }, 5, 0, 3.14);
      expect(a.toString()).toBe('Arc(center: (0.00, 0.00), r: 5.00, span: 0.00-3.14)');
    });

    it('should output valid JSON', () => {
      const a = new Arc({ x: 0, y: 0 }, 5, 0, 1, 'arc1');
      expect(a.toJSON().type).toBe('arc');
    });

    it('should maintain property values', () => {
      fc.assert(
        fc.property(
          fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }),
          (cx, cy, r, sa, ea) => {
            const a = new Arc({ x: cx, y: cy }, r, sa, ea);
            return a.radius === r && a.startAngle === sa;
          }
        )
      );
    });
  });

  describe('Angle', () => {
    it('should calculate 90 degrees correctly', () => {
      const a = new Angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 });
      expect(a.measure).toBeCloseTo(Math.PI / 2);
    });

    it('should calculate 180 degrees correctly', () => {
      const a = new Angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 });
      expect(a.measure).toBeCloseTo(Math.PI);
    });

    it('should handle zero distance properly', () => {
      const a = new Angle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 });
      expect(a.measure).toBe(0); // Custom handling for degenerate
    });

    it('should format string to degrees correctly', () => {
      const a = new Angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 });
      expect(a.toString()).toBe('Angle(measure: 90.00°)');
    });

    it('should bound measure between 0 and PI in property test', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }),
          (x1, y1, x2, y2) => {
            if (x1 === 0 && y1 === 0) return true;
            if (x2 === 0 && y2 === 0) return true;
            const a = new Angle({ x: 0, y: 0 }, { x: x1, y: y1 }, { x: x2, y: y2 });
            return a.measure >= 0 && a.measure <= Math.PI + 1e-6;
          }
        )
      );
    });
  });

  describe('Vector', () => {
    it('should calculate magnitude correctly', () => {
      const v = new Vector(3, 4);
      expect(v.magnitude).toBe(5);
    });

    it('should calculate direction correctly', () => {
      const v = new Vector(1, 1);
      expect(v.direction).toBeCloseTo(Math.PI / 4);
    });

    it('should output definition correctly', () => {
      const v = new Vector(1, 2);
      expect(v.definition).toEqual({ kind: 'vector', x: 1, y: 2 });
    });

    it('should output string correctly', () => {
      const v = new Vector(1, 2);
      expect(v.toString()).toBe('Vector(1.00, 2.00)');
    });

    it('should property-test magnitude >= 0', () => {
      fc.assert(
        fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), fc.double({ noNaN: true, noDefaultInfinity: true }), (x, y) => {
          const v = new Vector(x, y);
          return v.magnitude >= 0;
        })
      );
    });
  });

  describe('Polygon', () => {
    it('should calculate perimeter for square', () => {
      const p = new Polygon([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 }
      ]);
      expect(p.perimeter).toBe(8);
    });

    it('should calculate area for square', () => {
      const p = new Polygon([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 }
      ]);
      expect(p.area).toBe(4);
    });

    it('should return 0 perimeter for single point', () => {
      const p = new Polygon([{ x: 0, y: 0 }]);
      expect(p.perimeter).toBe(0);
    });

    it('should return 0 area for line segment', () => {
      const p = new Polygon([{ x: 0, y: 0 }, { x: 2, y: 0 }]);
      expect(p.area).toBe(0);
    });

    it('should satisfy property-based non-negative area and perimeter', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ x: fc.double({ min: -100, max: 100, noNaN: true }), y: fc.double({ min: -100, max: 100, noNaN: true }) })),
          (pts) => {
            const p = new Polygon(pts);
            return p.area >= 0 && p.perimeter >= 0;
          }
        )
      );
    });
  });
});
