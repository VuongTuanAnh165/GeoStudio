import { Constraint } from './Constraint';
import type { GeometryObject } from '../../types/geometry';

export class Vertical extends Constraint {
  constructor(id: string, objectIds: string[]) {
    super(id, 'vertical', objectIds, {});
  }

  getError(objects: Map<string, GeometryObject>): number {
    const p1 = this.getCoords(objects.get(this.objectIds[0]));
    const p2 = this.getCoords(objects.get(this.objectIds[1]));
    if (!p1 || !p2) return 0;

    return Math.abs(p2.x - p1.x);
  }

  relax(objects: Map<string, GeometryObject>): void {
    const p1 = this.getCoords(objects.get(this.objectIds[0]));
    const p2 = this.getCoords(objects.get(this.objectIds[1]));
    if (!p1 || !p2) return;

    const avgX = (p1.x + p2.x) / 2;
    p1.x = avgX;
    p2.x = avgX;
  }
}
