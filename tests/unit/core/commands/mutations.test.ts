import { describe, it, expect, beforeEach } from 'vitest';
import { CommandEngine } from '../../../../core/commands/CommandEngine';
import { CreatePointCommand } from '../../../../core/commands/primitives';
import { 
  MovePointCommand, 
  SetStyleCommand, 
  ToggleVisibilityCommand,
  ShowLabelCommand,
  HideLabelCommand
} from '../../../../core/commands/mutations';
import { DeleteObjectCommand } from '../../../../core/commands/deletions';
import { createCommandFromJSON } from '../../../../core/commands/factory';
import type { GeometryState } from '../../../../core/types/commands';
import { Point, Line } from '../../../../core/geometry/primitives/2d';

describe('Mutations and Deletions Commands', () => {
  let engine: CommandEngine;

  beforeEach(() => {
    const initialState: GeometryState = {
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
        objects: [
          new Point(0, 0, 'p1').toJSON(),
          new Point(10, 0, 'p2').toJSON(),
          new Point(5, 5, 'p3').toJSON()
        ]
      },
      selection: []
    };
    
    // add dependency manually for deletion test
    const lineObj = new Line({x: 0, y: 0}, {x: 1, y: 1}, 'l1').toJSON();
    lineObj.parents = ['p1', 'p2'];
    initialState.document.objects.push(lineObj);

    engine = new CommandEngine(initialState);
  });

  it('MovePointCommand should change coordinates', () => {
    const cmd = new MovePointCommand('p1', 100, 200);
    expect(engine.execute(cmd).valid).toBe(true);

    const p1 = engine.currentState.document.objects.find(o => o.id === 'p1')!;
    expect((p1.definition.coords as unknown as {x: number, y: number}).x).toBe(100);
    expect((p1.definition.coords as unknown as {x: number, y: number}).y).toBe(200);

    engine.undo();
    const p1Undo = engine.currentState.document.objects.find(o => o.id === 'p1')!;
    expect((p1Undo.definition.coords as unknown as {x: number, y: number}).x).toBe(0);
    expect((p1Undo.definition.coords as unknown as {x: number, y: number}).y).toBe(0);
  });

  it('MovePointCommand on non-point should fail validation', () => {
    const cmd = new MovePointCommand('l1', 100, 200);
    const result = engine.execute(cmd);
    expect(result.valid).toBe(false);
  });

  it('SetStyleCommand should merge style config', () => {
    const cmd = new SetStyleCommand('p1', { color: 'red', strokeWidth: 2 });
    engine.execute(cmd);
    
    const p1 = engine.currentState.document.objects.find(o => o.id === 'p1')!;
    expect(p1.style?.color).toBe('red');
    expect(p1.style?.strokeWidth).toBe(2);

    engine.undo();
    const p1Undo = engine.currentState.document.objects.find(o => o.id === 'p1')!;
    expect(p1Undo.style?.color).toBeUndefined();
  });

  it('ToggleVisibilityCommand should invert visible flag', () => {
    const cmd1 = new ToggleVisibilityCommand('p1'); // visible defaults to true if undefined, so becomes false
    engine.execute(cmd1);
    
    expect(engine.currentState.document.objects.find(o => o.id === 'p1')!.style?.visible).toBe(false);

    const cmd2 = new ToggleVisibilityCommand('p1'); // becomes true
    engine.execute(cmd2);
    expect(engine.currentState.document.objects.find(o => o.id === 'p1')!.style?.visible).toBe(true);
    
    engine.undo();
    expect(engine.currentState.document.objects.find(o => o.id === 'p1')!.style?.visible).toBe(false);
  });

  it('Show/Hide LabelCommand should mutate correctly', () => {
    const showCmd = new ShowLabelCommand('p1', 'Point A');
    engine.execute(showCmd);

    const p1 = engine.currentState.document.objects.find(o => o.id === 'p1')!;
    expect(p1.style?.showLabel).toBe(true);
    expect(p1.metadata?.label).toBe('Point A');

    const hideCmd = new HideLabelCommand('p1');
    engine.execute(hideCmd);
    const p1Hidden = engine.currentState.document.objects.find(o => o.id === 'p1')!;
    expect(p1Hidden.style?.showLabel).toBe(false);
  });

  it('DeleteObjectCommand should cascade delete children', () => {
    // line l1 depends on p1 and p2.
    const cmd = new DeleteObjectCommand('p1', true);
    engine.execute(cmd);

    // p1 and l1 should be gone
    const objects = engine.currentState.document.objects;
    expect(objects.find(o => o.id === 'p1')).toBeUndefined();
    expect(objects.find(o => o.id === 'l1')).toBeUndefined();
    // p2 and p3 still exist
    expect(objects.find(o => o.id === 'p2')).toBeDefined();

    // Undo should restore both!
    engine.undo();
    const undoneObjects = engine.currentState.document.objects;
    expect(undoneObjects.find(o => o.id === 'p1')).toBeDefined();
    expect(undoneObjects.find(o => o.id === 'l1')).toBeDefined();
  });

  it('DeleteObjectCommand without cascade should orphan children', () => {
    const cmd = new DeleteObjectCommand('p1', false);
    engine.execute(cmd);

    const objects = engine.currentState.document.objects;
    expect(objects.find(o => o.id === 'p1')).toBeUndefined();
    const l1 = objects.find(o => o.id === 'l1');
    expect(l1).toBeDefined();
    // parents should no longer include p1
    expect(l1!.parents).not.toContain('p1');
    expect(l1!.parents).toContain('p2');
  });
});

describe('Command JSON Serialization', () => {
  it('should serialize and deserialize primitive creation', () => {
    const cmd = new CreatePointCommand(1, 2, 'pt1');
    const json = cmd.toJSON();
    const restored = createCommandFromJSON(json);
    expect(restored.type).toBe('CREATE_POINT');
    expect((restored as CreatePointCommand).x).toBe(1);
    expect(restored.id).toBe(cmd.id);
  });

  it('should serialize and deserialize batch commands', () => {
    const p1 = new CreatePointCommand(0, 0);
    const p2 = new CreatePointCommand(10, 10);
    
    // Test implicitly through the batch parsing 
    const json = {
      type: 'BATCH_COMMAND',
      id: 'batch1',
      args: { label: 'My Batch' },
      commands: [p1.toJSON(), p2.toJSON()]
    };

    const restored = createCommandFromJSON(json) as unknown as { type: string, commands: { type: string }[] };
    expect(restored.type).toBe('BATCH_COMMAND');
    expect(restored.commands.length).toBe(2);
    expect(restored.commands[0].type).toBe('CREATE_POINT');
  });

  it('should restore mutation state if provided', () => {
    const cmd = new MovePointCommand('p1', 10, 10);
    cmd.execute({ document: { objects: [{ id: 'p1', type: 'point', definition: { coords: {x: 0, y: 0} } }] } } as unknown as GeometryState);
    
    const json = cmd.toJSON();
    const restored = createCommandFromJSON(json) as MovePointCommand;
    
    expect((restored as unknown as { previousStateMap: Map<string, unknown> }).previousStateMap.get('p1')).toBeDefined();
  });
});
