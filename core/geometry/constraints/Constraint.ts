import type { GeometryObject, Coords2D } from '../../types/geometry';

export abstract class Constraint {
  constructor(
    public id: string,
    public type: string,
    public objectIds: string[],
    public parameters: Record<string, unknown> = {}
  ) {}

  /**
   * Returns a numerical value representing the error.
   * 0 means the constraint is perfectly satisfied.
   */
  abstract getError(objects: Map<string, GeometryObject>): number;

  /**
   * Modifies the coordinates of the objects in the map to reduce the error.
   */
  abstract relax(objects: Map<string, GeometryObject>): void;

  protected getCoords(obj: GeometryObject | undefined): Coords2D | null {
    if (!obj || obj.type !== 'point' || !obj.definition.coords) return null;
    return obj.definition.coords as Coords2D;
  }
}
