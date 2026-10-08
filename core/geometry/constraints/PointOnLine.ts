import { Constraint } from './Constraint';
import type { GeometryObject } from '../../types/geometry';

export class PointOnLine extends Constraint {
  constructor(id: string, objectIds: string[]) {
    // objectIds = [pointId, lineId]
    super(id, 'point_on_line', objectIds, {});
  }

  private getLinePoints(lineObj: GeometryObject | undefined, objects: Map<string, GeometryObject>) {
    if (!lineObj || !lineObj.parents || lineObj.parents.length < 2) return null;
    const p1 = this.getCoords(objects.get(lineObj.parents[0]));
    const p2 = this.getCoords(objects.get(lineObj.parents[1]));
    if (!p1 || !p2) return null;
    return { p1, p2 };
  }

  getError(objects: Map<string, GeometryObject>): number {
    const p = this.getCoords(objects.get(this.objectIds[0]));
    const lineObj = objects.get(this.objectIds[1]);
    const linePts = this.getLinePoints(lineObj, objects);
    
    if (!p || !linePts) return 0;
    const { p1, p2 } = linePts;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    
    if (len2 === 0) {
      // Line is degenerate, distance to p1
      return Math.sqrt((p.x - p1.x)**2 + (p.y - p1.y)**2);
    }

    // Distance from point to line defined by two points
    // distance = |(y2 - y1)*x0 - (x2 - x1)*y0 + x2*y1 - y2*x1| / sqrt((y2 - y1)^2 + (x2 - x1)^2)
    const num = Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x);
    return num / Math.sqrt(len2);
  }

  relax(objects: Map<string, GeometryObject>): void {
    const p = this.getCoords(objects.get(this.objectIds[0]));
    const lineObj = objects.get(this.objectIds[1]);
    const linePts = this.getLinePoints(lineObj, objects);
    
    if (!p || !linePts) return;
    const { p1, p2 } = linePts;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    
    if (len2 === 0) {
      p.x = p1.x;
      p.y = p1.y;
      return;
    }

    // Projection of p onto the line
    const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / len2;
    p.x = p1.x + t * dx;
    p.y = p1.y + t * dy;
  }
}
