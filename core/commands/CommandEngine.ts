import type { GeometryCommand, GeometryState, ValidationResult } from '../types/commands';
import { HistoryManager } from './CommandHistory';

export class CommandEngine {
  private history: HistoryManager;
  private state: GeometryState;

  constructor(initialState: GeometryState, maxHistory = 200) {
    this.history = new HistoryManager(maxHistory);
    this.state = initialState;
  }

  get currentState(): GeometryState {
    return this.state;
  }

  get historyManager(): HistoryManager {
    return this.history;
  }

  validate(command: GeometryCommand): ValidationResult {
    return command.validate(this.state);
  }

  execute(command: GeometryCommand): ValidationResult {
    const validation = this.validate(command);
    if (!validation.valid) {
      return validation;
    }

    try {
      this.state = command.execute(this.state);
      this.history.execute(command);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  undo(): boolean {
    const cmd = this.history.undo();
    if (!cmd) return false;

    try {
      this.state = cmd.undo(this.state);
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      // Revert the undo action in history since it failed
      this.history.redo(); 
      return false;
    }
  }

  redo(): boolean {
    const cmd = this.history.redo();
    if (!cmd) return false;

    try {
      this.state = cmd.execute(this.state);
      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      // Revert the redo action in history
      this.history.undo();
      return false;
    }
  }

  clearHistory(): void {
    this.history.clear();
  }

  loadState(state: GeometryState): void {
    this.state = state;
    this.history.clear();
  }
}
