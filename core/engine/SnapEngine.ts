import type { Coords2D, GeometryObject } from '../types/geometry';
import type { GeometryRenderer } from '../types/renderer';

export interface SnapSettings {
  point: boolean;
  intersection: boolean;
  midpoint: boolean;
  line: boolean;
  grid: boolean;
  perpendicular: boolean;
}

export interface SnapResult {
  snapped: boolean;
  pos: Coords2D;
  snapType?: 'point' | 'intersection' | 'midpoint' | 'line' | 'grid' | 'perpendicular';
  targetIds?: string[];
  tooltip?: string;
  tooltipI18n?: { key: string, args?: Record<string, string> };
}

export class SnapEngine {
  // Configurable snap distance in pixels. We need to convert it to math coordinates based on zoom.
  private snapPixels = 15;

  constructor(private renderer: GeometryRenderer) {}

  public snap(
    rawPos: Coords2D,
    objects: GeometryObject[],
    settings: SnapSettings,
    zoomLevel: number = 100
  ): SnapResult {
    if (!this.renderer.getRawObject) {
      return { snapped: false, pos: rawPos };
    }

    // Convert pixel tolerance to math tolerance based on zoom level.
    // 100 zoom usually means 1 math unit = 50 pixels (default jsxgraph bounding box is 20 units across 1000px roughly? Wait. 10 units = 500px => 50px/unit)
    // Actually we can use getMathPosition to calculate exact tolerance.
    const centerMath = this.renderer.getMathPosition({ x: 500, y: 500 });
    const offsetMath = this.renderer.getMathPosition({ x: 500 + this.snapPixels, y: 500 });
    let mathTolerance = Math.abs(offsetMath.x - centerMath.x);
    if (mathTolerance === 0 || isNaN(mathTolerance)) mathTolerance = 0.3; // fallback

    let bestPointSnap: { pos: Coords2D, dist: number, obj: GeometryObject } | null = null;
    let bestLineSnap: { pos: Coords2D, dist: number, obj: GeometryObject } | null = null;
    let bestMidpointSnap: { pos: Coords2D, dist: number, obj: GeometryObject } | null = null;

    const lineObjects: GeometryObject[] = [];

    // 1. Iterate objects to find points and lines
    for (const obj of objects) {
      const jxgEl = this.renderer.getRawObject(obj.id);
      if (!jxgEl) continue;

      if (obj.type === 'point') {
        const px = jxgEl.X();
        const py = jxgEl.Y();
        const dist = Math.hypot(px - rawPos.x, py - rawPos.y);
        if (dist <= mathTolerance && (!bestPointSnap || dist < bestPointSnap.dist)) {
          bestPointSnap = { pos: { x: px, y: py }, dist, obj };
        }
      } else if (['line', 'segment', 'ray'].includes(obj.type) || obj.type === 'polygon') {
        lineObjects.push(obj);

        if (settings.line) {
          // Check line distance
          const stdform = jxgEl.stdform; // [C, A, B]
          if (stdform) {
            const C = stdform[0];
            const A = stdform[1];
            const B = stdform[2];
            const denom = Math.hypot(A, B);
            if (denom > 1e-10) {
              const dist = Math.abs(A * rawPos.x + B * rawPos.y + C) / denom;
              if (dist <= mathTolerance) {
                // Projection point
                const px = rawPos.x - (A * (A * rawPos.x + B * rawPos.y + C)) / (denom * denom);
                const py = rawPos.y - (B * (A * rawPos.x + B * rawPos.y + C)) / (denom * denom);
                
                // Bounds check for segment/ray
                let inBounds = true;
                if (obj.type === 'segment' || obj.type === 'ray') {
                  // Simplified bound check using bounding box or point dot products
                  const p1 = jxgEl.point1;
                  const p2 = jxgEl.point2;
                  if (p1 && p2) {
                    const v1 = { x: p2.X() - p1.X(), y: p2.Y() - p1.Y() };
                    const vp = { x: px - p1.X(), y: py - p1.Y() };
                    const dot = v1.x * vp.x + v1.y * vp.y;
                    if (dot < 0) inBounds = false;
                    if (obj.type === 'segment') {
                      const lenSq = v1.x * v1.x + v1.y * v1.y;
                      if (dot > lenSq) inBounds = false;
                    }
                  }
                }

                if (inBounds && (!bestLineSnap || dist < bestLineSnap.dist)) {
                  bestLineSnap = { pos: { x: px, y: py }, dist, obj };
                }
              }
            }
          }
        }
        
        if (settings.midpoint && obj.type === 'segment') {
          const p1 = jxgEl.point1;
          const p2 = jxgEl.point2;
          if (p1 && p2) {
            const mx = (p1.X() + p2.X()) / 2;
            const my = (p1.Y() + p2.Y()) / 2;
            const dist = Math.hypot(mx - rawPos.x, my - rawPos.y);
            if (dist <= mathTolerance && (!bestMidpointSnap || dist < bestMidpointSnap.dist)) {
              bestMidpointSnap = { pos: { x: mx, y: my }, dist, obj };
            }
          }
        }
      }
    }

    // 2. Intersection Snap (Lines only for now, O(N^2))
    let bestIntersectionSnap: { pos: Coords2D, dist: number, obj1: GeometryObject, obj2: GeometryObject } | null = null;
    if (settings.intersection) {
      for (let i = 0; i < lineObjects.length; i++) {
        for (let j = i + 1; j < lineObjects.length; j++) {
          const o1 = lineObjects[i];
          const o2 = lineObjects[j];
          if (!o1 || !o2) continue;
          
          const j1 = this.renderer.getRawObject(o1.id);
          const j2 = this.renderer.getRawObject(o2.id);
          if (j1 && j2 && j1.stdform && j2.stdform) {
            const c1 = j1.stdform[0], a1 = j1.stdform[1], b1 = j1.stdform[2];
            const c2 = j2.stdform[0], a2 = j2.stdform[1], b2 = j2.stdform[2];
            const det = a1 * b2 - a2 * b1;
            if (Math.abs(det) > 1e-10) {
              const ix = (b1 * c2 - b2 * c1) / det;
              const iy = (a2 * c1 - a1 * c2) / det;
              const dist = Math.hypot(ix - rawPos.x, iy - rawPos.y);
              if (dist <= mathTolerance && (!bestIntersectionSnap || dist < bestIntersectionSnap.dist)) {
                // Note: strict bounds checking for segments/rays intersection omitted for simplicity
                // but ideally should be added to avoid snapping to off-screen virtual intersections.
                bestIntersectionSnap = { pos: { x: ix, y: iy }, dist, obj1: o1, obj2: o2 };
              }
            }
          }
        }
      }
    }

    // 3. Grid Snap
    let bestGridSnap: { pos: Coords2D, dist: number } | null = null;
    if (settings.grid) {
      // Assuming grid size is 1 for now (could be dynamic based on zoom)
      const gridSize = 1;
      const gx = Math.round(rawPos.x / gridSize) * gridSize;
      const gy = Math.round(rawPos.y / gridSize) * gridSize;
      const dist = Math.hypot(gx - rawPos.x, gy - rawPos.y);
      if (dist <= mathTolerance) {
        bestGridSnap = { pos: { x: gx, y: gy }, dist };
      }
    }

    // Priority: intersection > point > midpoint > line > grid
    if (settings.intersection && bestIntersectionSnap) {
      const o1Name = (bestIntersectionSnap.obj1.metadata?.label as string) || 'Line';
      const o2Name = (bestIntersectionSnap.obj2.metadata?.label as string) || 'Line';
      return {
        snapped: true,
        pos: bestIntersectionSnap.pos,
        snapType: 'intersection',
        targetIds: [bestIntersectionSnap.obj1.id, bestIntersectionSnap.obj2.id],
        tooltip: `Intersection of ${o1Name} and ${o2Name}`,
        tooltipI18n: { key: 'snap.intersection', args: { obj1: o1Name, obj2: o2Name } }
      };
    }

    if (settings.point && bestPointSnap) {
      const name = (bestPointSnap.obj.metadata?.label as string) || 'Point';
      return {
        snapped: true,
        pos: bestPointSnap.pos,
        snapType: 'point',
        targetIds: [bestPointSnap.obj.id],
        tooltip: name,
        tooltipI18n: { key: 'snap.point', args: { obj: name } }
      };
    }

    if (settings.midpoint && bestMidpointSnap) {
      const name = (bestMidpointSnap.obj.metadata?.label as string) || 'Segment';
      return {
        snapped: true,
        pos: bestMidpointSnap.pos,
        snapType: 'midpoint',
        targetIds: [bestMidpointSnap.obj.id],
        tooltip: `Midpoint of ${name}`,
        tooltipI18n: { key: 'snap.midpoint', args: { obj: name } }
      };
    }

    if (settings.line && bestLineSnap) {
      const name = (bestLineSnap.obj.metadata?.label as string) || 'Line';
      return {
        snapped: true,
        pos: bestLineSnap.pos,
        snapType: 'line',
        targetIds: [bestLineSnap.obj.id],
        tooltip: `On ${name}`,
        tooltipI18n: { key: 'snap.on_line', args: { obj: name } }
      };
    }

    if (settings.grid && bestGridSnap) {
      return {
        snapped: true,
        pos: bestGridSnap.pos,
        snapType: 'grid',
        tooltip: 'Grid',
        tooltipI18n: { key: 'snap.grid' }
      };
    }

    return { snapped: false, pos: rawPos };
  }
}
