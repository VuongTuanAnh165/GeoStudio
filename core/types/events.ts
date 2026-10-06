import type { GeometryObject } from './geometry';
import type { GeometryCommand } from './commands';
import type { GeoDocument } from './document';

export type Position = { x: number; y: number };
export type StyleProps = Record<string, unknown>;
export type GestureResult = Record<string, unknown>;
export type ToolType = string;

export type GeoEvent =
  // Geometry events
  | { type: 'object:created'; payload: { object: GeometryObject } }
  | { type: 'object:moved'; payload: { id: string; from: Position; to: Position } }
  | { type: 'object:deleted'; payload: { id: string } }
  | { type: 'object:selected'; payload: { ids: string[] } }
  | { type: 'object:deselected'; payload: { ids: string[] } }
  | { type: 'object:styleChanged'; payload: { id: string; style: StyleProps } }
  // Construction events
  | { type: 'construction:started'; payload: { constructionType: string } }
  | { type: 'construction:completed'; payload: { objects: GeometryObject[] } }
  | { type: 'construction:cancelled'; payload: Record<string, never> }
  // Command events
  | { type: 'command:executed'; payload: { command: GeometryCommand } }
  | { type: 'command:undone'; payload: { command: GeometryCommand } }
  | { type: 'command:redone'; payload: { command: GeometryCommand } }
  // Input events
  | { type: 'gesture:recognized'; payload: { gesture: GestureResult } }
  | { type: 'tool:changed'; payload: { tool: ToolType } }
  // Document events
  | { type: 'document:saved'; payload: { documentId: string } }
  | { type: 'document:loaded'; payload: { document: GeoDocument } }
  | { type: 'document:exported'; payload: { format: string } }
  // View events
  | { type: 'view:zoomed'; payload: { scale: number } }
  | { type: 'view:panned'; payload: { offset: Position } }
  | { type: 'view:switched'; payload: { mode: '2d' | '3d' } };

export interface EventBus {
  on(event: string, handler: (e: GeoEvent) => void): () => void; // returns unsubscribe
  off(event: string, handler: (e: GeoEvent) => void): void;
  emit(event: GeoEvent): void;
  once(event: string, handler: (e: GeoEvent) => void): void;
}
