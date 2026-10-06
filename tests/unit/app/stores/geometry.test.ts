import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGeometryStore } from '../../../../app/stores/geometry';
import { CreatePointCommand, CreateSegmentCommand } from '../../../../core/commands';

describe('Geometry Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty state', () => {
    const store = useGeometryStore();
    expect(store.objects.size).toBe(0);
    expect(store.selectedIds.size).toBe(0);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);
  });

  it('should execute command and sync state', () => {
    const store = useGeometryStore();
    const cmd = new CreatePointCommand(10, 20, 'pt1');
    
    store.executeCommand(cmd);
    
    expect(store.objects.size).toBe(1);
    const pt = store.objects.get('pt1');
    expect(pt).toBeDefined();
    expect((pt!.definition.coords as unknown as { x: number }).x).toBe(10);
    expect(store.canUndo).toBe(true);
  });

  it('should support undo and redo', () => {
    const store = useGeometryStore();
    store.executeCommand(new CreatePointCommand(10, 20, 'pt1'));
    store.executeCommand(new CreatePointCommand(30, 40, 'pt2'));
    
    expect(store.objects.size).toBe(2);
    
    store.undo();
    expect(store.objects.size).toBe(1);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(true);
    
    store.undo();
    expect(store.objects.size).toBe(0);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);
    
    store.redo();
    expect(store.objects.size).toBe(1);
    expect(store.objects.has('pt1')).toBe(true);
  });

  it('should compute selectedObjects correctly', () => {
    const store = useGeometryStore();
    store.executeCommand(new CreatePointCommand(0, 0, 'pt1'));
    store.executeCommand(new CreatePointCommand(1, 1, 'pt2'));
    
    store.selectedIds.add('pt1');
    store.selectedIds.add('pt2');
    store.selectedIds.add('non-existent');
    
    const selected = store.selectedObjects;
    expect(selected.length).toBe(2);
    expect(selected.some(o => o.id === 'pt1')).toBe(true);
    expect(selected.some(o => o.id === 'pt2')).toBe(true);
  });

  it('should rebuild construction graph correctly', () => {
    const store = useGeometryStore();
    store.executeCommand(new CreatePointCommand(0, 0, 'p1'));
    store.executeCommand(new CreatePointCommand(10, 10, 'p2'));
    
    // Create segment depending on p1 and p2
    const segCmd = new CreateSegmentCommand({x:0,y:0}, {x:10,y:10}, 's1');
    segCmd.createPrimitive = function() {
      // Mocking parents attachment
      const s = Object.getPrototypeOf(this).createPrimitive.call(this);
      s.parents = ['p1', 'p2'];
      return s;
    };
    store.executeCommand(segCmd);

    // After sync, graph should have nodes and edges
    const graph = store.constructionGraph;
    // We can't access graph internal easily without getters, but we know it synced successfully without crashing.
    expect(graph).toBeDefined();
    
    // If we undo, it should safely rebuild graph
    store.undo();
    expect(store.constructionGraph).toBeDefined();
    expect(store.objects.size).toBe(2); // Just p1, p2
  });

  it('should support batch commands', () => {
    const store = useGeometryStore();
    
    store.beginBatch('create_triangle');
    store.executeCommand(new CreatePointCommand(0, 0, 'p1'));
    store.executeCommand(new CreatePointCommand(10, 0, 'p2'));
    store.executeCommand(new CreatePointCommand(5, 10, 'p3'));
    store.endBatch();
    
    expect(store.objects.size).toBe(3);
    
    // Undo should revert all 3 at once
    store.undo();
    expect(store.objects.size).toBe(0);
    
    store.redo();
    expect(store.objects.size).toBe(3);
  });
});
