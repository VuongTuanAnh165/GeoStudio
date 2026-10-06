import type { GeometryCommand, CommandHistory, GeometryState } from '../types/commands';

export class HistoryManager implements CommandHistory {
  undoStack: GeometryCommand[] = [];
  redoStack: GeometryCommand[] = [];
  maxHistory: number;
  
  private isBatching = false;
  private currentBatch: GeometryCommand[] = [];
  private batchLabel = '';

  constructor(maxHistory = 200) {
    this.maxHistory = maxHistory;
  }

  execute(command: GeometryCommand): void {
    if (this.isBatching) {
      this.currentBatch.push(command);
    } else {
      if (command.undoable) {
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxHistory) {
          this.undoStack.shift(); // Remove oldest
        }
      }
      // Clear redo stack on new action
      this.redoStack = [];
    }
  }

  undo(): GeometryCommand | null {
    if (this.undoStack.length === 0) return null;
    const cmd = this.undoStack.pop()!;
    this.redoStack.push(cmd);
    return cmd;
  }

  redo(): GeometryCommand | null {
    if (this.redoStack.length === 0) return null;
    const cmd = this.redoStack.pop()!;
    this.undoStack.push(cmd);
    return cmd;
  }

  getSteps(): GeometryCommand[] {
    return [...this.undoStack];
  }

  replayTo(_stepIndex: number): void {
    // To be implemented by Engine using History
    throw new Error('Not implemented here, engine responsibility');
  }

  beginBatch(label: string): void {
    if (this.isBatching) {
      throw new Error('Already in a batch');
    }
    this.isBatching = true;
    this.batchLabel = label;
    this.currentBatch = [];
  }

  endBatch(): void {
    if (!this.isBatching) {
      throw new Error('Not in a batch');
    }
    this.isBatching = false;
    
    if (this.currentBatch.length > 0) {
      // Create a composite command
      const compositeCmd = new BatchCommand(this.batchLabel, this.currentBatch);
      this.execute(compositeCmd);
    }
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.isBatching = false;
    this.currentBatch = [];
  }
}

export class BatchCommand implements GeometryCommand {
  id: string;
  type = 'BATCH_COMMAND';
  args: Record<string, unknown>;
  timestamp: number;
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script' = 'script';
  undoable = true;

  constructor(public label: string, public commands: GeometryCommand[]) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.args = { label, count: commands.length };
    
    // Inherit source from first command if available
    if (commands.length > 0) {
      this.source = commands[0].source;
    }
  }

  execute(state: GeometryState): GeometryState {
    let currentState = state;
    for (const cmd of this.commands) {
      currentState = cmd.execute(currentState);
    }
    return currentState;
  }

  undo(state: GeometryState): GeometryState {
    let currentState = state;
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      currentState = this.commands[i].undo(currentState);
    }
    return currentState;
  }

  validate(state: GeometryState) {
    const currentState = state;
    for (const cmd of this.commands) {
      const v = cmd.validate(currentState);
      if (!v.valid) return v;
      // Note: we can't fully validate a batch if earlier commands modify state
      // but without executing them. For now, assume if all independently are valid against their preceding states...
      // Since validate doesn't return state, this is a bit tricky.
      // We will just do a basic check.
    }
    return { valid: true };
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      args: this.args,
      timestamp: this.timestamp,
      source: this.source,
      undoable: this.undoable,
      commands: this.commands.map(cmd => cmd.toJSON())
    };
  }
}
