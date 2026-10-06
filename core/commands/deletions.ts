import type { GeometryCommand, GeometryState, ValidationResult } from '../types/commands';
import type { GeometryObject } from '../types/geometry';

export class DeleteObjectCommand implements GeometryCommand {
  id: string;
  type = 'DELETE_OBJECT';
  args: Record<string, unknown> = {};
  timestamp: number;
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script' = 'mouse';
  undoable = true;

  private deletedObjects: GeometryObject[] = [];

  constructor(public objectId: string, public cascade = true) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.args = { objectId, cascade };
  }

  execute(state: GeometryState): GeometryState {
    const objects = state.document.objects;
    const target = objects.find(o => o.id === this.objectId);
    if (!target) return state;

    const toDeleteIds = new Set<string>();
    toDeleteIds.add(this.objectId);

    if (this.cascade) {
      // Find all descendants
      let added = true;
      while (added) {
        added = false;
        for (const obj of objects) {
          if (!toDeleteIds.has(obj.id) && obj.parents?.some(p => toDeleteIds.has(p))) {
            toDeleteIds.add(obj.id);
            added = true;
          }
        }
      }
    }

    // Save deleted objects for undo
    this.deletedObjects = objects.filter(o => toDeleteIds.has(o.id));

    // For non-cascade, we would orphan children, but for now we'll just handle basic logic
    let remainingObjects = objects.filter(o => !toDeleteIds.has(o.id));

    if (!this.cascade) {
      // Orphan dependents (remove deleted ID from their parents list)
      remainingObjects = remainingObjects.map(o => {
        if (o.parents?.includes(this.objectId)) {
          return {
            ...o,
            parents: o.parents.filter(p => p !== this.objectId)
          };
        }
        return o;
      });
    }

    return {
      ...state,
      document: {
        ...state.document,
        objects: remainingObjects
      },
      selection: state.selection.filter(id => !toDeleteIds.has(id))
    };
  }

  undo(state: GeometryState): GeometryState {
    if (this.deletedObjects.length === 0) return state;

    return {
      ...state,
      document: {
        ...state.document,
        // Append all deleted objects back to the end
        objects: [...state.document.objects, ...this.deletedObjects]
      }
    };
  }

  validate(state: GeometryState): ValidationResult {
    const exists = state.document.objects.some(o => o.id === this.objectId);
    if (!exists) return { valid: false, error: `Object ${this.objectId} not found` };
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
      objectId: this.objectId,
      cascade: this.cascade,
      deletedObjects: this.deletedObjects
    };
  }
}
