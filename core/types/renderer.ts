import type { GeometryObject, Coords2D } from './geometry';
import type { AnimationConfig } from './animation';

export interface GeometryRenderer {
  init(container: string | HTMLElement): void;
  renderObject(obj: GeometryObject): void;
  removeObject(id: string, options?: { animate?: boolean }): void;
  updateObject(id: string, obj: GeometryObject, isSelected?: boolean, options?: { animate?: boolean }): void;
  getRawObject?(id: string): any;
  getRenderedIds(): string[];
  hitTest(screenPos: Coords2D): string | null;
  getScreenPosition(mathPos: Coords2D): Coords2D;
  getMathPosition(screenPos: Coords2D): Coords2D;
  getMathPositionFromEvent(event: any): Coords2D;
  clear(): void;
  setGridVisible(visible: boolean): void;
  setAxisVisible(visible: boolean): void;
  setAnimationConfig?(config: Partial<AnimationConfig>): void;
  animateObjectMove?(id: string, targetCoords: Coords2D, duration?: number): Promise<void>;
  fitToView(): void;
  pan(dx: number, dy: number): void;
  zoom(factor: number, x: number, y: number): void;
  
  on(eventName: string, callback: (event: any) => void): void;
  off(eventName: string, callback: (event: any) => void): void;
}
