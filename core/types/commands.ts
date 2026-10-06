export type ValidationResult = {
  valid: boolean;
  error?: string;
};

// Placeholder for GeometryState for now
export type GeometryState = Record<string, unknown>;

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
