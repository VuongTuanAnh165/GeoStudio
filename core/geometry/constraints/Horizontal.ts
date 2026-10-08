import { Constraint } from './Constraint';
import type { GeometryObject } from '../../types/geometry';

export class Horizontal extends Constraint {
  constructor(id: string, objectIds: string[]) {
    super(id, 'horizontal', objectIds, {});
  }

  getError(objects: Map<string, GeometryObject>): number {
    const p1 = this.getCoords(objects.get(this.objectIds[0]));
    const p2 = this.getCoords(objects.get(this.objectIds[1]));
    if (!p1 || !p2) return 0;

    return Math.abs(p2.y - p1.y);
  }

  relax(objects: Map<string, GeometryObject>): void {
    const p1 = this.getCoords(objects.get(this.objectIds[0]));
    const p2 = this.getCoords(objects.get(this.objectIds[1]));
    if (!p1 || !p2) return;

    const avgY = (p1.y + p2.y) / 2;
    p1.y = avgY;
    p2.y = avgY;
  }
}
