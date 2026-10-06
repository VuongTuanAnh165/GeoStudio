import { describe, it, expect, beforeEach } from 'vitest';
import { CommandEngine } from '../../../../core/commands/CommandEngine';
import { 
  CreatePointCommand,
  CreatePolygonCommand 
} from '../../../../core/commands/primitives';
import type { GeometryState } from '../../../../core/types/commands';

describe('CommandEngine & CommandHistory', () => {
  let engine: CommandEngine;
  let initialState: GeometryState;

  beforeEach(() => {
    initialState = {
      document: {
        version: '1.0',
        schemaVersion: 1,
        metadata: {
          id: 'test-doc',
          title: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        settings: {
          theme: 'light',
          gridVisible: true,
          axisVisible: true,
          snapEnabled: true,
          dimension: 2
        },
        viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        objects: []
      },
      selection: []
    };
    engine = new CommandEngine(initialState);
  });

  it('should execute a command and update state', () => {
    const cmd = new CreatePointCommand(5, 5, 'pt1');
    const result = engine.execute(cmd);
    
    expect(result.valid).toBe(true);
    expect(engine.currentState.document.objects.length).toBe(1);
    expect(engine.currentState.document.objects[0].id).toBe('pt1');
    expect(engine.historyManager.getSteps().length).toBe(1);
  });

  it('should undo and redo correctly', () => {
    const cmd1 = new CreatePointCommand(0, 0, 'pt1');
    const cmd2 = new CreatePointCommand(10, 10, 'pt2');
    
    engine.execute(cmd1);
    engine.execute(cmd2);
    expect(engine.currentState.document.objects.length).toBe(2);

    // Undo cmd2
    engine.undo();
    expect(engine.currentState.document.objects.length).toBe(1);
    expect(engine.currentState.document.objects[0].id).toBe('pt1');

    // Undo cmd1
    engine.undo();
    expect(engine.currentState.document.objects.length).toBe(0);

    // Redo cmd1
    engine.redo();
    expect(engine.currentState.document.objects.length).toBe(1);
    expect(engine.currentState.document.objects[0].id).toBe('pt1');

    // Redo cmd2
    engine.redo();
    expect(engine.currentState.document.objects.length).toBe(2);
    expect(engine.currentState.document.objects[1].id).toBe('pt2');
  });

  it('should clear redo stack when a new command is executed', () => {
    const cmd1 = new CreatePointCommand(0, 0);
    const cmd2 = new CreatePointCommand(10, 10);
    const cmd3 = new CreatePointCommand(20, 20);

    engine.execute(cmd1);
    engine.execute(cmd2);
    
    engine.undo(); // undo cmd2
    expect(engine.historyManager.redoStack.length).toBe(1);
    
    engine.execute(cmd3); // new action clears redo stack
    expect(engine.historyManager.redoStack.length).toBe(0);
    expect(engine.currentState.document.objects.length).toBe(2); // cmd1 + cmd3
  });

  it('should support batch commands', () => {
    engine.historyManager.beginBatch('create_triangle');
    const p1 = new CreatePointCommand(0, 0, 'p1');
    const p2 = new CreatePointCommand(10, 0, 'p2');
    
    engine.execute(p1);
    engine.execute(p2);
    engine.historyManager.endBatch();

    expect(engine.currentState.document.objects.length).toBe(2);
    expect(engine.historyManager.getSteps().length).toBe(1); // 1 batch command

    engine.undo();
    expect(engine.currentState.document.objects.length).toBe(0);

    engine.redo();
    expect(engine.currentState.document.objects.length).toBe(2);
  });

  it('should validate before execution', () => {
    // A polygon requires at least 3 points
    const cmd = new CreatePolygonCommand([{x: 0, y: 0}, {x: 1, y: 1}]);
    const result = engine.execute(cmd);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Polygon must have at least 3 points');
    expect(engine.currentState.document.objects.length).toBe(0);
  });

  it('Integration: sequence of commands -> undo all -> verify empty state', () => {
    // 1. Create Point A
    engine.execute(new CreatePointCommand(0, 0, 'A'));
    // 2. Create Point B
    engine.execute(new CreatePointCommand(10, 10, 'B'));
    
    // We can't easily import MovePointCommand and DeleteObjectCommand here without importing,
    // let's do more creates.
    engine.execute(new CreatePointCommand(20, 20, 'C'));
    
    engine.historyManager.beginBatch('triangle');
    engine.execute(new CreatePointCommand(5, 5, 'D'));
    engine.execute(new CreatePointCommand(15, 5, 'E'));
    engine.historyManager.endBatch();

    expect(engine.currentState.document.objects.length).toBe(5);
    
    // Undo all
    let canUndo = engine.undo();
    let undoCount = 1;
    while(canUndo && undoCount < 10) {
      canUndo = engine.undo();
      if (canUndo) undoCount++;
    }
    
    // We had 3 single commands + 1 batch = 4 steps in history.
    // So 4 undos should empty the state.
    expect(engine.currentState.document.objects.length).toBe(0);
    expect(engine.historyManager.undoStack.length).toBe(0);
    expect(engine.historyManager.redoStack.length).toBe(4);
  });

  it('Max history tests: should drop oldest commands when limit exceeded', () => {
    // Let's artificially set max history limit
    engine.historyManager.maxHistory = 10;
    
    // Execute 15 commands
    for (let i = 0; i < 15; i++) {
      engine.execute(new CreatePointCommand(i, i, `p${i}`));
    }
    
    // State should have 15 objects
    expect(engine.currentState.document.objects.length).toBe(15);
    
    // Undo stack should have max 10
    expect(engine.historyManager.undoStack.length).toBe(10);
    
    // Undo all 10
    for (let i = 0; i < 10; i++) {
      engine.undo();
    }
    
    // Should still have 5 objects that cannot be undone
    expect(engine.currentState.document.objects.length).toBe(5);
    
    // 11th undo should return false
    expect(engine.undo()).toBe(false);
  });
});
