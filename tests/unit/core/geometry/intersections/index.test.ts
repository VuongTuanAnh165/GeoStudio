import { describe, it, expect } from 'vitest';
import {
  intersectLineLine,
  intersectSegmentSegment,
  intersectRayLine,
  intersectLineCircle,
  intersectSegmentCircle,
  intersectRayCircle,
  intersectCircleCircle,
  intersectLinear
} from '../../../../../core/geometry/intersections';
import { Line, Ray, Segment, Circle } from '../../../../../core/geometry/primitives/2d';

describe('Intersection Module', () => {
  describe('Linear - Linear (Line, Segment, Ray)', () => {
    it('Line-Line: should intersect at one point', () => {
      const l1 = Line.fromTwoPoints({ x: 0, y: 0 }, { x: 5, y: 5 });
      const l2 = Line.fromTwoPoints({ x: 0, y: 5 }, { x: 5, y: 0 });
      const pts = intersectLineLine(l1, l2);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(2.5);
      expect(pts[0].y).toBeCloseTo(2.5);
    });

    it('Line-Line: should return empty if parallel', () => {
      const l1 = Line.fromTwoPoints({ x: 0, y: 0 }, { x: 1, y: 0 });
      const l2 = Line.fromTwoPoints({ x: 0, y: 1 }, { x: 1, y: 1 });
      const pts = intersectLineLine(l1, l2);
      expect(pts).toHaveLength(0);
    });

    it('Line-Line: should return empty if coincident', () => {
      const l1 = Line.fromTwoPoints({ x: 0, y: 0 }, { x: 1, y: 0 });
      const l2 = Line.fromTwoPoints({ x: 2, y: 0 }, { x: 3, y: 0 });
      const pts = intersectLineLine(l1, l2);
      expect(pts).toHaveLength(0);
    });

    it('Segment-Segment: should intersect if crossing', () => {
      const s1 = new Segment({ x: 0, y: 0 }, { x: 10, y: 10 });
      const s2 = new Segment({ x: 0, y: 10 }, { x: 10, y: 0 });
      const pts = intersectSegmentSegment(s1, s2);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
      expect(pts[0].y).toBeCloseTo(5);
    });

    it('Segment-Segment: should not intersect if crossing outside bounds', () => {
      const s1 = new Segment({ x: 0, y: 0 }, { x: 4, y: 4 }); // stops before (5,5)
      const s2 = new Segment({ x: 0, y: 10 }, { x: 10, y: 0 });
      const pts = intersectSegmentSegment(s1, s2);
      expect(pts).toHaveLength(0);
    });

    it('Segment-Segment: should intersect at endpoint', () => {
      const s1 = new Segment({ x: 0, y: 0 }, { x: 5, y: 5 });
      const s2 = new Segment({ x: 5, y: 5 }, { x: 10, y: 0 });
      const pts = intersectSegmentSegment(s1, s2);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
      expect(pts[0].y).toBeCloseTo(5);
    });

    it('Ray-Line: should intersect if ray points towards line', () => {
      const r = Ray.fromTwoPoints({ x: 5, y: -5 }, { x: 5, y: 0 });
      const l = Line.fromTwoPoints({ x: 0, y: 5 }, { x: 10, y: 5 });
      const pts = intersectRayLine(r, l);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
      expect(pts[0].y).toBeCloseTo(5);
    });

    it('Ray-Line: should not intersect if ray points away', () => {
      const r = Ray.fromTwoPoints({ x: 5, y: 6 }, { x: 5, y: 7 }); // points up
      const l = Line.fromTwoPoints({ x: 0, y: 5 }, { x: 10, y: 5 }); // line is below
      const pts = intersectRayLine(r, l);
      expect(pts).toHaveLength(0);
    });
  });

  describe('Linear - Circle', () => {
    it('Line-Circle: should intersect at two points (secant)', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const l = Line.fromTwoPoints({ x: -10, y: 0 }, { x: 10, y: 0 });
      const pts = intersectLineCircle(l, c);
      expect(pts).toHaveLength(2);
      // Roots might be in any order, so sort by x
      pts.sort((a, b) => a.x - b.x);
      expect(pts[0].x).toBeCloseTo(-5);
      expect(pts[1].x).toBeCloseTo(5);
    });

    it('Line-Circle: should intersect at one point (tangent)', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const l = Line.fromTwoPoints({ x: -10, y: 5 }, { x: 10, y: 5 });
      const pts = intersectLineCircle(l, c);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(0);
      expect(pts[0].y).toBeCloseTo(5);
    });

    it('Line-Circle: should not intersect (outside)', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const l = Line.fromTwoPoints({ x: -10, y: 6 }, { x: 10, y: 6 });
      const pts = intersectLineCircle(l, c);
      expect(pts).toHaveLength(0);
    });

    it('Segment-Circle: should intersect at one point if segment starts inside and ends outside', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const s = new Segment({ x: 0, y: 0 }, { x: 10, y: 0 });
      const pts = intersectSegmentCircle(s, c);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
    });

    it('Ray-Circle: should intersect at one point if originating exactly on circle pointing outwards', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const r = Ray.fromTwoPoints({ x: 5, y: 0 }, { x: 10, y: 0 });
      const pts = intersectRayCircle(r, c);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
    });
  });

  describe('Circle - Circle', () => {
    it('should intersect at two points', () => {
      const c1 = new Circle({ x: 0, y: 0 }, 5);
      const c2 = new Circle({ x: 8, y: 0 }, 5); // Centers distance = 8, radii sum = 10 -> intersects
      const pts = intersectCircleCircle(c1, c2);
      expect(pts).toHaveLength(2);
      pts.sort((a, b) => a.y - b.y);
      expect(pts[0].x).toBeCloseTo(4);
      expect(pts[0].y).toBeCloseTo(-3);
      expect(pts[1].x).toBeCloseTo(4);
      expect(pts[1].y).toBeCloseTo(3);
    });

    it('should intersect at one point (externally tangent)', () => {
      const c1 = new Circle({ x: 0, y: 0 }, 5);
      const c2 = new Circle({ x: 10, y: 0 }, 5);
      const pts = intersectCircleCircle(c1, c2);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
      expect(pts[0].y).toBeCloseTo(0);
    });

    it('should intersect at one point (internally tangent)', () => {
      const c1 = new Circle({ x: 0, y: 0 }, 5);
      const c2 = new Circle({ x: 2, y: 0 }, 3);
      const pts = intersectCircleCircle(c1, c2);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
      expect(pts[0].y).toBeCloseTo(0);
    });

    it('should not intersect (far apart)', () => {
      const c1 = new Circle({ x: 0, y: 0 }, 5);
      const c2 = new Circle({ x: 12, y: 0 }, 5);
      const pts = intersectCircleCircle(c1, c2);
      expect(pts).toHaveLength(0);
    });

    it('should not intersect (one fully inside another)', () => {
      const c1 = new Circle({ x: 0, y: 0 }, 5);
      const c2 = new Circle({ x: 0, y: 0 }, 3);
      const pts = intersectCircleCircle(c1, c2);
      expect(pts).toHaveLength(0);
    });

    it('should return empty if exactly coincident', () => {
      const c1 = new Circle({ x: 0, y: 0 }, 5);
      const c2 = new Circle({ x: 0, y: 0 }, 5);
      const pts = intersectCircleCircle(c1, c2);
      expect(pts).toHaveLength(0);
    });
  });

  describe('Degenerate Cases and Edge Conditions', () => {
    it('Line-Line: collinear opposite direction', () => {
      const l1 = Line.fromTwoPoints({ x: 0, y: 0 }, { x: 1, y: 1 });
      const l2 = Line.fromTwoPoints({ x: 5, y: 5 }, { x: 4, y: 4 });
      expect(intersectLineLine(l1, l2)).toHaveLength(0);
    });
    
    it('Segment-Segment: collinear overlapping', () => {
      const s1 = new Segment({ x: 0, y: 0 }, { x: 4, y: 4 });
      const s2 = new Segment({ x: 2, y: 2 }, { x: 6, y: 6 });
      // Currently intersects return empty for coincident lines by design
      expect(intersectSegmentSegment(s1, s2)).toHaveLength(0);
    });

    it('Segment-Segment: collinear disjoint', () => {
      const s1 = new Segment({ x: 0, y: 0 }, { x: 2, y: 2 });
      const s2 = new Segment({ x: 4, y: 4 }, { x: 6, y: 6 });
      expect(intersectSegmentSegment(s1, s2)).toHaveLength(0);
    });

    it('Segment-Segment: single point touch collinear', () => {
      const s1 = new Segment({ x: 0, y: 0 }, { x: 2, y: 2 });
      const s2 = new Segment({ x: 2, y: 2 }, { x: 4, y: 4 });
      expect(intersectSegmentSegment(s1, s2)).toHaveLength(0); // Collinear check fires first
    });

    it('Ray-Ray: intersecting exactly at origin', () => {
      const r1 = Ray.fromTwoPoints({ x: 0, y: 0 }, { x: 1, y: 1 });
      const r2 = Ray.fromTwoPoints({ x: 0, y: 0 }, { x: -1, y: 1 });
      const pts = intersectLinear(r1, r2);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(0);
    });

    it('Ray-Ray: parallel disjoint', () => {
      const r1 = Ray.fromTwoPoints({ x: 0, y: 0 }, { x: 1, y: 0 });
      const r2 = Ray.fromTwoPoints({ x: 0, y: 1 }, { x: 1, y: 1 });
      expect(intersectLinear(r1, r2)).toHaveLength(0);
    });

    it('Line-Circle: line passes exactly through center', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const l = Line.fromTwoPoints({ x: 0, y: -10 }, { x: 0, y: 10 });
      const pts = intersectLineCircle(l, c);
      expect(pts).toHaveLength(2);
      pts.sort((a, b) => a.y - b.y);
      expect(pts[0].y).toBeCloseTo(-5);
      expect(pts[1].y).toBeCloseTo(5);
    });

    it('Segment-Circle: segment fully inside circle', () => {
      const c = new Circle({ x: 0, y: 0 }, 10);
      const s = new Segment({ x: -2, y: 0 }, { x: 2, y: 0 });
      expect(intersectSegmentCircle(s, c)).toHaveLength(0);
    });

    it('Segment-Circle: both endpoints on circle', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const s = new Segment({ x: -5, y: 0 }, { x: 5, y: 0 });
      const pts = intersectSegmentCircle(s, c);
      expect(pts).toHaveLength(2);
    });

    it('Ray-Circle: origin inside circle', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const r = Ray.fromTwoPoints({ x: 0, y: 0 }, { x: 1, y: 0 });
      const pts = intersectRayCircle(r, c);
      expect(pts).toHaveLength(1);
      expect(pts[0].x).toBeCloseTo(5);
    });

    it('Ray-Circle: pointing away from circle', () => {
      const c = new Circle({ x: 0, y: 0 }, 5);
      const r = Ray.fromTwoPoints({ x: 10, y: 0 }, { x: 11, y: 0 });
      expect(intersectRayCircle(r, c)).toHaveLength(0);
    });

    it('Circle-Circle: centers very close but radii different', () => {
      const c1 = new Circle({ x: 0, y: 0 }, 5);
      const c2 = new Circle({ x: 1e-12, y: 0 }, 10);
      expect(intersectCircleCircle(c1, c2)).toHaveLength(0);
    });
  });
});