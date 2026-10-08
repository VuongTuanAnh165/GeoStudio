import { Constraint } from './Constraint';
import type { GeometryObject } from '../../types/geometry';

export class PointOnCircle extends Constraint {
  constructor(id: string, objectIds: string[]) {
    // objectIds = [pointId, circleId]
    super(id, 'point_on_circle', objectIds, {});
  }

  private getCircleData(circleObj: GeometryObject | undefined, objects: Map<string, GeometryObject>) {
    if (!circleObj || !circleObj.parents || circleObj.parents.length < 2) return null;
    const center = this.getCoords(objects.get(circleObj.parents[0]));
    const edgePoint = this.getCoords(objects.get(circleObj.parents[1]));
    if (!center || !edgePoint) return null;
    
    const dx = edgePoint.x - center.x;
    const dy = edgePoint.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    return { center, radius };
  }

  getError(objects: Map<string, GeometryObject>): number {
    const p = this.getCoords(objects.get(this.objectIds[0]));
    const circleData = this.getCircleData(objects.get(this.objectIds[1]), objects);
    
    if (!p || !circleData) return 0;

    const dx = p.x - circleData.center.x;
    const dy = p.y - circleData.center.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    
    return Math.abs(currentDist - circleData.radius);
  }

  relax(objects: Map<string, GeometryObject>): void {
    const p = this.getCoords(objects.get(this.objectIds[0]));
    const circleData = this.getCircleData(objects.get(this.objectIds[1]), objects);
    
    if (!p || !circleData) return;

    const dx = p.x - circleData.center.x;
    const dy = p.y - circleData.center.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    
    if (currentDist === 0) {
      // Point is exactly at center, move it right by radius
      p.x = circleData.center.x + circleData.radius;
      p.y = circleData.center.y;
      return;
    }

    const ratio = circleData.radius / currentDist;
    p.x = circleData.center.x + dx * ratio;
    p.y = circleData.center.y + dy * ratio;
  }
}
