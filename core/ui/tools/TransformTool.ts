import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreateConstructionCommand } from '../../commands/constructions';
import type { GeometryObject } from '../../types/geometry';

export type TransformToolMode = 'translate' | 'rotate' | 'reflect' | 'homothety';

export class TransformTool implements Tool {
  readonly id: string;
  private targetObject: GeometryObject | null = null;
  private paramObjects: GeometryObject[] = [];

  constructor(public mode: TransformToolMode) {
    this.id = `transform_${mode}`;
  }

  onActivate(context: ToolContext): void {
    this.reset(context);
  }

  onDeactivate(context: ToolContext): void {
    this.reset(context);
  }

  private reset(context?: ToolContext): void {
    this.targetObject = null;
    this.paramObjects = [];
    context?.clearTempObjects();
  }

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    if (!event.hitObjectId) return;
    const hitObj = context.getObject(event.hitObjectId);
    if (!hitObj) return;

    if (!this.targetObject) {
      // First click selects the target object to be transformed
      this.targetObject = hitObj;
      context.selectObject(hitObj.id);
      return;
    }

    // Second (and subsequent) clicks select the parameters
    this.paramObjects.push(hitObj);

    this.checkAndExecute(context);
  }

  private checkAndExecute(context: ToolContext): void {
    if (!this.targetObject) return;
    const target = this.targetObject;

    switch (this.mode) {
      case 'translate': {
        const p1 = this.paramObjects[0];
        if (this.paramObjects.length === 1 && p1 && (p1.type === 'vector' || p1.type === 'segment')) {
          const parentIds = [target.id, p1.id];
          const cmd = new CreateConstructionCommand(target.type, 'transform', parentIds, context.generateId(target.type), {
            transformType: 'translation',
            sourceId: target.id
          });
          context.executeCommand(cmd);
          this.reset(context);
          context.selectObject(null);
        } else if (this.paramObjects.length === 2) {
          const parentIds = [target.id, ...this.paramObjects.map(o => o.id)];
          const cmd = new CreateConstructionCommand(target.type, 'transform', parentIds, context.generateId(target.type), {
            transformType: 'translation',
            sourceId: target.id
          });
          context.executeCommand(cmd);
          this.reset(context);
          context.selectObject(null);
        }
        break;
      }

      case 'rotate': {
        const center = this.paramObjects[0];
        if (center && (center.type === 'point' || this.paramObjects.length === 1)) {
          let angleDegrees = 45;
          if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
            const input = window.prompt('Angle of rotation (degrees):', '45');
            if (input !== null) {
              const parsed = parseFloat(input);
              if (!isNaN(parsed)) angleDegrees = parsed;
            }
          }
          const parentIds = [target.id, center.id];
          const cmd = new CreateConstructionCommand(target.type, 'transform', parentIds, context.generateId(target.type), {
            transformType: 'rotation',
            sourceId: target.id,
            angleDegrees,
            angle: (angleDegrees * Math.PI) / 180
          });
          context.executeCommand(cmd);
          this.reset(context);
          context.selectObject(null);
        }
        break;
      }

      case 'reflect': {
        const mirror = this.paramObjects[0];
        if (mirror) {
          if (['line', 'segment', 'ray', 'point'].includes(mirror.type)) {
            const parentIds = [target.id, mirror.id];
            const cmd = new CreateConstructionCommand(target.type, 'transform', parentIds, context.generateId(target.type), {
              transformType: 'reflection',
              sourceId: target.id
            });
            context.executeCommand(cmd);
            this.reset(context);
            context.selectObject(null);
          } else if (this.paramObjects.length === 2) {
            const parentIds = [target.id, ...this.paramObjects.map(o => o.id)];
            const cmd = new CreateConstructionCommand(target.type, 'transform', parentIds, context.generateId(target.type), {
              transformType: 'reflection',
              sourceId: target.id
            });
            context.executeCommand(cmd);
            this.reset(context);
            context.selectObject(null);
          }
        }
        break;
      }

      case 'homothety': {
        const center = this.paramObjects[0];
        if (center && (center.type === 'point' || this.paramObjects.length === 1)) {
          let ratio = 2;
          if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
            const input = window.prompt('Homothety ratio (k):', '2');
            if (input !== null) {
              const parsed = parseFloat(input);
              if (!isNaN(parsed)) ratio = parsed;
            }
          }
          const parentIds = [target.id, center.id];
          const cmd = new CreateConstructionCommand(target.type, 'transform', parentIds, context.generateId(target.type), {
            transformType: 'homothety',
            sourceId: target.id,
            ratio
          });
          context.executeCommand(cmd);
          this.reset(context);
          context.selectObject(null);
        }
        break;
      }
    }
  }
}
