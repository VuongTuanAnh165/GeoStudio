import type { GeometryCommand, GeometryState, ValidationResult } from '../types/commands';
import type { GeometryObject, GeometryObjectType } from '../types/geometry';
import { NameGenerator } from '../geometry/naming/NameGenerator';

export class CreateConstructionCommand implements GeometryCommand {
  id: string;
  type = 'CREATE_CONSTRUCTION';
  args: Record<string, unknown> = {};
  timestamp: number;
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script' = 'mouse';
  undoable = true;
  protected createdObjectId?: string;

  constructor(
    public objectType: GeometryObjectType,
    public constructionKind: string,
    public parentIds: string[],
    public objectId?: string,
    public extraDef?: Record<string, unknown>
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.args = { objectType, constructionKind, parentIds, objectId, extraDef };
  }

  execute(state: GeometryState): GeometryState {
    const newId = this.objectId || crypto.randomUUID();
    this.createdObjectId = newId;
    
    // Create the new constructed object
    const newObject: GeometryObject = {
      id: newId,
      type: this.objectType,
      dimension: 2,
      parents: [...this.parentIds],
      children: [],
      definition: {
        kind: this.constructionKind,
        ...(this.extraDef || {})
      },
      style: {
        visible: true,
        showLabel: this.objectType === 'point'
      },
      metadata: {}
    };

    if (this.constructionKind === 'transform') {
      const parent0 = state.document.objects.find(o => o.id === this.parentIds[0]);
      const parentLabel = (parent0?.metadata?.label as string) || '';
      if (parentLabel) {
        newObject.metadata!.label = `${parentLabel}'`;
      } else if (this.objectType === 'point') {
        newObject.metadata!.label = NameGenerator.getNextPointName(state);
      }
      if (this.extraDef?.label) {
        newObject.metadata!.label = String(this.extraDef.label);
      }
    } else if (this.objectType === 'point') {
      const specialKinds = ['midpoint', 'orthocenter', 'circumcenter', 'incenter', 'centroid'];
      if (specialKinds.includes(this.constructionKind)) {
        newObject.metadata!.label = NameGenerator.getSpecialPointName(
          state, 
          this.constructionKind as 'midpoint' | 'orthocenter' | 'circumcenter' | 'incenter' | 'centroid'
        );
      } else {
        newObject.metadata!.label = NameGenerator.getNextPointName(state);
      }
    }

    // Clone the objects array and update parents' children lists
    const updatedObjects = state.document.objects.map(obj => {
      if (this.parentIds.includes(obj.id)) {
        return {
          ...obj,
          children: [...(obj.children || []), newId]
        };
      }
      return obj;
    });

    updatedObjects.push(newObject);

    return {
      ...state,
      document: {
        ...state.document,
        objects: updatedObjects
      },
      selection: [newId]
    };
  }

  undo(state: GeometryState): GeometryState {
    const targetId = this.createdObjectId;
    if (!targetId) return state;
    
    // Remove the object and remove it from its parents' children lists
    const updatedObjects = state.document.objects
      .filter(obj => obj.id !== targetId)
      .map(obj => {
        if (this.parentIds.includes(obj.id) && obj.children?.includes(targetId)) {
          return {
            ...obj,
            children: obj.children.filter(childId => childId !== targetId)
          };
        }
        return obj;
      });

    return {
      ...state,
      document: {
        ...state.document,
        objects: updatedObjects
      },
      selection: state.selection.filter(id => id !== targetId)
    };
  }

  validate(state: GeometryState): ValidationResult {
    // Validate all parents exist
    for (const pid of this.parentIds) {
      if (!state.document.objects.find(o => o.id === pid)) {
        return { valid: false, error: `Parent object ${pid} not found.` };
      }
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
      createdObjectId: this.createdObjectId
    };
  }
}
