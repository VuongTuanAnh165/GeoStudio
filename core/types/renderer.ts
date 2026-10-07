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
  getMathPositionFromEvent(event: any): Coords2D;
  clear(): void;
  setGridVisible(visible: boolean): void;
  setAxisVisible(visible: boolean): void;
  fitToView(): void;
  
  on(eventName: string, callback: (event: any) => void): void;
  off(eventName: string, callback: (event: any) => void): void;
}
