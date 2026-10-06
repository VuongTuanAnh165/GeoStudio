import type { Coords2D } from '../../types/geometry';
import type { Line, Arc, Polygon } from '../primitives/2d';

// Core math functions (decoupled to avoid circular runtime dependencies)
export function distanceCoords(a: Coords2D, b: Coords2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function distancePointToLineCoords(p: Coords2D, lPoint: Coords2D, lDir: Coords2D): number {
  const dx = p.x - lPoint.x;
  const dy = p.y - lPoint.y;
  return Math.abs(dx * lDir.y - dy * lDir.x);
}

export function angleCoords(vertex: Coords2D, p1: Coords2D, p2: Coords2D): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  const denominator = mag1 * mag2;
  if (denominator === 0 || !isFinite(denominator)) return 0;
  
  let cosTheta = dot / denominator;
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  return Math.acos(cosTheta);
}

export function polygonPerimeterCoords(points: Coords2D[]): number {
  if (points.length < 2) return 0;
  let peri = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    peri += distanceCoords(p1, p2);
  }
  return peri;
}

export function polygonAreaCoords(points: Coords2D[]): number {
  if (points.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    a += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(a) / 2;
}

export function arcSpan(startAngle: number, endAngle: number): number {
  let span = (endAngle - startAngle) % (2 * Math.PI);
  if (span < 0) span += 2 * Math.PI;
  return span;
}

// Module exported functions for primitives
export function distance(a: Coords2D, b: Coords2D): number {
  return distanceCoords(a, b);
}

export function distancePointToLine(p: Coords2D, l: Line): number {
  return distancePointToLineCoords(p, l.point, l.direction);
}

export function angle(a: Coords2D, b: Coords2D, c: Coords2D): number {
  // Angle at B
  return angleCoords(b, a, c);
}

export function area(polygon: Polygon): number {
  return polygonAreaCoords(polygon.points);
}

export function perimeter(polygon: Polygon): number {
  return polygonPerimeterCoords(polygon.points);
}

export function arcLength(arc: Arc): number {
  return arc.radius * arcSpan(arc.startAngle, arc.endAngle);
}

export function sectorArea(arc: Arc): number {
  return 0.5 * arc.radius * arc.radius * arcSpan(arc.startAngle, arc.endAngle);
}
