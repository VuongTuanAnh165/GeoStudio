import { Constraint } from './Constraint';
import type { GeometryObject } from '../../types/geometry';

export class FixedAngle extends Constraint {
  constructor(id: string, objectIds: string[], public angleDegrees: number) {
    // objectIds = [pointA, pointB, pointC] (angle at B)
    super(id, 'fixed_angle', objectIds, { angleDegrees });
  }

  private normalizeAngle(a: number): number {
    while (a < 0) a += Math.PI * 2;
    while (a >= Math.PI * 2) a -= Math.PI * 2;
    return a;
  }

  getError(objects: Map<string, GeometryObject>): number {
    const a = this.getCoords(objects.get(this.objectIds[0]));
    const b = this.getCoords(objects.get(this.objectIds[1]));
    const c = this.getCoords(objects.get(this.objectIds[2]));
    if (!a || !b || !c) return 0;

    const angleBA = Math.atan2(a.y - b.y, a.x - b.x);
    const angleBC = Math.atan2(c.y - b.y, c.x - b.x);
    
    let currentAngle = this.normalizeAngle(angleBC - angleBA);
    if (currentAngle > Math.PI) {
       currentAngle = 2 * Math.PI - currentAngle; // Take the inner angle
    }
    
    const targetAngle = (this.angleDegrees * Math.PI) / 180;
    return Math.abs(currentAngle - targetAngle);
  }

  relax(objects: Map<string, GeometryObject>): void {
    const a = this.getCoords(objects.get(this.objectIds[0]));
    const b = this.getCoords(objects.get(this.objectIds[1]));
    const c = this.getCoords(objects.get(this.objectIds[2]));
    if (!a || !b || !c) return;

    const angleBA = Math.atan2(a.y - b.y, a.x - b.x);
    const angleBC = Math.atan2(c.y - b.y, c.x - b.x);
    
    let currentAngle = this.normalizeAngle(angleBC - angleBA);
    let isReflex = false;
    if (currentAngle > Math.PI) {
       currentAngle = 2 * Math.PI - currentAngle; // Take the inner angle
       isReflex = true;
    }
    
    const targetAngle = (this.angleDegrees * Math.PI) / 180;
    if (Math.abs(currentAngle - targetAngle) < 1e-6) return;

    let deltaAngle = targetAngle - currentAngle;
    if (isReflex) {
      deltaAngle = -deltaAngle; // Adjust direction if we took the reflex angle
    }

    // Rotate a and c in opposite directions by half the delta
    const distBA = Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
    const distBC = Math.sqrt((c.x - b.x)**2 + (c.y - b.y)**2);

    const newAngleBA = angleBA - deltaAngle / 2;
    const newAngleBC = angleBC + deltaAngle / 2;

    if (distBA > 0) {
      a.x = b.x + distBA * Math.cos(newAngleBA);
      a.y = b.y + distBA * Math.sin(newAngleBA);
    }
    if (distBC > 0) {
      c.x = b.x + distBC * Math.cos(newAngleBC);
      c.y = b.y + distBC * Math.sin(newAngleBC);
    }
  }
}
