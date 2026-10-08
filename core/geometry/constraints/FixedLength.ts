import { Constraint } from './Constraint';
import type { GeometryObject } from '../../types/geometry';

export class FixedLength extends Constraint {
  constructor(id: string, objectIds: string[], public length: number) {
    super(id, 'fixed_length', objectIds, { length });
  }

  getError(objects: Map<string, GeometryObject>): number {
    const p1 = this.getCoords(objects.get(this.objectIds[0]));
    const p2 = this.getCoords(objects.get(this.objectIds[1]));
    if (!p1 || !p2) return 0;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);
    return Math.abs(currentLength - this.length);
  }

  relax(objects: Map<string, GeometryObject>): void {
    const p1 = this.getCoords(objects.get(this.objectIds[0]));
    const p2 = this.getCoords(objects.get(this.objectIds[1]));
    if (!p1 || !p2) return;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);
    if (currentLength === 0 || currentLength === this.length) return;

    const ratio = (currentLength - this.length) / currentLength;
    
    // Move both points halfway towards/away from each other
    p1.x += (dx * ratio) * 0.5;
    p1.y += (dy * ratio) * 0.5;
    p2.x -= (dx * ratio) * 0.5;
    p2.y -= (dy * ratio) * 0.5;
  }
}
