import type { GeometryObject, ConstructionNode } from '../../types/geometry';
import { defaultConstructionEvaluator } from './ConstructionEvaluator';

export class ConstructionGraph {
  private nodes: Map<string, ConstructionNode> = new Map();
  private isBatching = false;
  private dirtyQueue: Set<string> = new Set();
  
  // Custom Evaluator registry could be passed in or handled outside.
  // It takes a node and the graph, recalculates the node's geometry definition.
  public evaluator: (node: ConstructionNode, graph: ConstructionGraph) => void = defaultConstructionEvaluator;

  addNode(object: GeometryObject): void {
    if (this.nodes.has(object.id)) {
      throw new Error(`Node with id ${object.id} already exists`);
    }
    
    // Initialize node structure
    this.nodes.set(object.id, {
      id: object.id,
      object,
      parents: object.parents ? [...object.parents] : [],
      children: [],
      computeOrder: 0,
      isDirty: true,
      lastComputed: Date.now()
    });

    // If object comes with parents, register edges
    if (object.parents) {
      for (const parentId of object.parents) {
        if (!this.nodes.has(parentId)) {
          throw new Error(`Parent node ${parentId} does not exist`);
        }
        this.nodes.get(parentId)!.children.push(object.id);
      }
    }
    
    // Mark dirty will trigger recalculation if not batching
    this.markDirty(object.id);
  }

  removeNode(id: string, cascade = true): void {
    const node = this.nodes.get(id);
    if (!node) return;

    if (cascade) {
      // Create a copy of children because removeNode will modify it
      const children = [...node.children];
      for (const childId of children) {
        this.removeNode(childId, true);
      }
    } else {
      // Orphan dependents
      for (const childId of node.children) {
        const child = this.nodes.get(childId);
        if (child) {
          child.parents = child.parents.filter(p => p !== id);
          if (child.object.parents) {
            child.object.parents = child.object.parents.filter(p => p !== id);
          }
          this.markDirty(childId);
        }
      }
    }

    // Remove from parents
    for (const parentId of node.parents) {
      const parent = this.nodes.get(parentId);
      if (parent) {
        parent.children = parent.children.filter(c => c !== id);
      }
    }

    this.nodes.delete(id);
    this.dirtyQueue.delete(id);
  }

  addEdge(parentId: string, childId: string): void {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);
    if (!parent || !child) throw new Error('Node not found');

    if (this.wouldCreateCycle(parentId, childId)) {
      throw new Error('Adding this edge would create a cycle');
    }

    if (!child.parents.includes(parentId)) {
      child.parents.push(parentId);
    }
    if (!parent.children.includes(childId)) {
      parent.children.push(childId);
    }
    
    // Also update the object itself
    if (!child.object.parents) child.object.parents = [];
    if (!child.object.parents.includes(parentId)) {
      child.object.parents.push(parentId);
    }

    this.markDirty(childId);
  }

  private wouldCreateCycle(parentId: string, childId: string): boolean {
    // If we add an edge parent -> child, a cycle is created if parent is reachable from child
    if (parentId === childId) return true;
    const descendants = this.getDependants(childId);
    return descendants.includes(parentId);
  }

  getDependants(id: string): string[] {
    const node = this.nodes.get(id);
    if (!node) return [];
    
    const result: string[] = [];
    const queue = [...node.children];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current)) {
        visited.add(current);
        result.push(current);
        const currNode = this.nodes.get(current);
        if (currNode) {
          queue.push(...currNode.children);
        }
      }
    }
    return result;
  }

  getParents(id: string): string[] {
    const node = this.nodes.get(id);
    if (!node) return [];
    
    const result: string[] = [];
    const queue = [...node.parents];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current)) {
        visited.add(current);
        result.push(current);
        const currNode = this.nodes.get(current);
        if (currNode) {
          queue.push(...currNode.parents);
        }
      }
    }
    return result;
  }

  markDirty(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    const queue = [id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!visited.has(currentId)) {
        visited.add(currentId);
        const currNode = this.nodes.get(currentId);
        if (currNode) {
          currNode.isDirty = true;
          this.dirtyQueue.add(currentId);
          queue.push(...currNode.children);
        }
      }
    }

    if (!this.isBatching) {
      this.recalculate();
    }
  }

  batch(fn: () => void): void {
    const prevBatching = this.isBatching;
    this.isBatching = true;
    try {
      fn();
    } finally {
      this.isBatching = prevBatching;
      if (!this.isBatching) {
        this.recalculate();
      }
    }
  }

  recalculate(): void {
    if (this.dirtyQueue.size === 0) return;

    // Kahn's algorithm for topological sorting of dirty nodes
    const inDegree = new Map<string, number>();
    const subGraph = new Map<string, string[]>(); // node -> children
    const dirtyArray = Array.from(this.dirtyQueue);

    // Initialize subgraph
    for (const id of dirtyArray) {
      inDegree.set(id, 0);
      subGraph.set(id, []);
    }

    // Build subgraph edges for dirty nodes only
    for (const id of dirtyArray) {
      const node = this.nodes.get(id);
      if (node) {
        for (const childId of node.children) {
          if (this.dirtyQueue.has(childId)) {
            subGraph.get(id)!.push(childId);
            inDegree.set(childId, inDegree.get(childId)! + 1);
          }
        }
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    let sortIndex = 0;
    const sorted: string[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      sorted.push(id);
      
      const node = this.nodes.get(id);
      if (node) {
        node.computeOrder = sortIndex++;
      }

      for (const childId of subGraph.get(id)!) {
        const degree = inDegree.get(childId)! - 1;
        inDegree.set(childId, degree);
        if (degree === 0) {
          queue.push(childId);
        }
      }
    }

    if (sorted.length !== dirtyArray.length) {
      throw new Error('Cycle detected in dirty nodes during recalculation');
    }

    // Evaluate in topological order
    for (const id of sorted) {
      const node = this.nodes.get(id);
      if (node) {
        if (this.evaluator) {
          this.evaluator(node, this);
        }
        node.isDirty = false;
        node.lastComputed = Date.now();
      }
    }

    this.dirtyQueue.clear();
  }

  getNode(id: string): ConstructionNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): ConstructionNode[] {
    return Array.from(this.nodes.values());
  }

  clear(): void {
    this.nodes.clear();
    this.dirtyQueue.clear();
  }
}
