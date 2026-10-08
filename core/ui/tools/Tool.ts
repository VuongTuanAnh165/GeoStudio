import type { GeometryObject, Coords2D } from '../../types/geometry';
import type { GeometryCommand } from '../../types/commands';
import type { SnapResult } from '../../engine/SnapEngine';

export interface ToolEvent {
  mathPos: Coords2D;
  screenPos: Coords2D;
  hitObjectId: string | null;
  nativeEvent: Event;
  snapResult?: SnapResult;
}

export interface ToolContext {
  executeCommand(cmd: GeometryCommand): void;
  getObject(id: string): GeometryObject | undefined;
  getObjects(): GeometryObject[];
  renderTempObject(obj: GeometryObject): void;
  removeTempObject(id: string): void;
  clearTempObjects(): void;
  generateId(prefix: string): string;
  selectObject(id: string | null): void;
}

export interface Tool {
  readonly id: string;
  onActivate?(context: ToolContext): void;
  onDeactivate?(context: ToolContext): void;
  onMouseDown?(event: ToolEvent, context: ToolContext): void;
  onMouseMove?(event: ToolEvent, context: ToolContext): void;
  onMouseUp?(event: ToolEvent, context: ToolContext): void;
  onDoubleClick?(event: ToolEvent, context: ToolContext): void;
}
