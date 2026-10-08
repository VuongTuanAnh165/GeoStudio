import type { GeometryCommand, GeometryState, ValidationResult } from '../types/commands';
import type { GeometryObject } from '../types/geometry';

export abstract class BaseMutationCommand implements GeometryCommand {
  id: string;
  type = 'MUTATE_OBJECT';
  args: Record<string, unknown> = {};
  timestamp: number;
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script' = 'mouse';
  undoable = true;

  protected previousStateMap: Map<string, GeometryObject> = new Map();

  constructor(public objectId: string) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
  }

  abstract mutate(obj: GeometryObject): GeometryObject;

  execute(state: GeometryState): GeometryState {
    const obj = state.document.objects.find(o => o.id === this.objectId);
    if (!obj) return state; // Should be caught by validate

    // Save previous state for undo
    this.previousStateMap.set(this.objectId, JSON.parse(JSON.stringify(obj)));

    const mutated = this.mutate(JSON.parse(JSON.stringify(obj)));

    return {
      ...state,
      document: {
        ...state.document,
        objects: state.document.objects.map(o => o.id === this.objectId ? mutated : o)
      }
    };
  }

  undo(state: GeometryState): GeometryState {
    const previous = this.previousStateMap.get(this.objectId);
    if (!previous) return state;

    return {
      ...state,
      document: {
        ...state.document,
        objects: state.document.objects.map(o => o.id === this.objectId ? previous : o)
      }
    };
  }

  validate(state: GeometryState): ValidationResult {
    const obj = state.document.objects.find(o => o.id === this.objectId);
    if (!obj) return { valid: false, error: `Object ${this.objectId} not found` };
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
      previousState: this.previousStateMap.get(this.objectId)
    };
  }
}

export class MovePointCommand extends BaseMutationCommand {
  override type = 'MOVE_POINT';

  constructor(objectId: string, public newX: number, public newY: number) {
    super(objectId);
    this.args = { newX, newY };
  }

  override mutate(obj: GeometryObject): GeometryObject {
    if (obj.type !== 'point') {
      throw new Error('Can only move points');
    }
    obj.definition.coords = { x: this.newX, y: this.newY };
    return obj;
  }

  override validate(state: GeometryState): ValidationResult {
    const v = super.validate(state);
    if (!v.valid) return v;
    
    const obj = state.document.objects.find(o => o.id === this.objectId);
    if (obj?.type !== 'point') return { valid: false, error: `Object ${this.objectId} is not a point` };
    
    return { valid: true };
  }
}

export class SetStyleCommand extends BaseMutationCommand {
  override type = 'SET_STYLE';

  constructor(objectId: string, public styleConfig: Record<string, unknown>) {
    super(objectId);
    this.args = { styleConfig };
  }

  override mutate(obj: GeometryObject): GeometryObject {
    obj.style = { ...obj.style, ...this.styleConfig };
    return obj;
  }
}

export class ToggleVisibilityCommand extends BaseMutationCommand {
  override type = 'TOGGLE_VISIBILITY';

  override mutate(obj: GeometryObject): GeometryObject {
    obj.style = obj.style || {};
    obj.style.visible = obj.style.visible === false ? true : false;
    this.args = { visible: obj.style.visible };
    return obj;
  }
}

export class ShowLabelCommand extends BaseMutationCommand {
  override type = 'SHOW_LABEL';

  constructor(objectId: string, public label?: string) {
    super(objectId);
    this.args = { label };
  }

  override mutate(obj: GeometryObject): GeometryObject {
    obj.style = obj.style || {};
    obj.style.showLabel = true;
    if (this.label !== undefined) {
      obj.metadata = obj.metadata || {};
      obj.metadata.label = this.label;
    }
    return obj;
  }
}

export class HideLabelCommand extends BaseMutationCommand {
  override type = 'HIDE_LABEL';

  override mutate(obj: GeometryObject): GeometryObject {
    obj.style = obj.style || {};
    obj.style.showLabel = false;
    return obj;
  }
}

export class RenameObjectCommand extends BaseMutationCommand {
  override type = 'RENAME_OBJECT';

  constructor(objectId: string, public newLabel: string) {
    super(objectId);
    this.args = { newLabel };
  }

  override mutate(obj: GeometryObject): GeometryObject {
    // In execute we might want to resolve collisions, but mutate runs purely.
    // Collision resolution should happen in execute or validate.
    // We'll let the UI handle collisions before creating the command or we can do a naive replace here.
    obj.metadata = obj.metadata || {};
    obj.metadata.label = this.newLabel;
    obj.style = obj.style || {};
    obj.style.showLabel = true;
    return obj;
  }
}

