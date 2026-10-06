import type { Coords2D } from '../../types/geometry';
import { GEOMETRY_TOLERANCE } from '../../types/geometry';
import type { Line, Ray, Segment, Circle } from '../primitives/2d';

// Core bounds interface to reuse intersection math for Line, Ray, Segment
type Bounds = { min: number; max: number };

function getBounds(obj: Line | Ray | Segment): Bounds {
  if (obj.type === 'segment') {
    return { min: 0, max: obj.length };
  }
  if (obj.type === 'ray') {
    return { min: 0, max: Infinity };
  }
  // line
  return { min: -Infinity, max: Infinity };
}

function getPointAndDir(obj: Line | Ray | Segment): { p: Coords2D; d: Coords2D } {
  if (obj.type === 'segment') {
    const dx = obj.p2.x - obj.p1.x;
    const dy = obj.p2.y - obj.p1.y;
    const len = obj.length;
    const d = len > 0 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
    return { p: obj.p1, d };
  }
  if (obj.type === 'line') {
    return { p: obj.point, d: obj.direction };
  }
  // ray
  return { p: obj.origin, d: obj.direction };
}

// 1. Generic Line/Ray/Segment - Line/Ray/Segment intersection
export function intersectLinear(obj1: Line | Ray | Segment, obj2: Line | Ray | Segment): Coords2D[] {
  const { p: p1, d: d1 } = getPointAndDir(obj1);
  const { p: p2, d: d2 } = getPointAndDir(obj2);
  const bounds1 = getBounds(obj1);
  const bounds2 = getBounds(obj2);

  const cross = d1.x * d2.y - d1.y * d2.x;

  // Parallel or coincident
  if (Math.abs(cross) < GEOMETRY_TOLERANCE.COLLINEARITY) {
    return []; // For geometry construction, coincident gives infinite points, returning [] is standard unless specifically queried.
  }

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const t1 = (dx * d2.y - dy * d2.x) / cross;
  const t2 = (dx * d1.y - dy * d1.x) / cross;

  const eps = GEOMETRY_TOLERANCE.POINT_COINCIDENCE;

  if (t1 >= bounds1.min - eps && t1 <= bounds1.max + eps &&
      t2 >= bounds2.min - eps && t2 <= bounds2.max + eps) {
    return [{ x: p1.x + t1 * d1.x, y: p1.y + t1 * d1.y }];
  }

  return [];
}

export function intersectLineLine(l1: Line, l2: Line) { return intersectLinear(l1, l2); }
export function intersectSegmentSegment(s1: Segment, s2: Segment) { return intersectLinear(s1, s2); }
export function intersectRayLine(r: Ray, l: Line) { return intersectLinear(r, l); }

// 2. Generic Line/Ray/Segment - Circle intersection
export function intersectLinearCircle(obj: Line | Ray | Segment, c: Circle): Coords2D[] {
  const { p, d } = getPointAndDir(obj);
  const bounds = getBounds(obj);

  const vx = p.x - c.center.x;
  const vy = p.y - c.center.y;

  const b = d.x * vx + d.y * vy; // dot product
  const cVal = vx * vx + vy * vy - c.radius * c.radius;

  const discriminant = b * b - cVal;
  const eps = GEOMETRY_TOLERANCE.POINT_COINCIDENCE;

  if (discriminant < -eps) {
    return [];
  }

  const roots: number[] = [];
  if (Math.abs(discriminant) <= eps) {
    roots.push(-b);
  } else {
    const sqrtD = Math.sqrt(discriminant);
    roots.push(-b - sqrtD);
    roots.push(-b + sqrtD);
  }

  const points: Coords2D[] = [];
  for (const t of roots) {
    if (t >= bounds.min - eps && t <= bounds.max + eps) {
      points.push({ x: p.x + t * d.x, y: p.y + t * d.y });
    }
  }

  return points;
}

export function intersectLineCircle(l: Line, c: Circle) { return intersectLinearCircle(l, c); }
export function intersectSegmentCircle(s: Segment, c: Circle) { return intersectLinearCircle(s, c); }
export function intersectRayCircle(r: Ray, c: Circle) { return intersectLinearCircle(r, c); }

// 3. Circle - Circle intersection
export function intersectCircleCircle(c1: Circle, c2: Circle): Coords2D[] {
  const dx = c2.center.x - c1.center.x;
  const dy = c2.center.y - c1.center.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  const eps = GEOMETRY_TOLERANCE.POINT_COINCIDENCE;

  // Coincident circles (infinite points, return [])
  if (d < eps && Math.abs(c1.radius - c2.radius) < eps) {
    return [];
  }

  // Too far apart or one inside another
  if (d > c1.radius + c2.radius + eps || d < Math.abs(c1.radius - c2.radius) - eps) {
    return [];
  }

  // Find a and h
  // a^2 + h^2 = r1^2
  // b^2 + h^2 = r2^2
  // d = a + b
  const a = (c1.radius * c1.radius - c2.radius * c2.radius + d * d) / (2 * d);
  let hSq = c1.radius * c1.radius - a * a;
  
  if (hSq < eps) hSq = 0; // Float inaccuracy correction

  const h = Math.sqrt(hSq);

  // Point P3 is at distance 'a' along the line from c1 to c2
  const p3x = c1.center.x + (dx * a) / d;
  const p3y = c1.center.y + (dy * a) / d;

  // Tangent
  if (hSq === 0) {
    return [{ x: p3x, y: p3y }];
  }

  // Two intersections
  const rx = -dy * (h / d);
  const ry = dx * (h / d);

  return [
    { x: p3x + rx, y: p3y + ry },
    { x: p3x - rx, y: p3y - ry }
  ];
}
