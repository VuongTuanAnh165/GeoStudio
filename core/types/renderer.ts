import type { GeometryObject, Coords2D } from './geometry';

export interface GeometryRenderer {
  init(container: string | HTMLElement): void;
  renderObject(obj: GeometryObject): void;
  removeObject(id: string): void;
  updateObject(id: string, obj: GeometryObject): void;
  getRenderedIds(): string[];
  hitTest(screenPos: Coords2D): string | null;
  getScreenPosition(mathPos: Coords2D): Coords2D;
  getMathPosition(screenPos: Coords2D): Coords2D;
  clear(): void;
}
