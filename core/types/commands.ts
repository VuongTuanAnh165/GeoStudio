import type { GeoDocument } from './document';

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export type GeometryState = {
  document: GeoDocument;
  selection: string[]; // selected object IDs
  // Other interactive state can be added here
};

export interface GeometryCommand {
  id: string; // UUID
  type: string; // e.g. "CREATE_POINT"
  args: Record<string, unknown>;
  timestamp: number;
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script';
  undoable: boolean;

  execute(state: GeometryState): GeometryState;
  undo(state: GeometryState): GeometryState;
  validate(state: GeometryState): ValidationResult;
  toJSON(): Record<string, unknown>;
}

export interface CommandHistory {
  undoStack: GeometryCommand[];
  redoStack: GeometryCommand[];
  maxHistory: number; // giới hạn (mặc định 200)

  execute(command: GeometryCommand): void;
  undo(): GeometryCommand | null;
  redo(): GeometryCommand | null;

  // Replay support
  getSteps(): GeometryCommand[];
  replayTo(stepIndex: number): void;

  // Batch operations
  beginBatch(label: string): void;
  endBatch(): void; // gom nhiều commands thành 1 undo step
}
