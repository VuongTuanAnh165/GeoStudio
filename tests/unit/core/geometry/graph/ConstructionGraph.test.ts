import { describe, it, expect } from 'vitest';
import { ConstructionGraph } from '../../../../../core/geometry/graph/ConstructionGraph';
import { Point } from '../../../../../core/geometry/primitives/2d';

describe('ConstructionGraph', () => {
  it('should add and remove nodes', () => {
    const graph = new ConstructionGraph();
    const p1 = new Point(0, 0, 'p1');
    
    graph.addNode(p1);
    expect(graph.getNode('p1')).toBeDefined();
    expect(graph.getAllNodes().length).toBe(1);
    
    graph.removeNode('p1');
    expect(graph.getNode('p1')).toBeUndefined();
    expect(graph.getAllNodes().length).toBe(0);
  });

  it('should track dependencies via addNode with object.parents', () => {
    const graph = new ConstructionGraph();
    const p1 = new Point(0, 0, 'p1');
    const p2 = new Point(10, 0, 'p2');
    graph.addNode(p1);
    graph.addNode(p2);
    
    const p3 = new Point(5, 5, 'p3');
    p3.parents = ['p1', 'p2'];
    graph.addNode(p3);

    const dependants = graph.getDependants('p1');
    expect(dependants).toContain('p3');

    const parents = graph.getParents('p3');
    expect(parents).toContain('p1');
    expect(parents).toContain('p2');
  });

  it('should add explicit edges and detect cycle', () => {
    const graph = new ConstructionGraph();
    graph.addNode(new Point(0, 0, 'n1'));
    graph.addNode(new Point(0, 0, 'n2'));
    graph.addNode(new Point(0, 0, 'n3'));

    graph.addEdge('n1', 'n2');
    graph.addEdge('n2', 'n3');

    // Cycle detection
    expect(() => {
      graph.addEdge('n3', 'n1');
    }).toThrow('cycle');

    expect(graph.getDependants('n1')).toEqual(expect.arrayContaining(['n2', 'n3']));
  });

  it('should propagate dirty flags', () => {
    const graph = new ConstructionGraph();
    graph.addNode(new Point(0, 0, 'n1'));
    graph.addNode(new Point(0, 0, 'n2'));
    graph.addNode(new Point(0, 0, 'n3'));
    
    graph.batch(() => {
      graph.addEdge('n1', 'n2');
      graph.addEdge('n2', 'n3');
      
      // Clear initial dirty flags (addNode sets them dirty)
      graph.getNode('n1')!.isDirty = false;
      graph.getNode('n2')!.isDirty = false;
      graph.getNode('n3')!.isDirty = false;
      
      // Mark n1 dirty
      graph.markDirty('n1');
    });

    expect(graph.getNode('n1')?.isDirty).toBe(false); // recalculated
    expect(graph.getNode('n2')?.isDirty).toBe(false);
    expect(graph.getNode('n3')?.isDirty).toBe(false);
  });

  it('should evaluate in topological order', () => {
    const graph = new ConstructionGraph();
    graph.addNode(new Point(0, 0, 'n1'));
    graph.addNode(new Point(0, 0, 'n2'));
    graph.addNode(new Point(0, 0, 'n3'));
    graph.addNode(new Point(0, 0, 'n4'));

    graph.addEdge('n1', 'n2');
    graph.addEdge('n2', 'n4');
    graph.addEdge('n3', 'n4');
    
    const evaluationOrder: string[] = [];
    graph.evaluator = (node) => {
      evaluationOrder.push(node.id);
    };

    graph.batch(() => {
      graph.markDirty('n1');
      graph.markDirty('n3');
    }); // This triggers recalculate() at the end

    // n1 and n3 must be before n2 and n4. n2 must be before n4.
    expect(evaluationOrder.indexOf('n1')).toBeLessThan(evaluationOrder.indexOf('n2'));
    expect(evaluationOrder.indexOf('n2')).toBeLessThan(evaluationOrder.indexOf('n4'));
    expect(evaluationOrder.indexOf('n3')).toBeLessThan(evaluationOrder.indexOf('n4'));
  });

  it('should cascade delete', () => {
    const graph = new ConstructionGraph();
    graph.addNode(new Point(0, 0, 'p1'));
    graph.addNode(new Point(1, 1, 'p2'));
    
    const p3 = new Point(2, 2, 'p3');
    p3.parents = ['p1', 'p2'];
    graph.addNode(p3);

    const p4 = new Point(3, 3, 'p4');
    p4.parents = ['p3'];
    graph.addNode(p4);

    expect(graph.getAllNodes().length).toBe(4);

    // Remove p1 with cascade
    graph.removeNode('p1', true);
    
    expect(graph.getNode('p1')).toBeUndefined();
    expect(graph.getNode('p3')).toBeUndefined();
    expect(graph.getNode('p4')).toBeUndefined();
    expect(graph.getNode('p2')).toBeDefined(); // untouched
  });

  it('should orphan dependants if cascade is false', () => {
    const graph = new ConstructionGraph();
    graph.addNode(new Point(0, 0, 'p1'));
    
    const p2 = new Point(1, 1, 'p2');
    p2.parents = ['p1'];
    graph.addNode(p2);

    graph.removeNode('p1', false);
    
    expect(graph.getNode('p1')).toBeUndefined();
    
    const p2Node = graph.getNode('p2');
    expect(p2Node).toBeDefined();
    expect(p2Node?.parents).not.toContain('p1');
    expect(p2Node?.object.parents).not.toContain('p1');
  });

  it('should throw if adding a node with non-existent parent', () => {
    const graph = new ConstructionGraph();
    const p1 = new Point(0, 0, 'p1');
    p1.parents = ['not-exist'];
    
    expect(() => {
      graph.addNode(p1);
    }).toThrow('does not exist');
  });

  it('benchmark: should topological sort 500 nodes under 50ms', () => {
    const graph = new ConstructionGraph();
    graph.batch(() => {
      // Create a linear dependency chain of 500 nodes
      graph.addNode(new Point(0, 0, 'node_0'));
      for (let i = 1; i < 500; i++) {
        const pt = new Point(i, i, `node_${i}`);
        pt.parents = [`node_${i - 1}`];
        graph.addNode(pt);
      }
    });

    const startTime = performance.now();
    // Force a dirty recalculation
    graph.batch(() => {
      graph.markDirty('node_0');
    });
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(50); // should be almost instant (1-5ms)
  });
});
