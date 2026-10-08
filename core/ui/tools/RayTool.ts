import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand } from '../../commands/primitives';
import { CreateConstructionCommand } from '../../commands/constructions';
import type { Coords2D } from '../../types/geometry';

export class RayTool implements Tool {
  readonly id = 'ray';
  private firstPointId: string | null = null;
  private tempPointId = 'temp_ray_p2';
  private tempRayId = 'temp_ray';

  onActivate(context: ToolContext): void {
    this.firstPointId = null;
  }

  onDeactivate(context: ToolContext): void {
    context.clearTempObjects();
    this.firstPointId = null;
  }

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    let clickedPointId = event.hitObjectId;

    if (!clickedPointId || context.getObject(clickedPointId)?.type !== 'point') {
      clickedPointId = context.generateId('pt');
      context.executeCommand(new CreatePointCommand(event.mathPos.x, event.mathPos.y, clickedPointId));
    }

    if (!this.firstPointId) {
      this.firstPointId = clickedPointId;
      this.updatePreview(event.mathPos, context);
    } else {
      if (this.firstPointId !== clickedPointId) {
        context.clearTempObjects();
        const cmd = new CreateConstructionCommand('ray', 'ray', [this.firstPointId, clickedPointId], context.generateId('ray'));
        context.executeCommand(cmd);
      }
      this.firstPointId = null;
    }
  }

  onMouseMove(event: ToolEvent, context: ToolContext): void {
    if (this.firstPointId) {
      this.updatePreview(event.mathPos, context);
    }
  }
  
  private updatePreview(mathPos: Coords2D, context: ToolContext) {
    if (!this.firstPointId) return;
    const p1 = context.getObject(this.firstPointId)?.definition.coords as Coords2D | undefined;
    if (!p1) return;
    
    if (Math.abs(p1.x - mathPos.x) < 0.001 && Math.abs(p1.y - mathPos.y) < 0.001) {
      return;
    }
    
    context.renderTempObject({
      id: this.tempPointId,
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: mathPos },
      style: { color: '#94a3b8' },
      metadata: { label: '' }
    });

    context.renderTempObject({
      id: this.tempRayId,
      type: 'ray',
      dimension: 2,
      definition: { kind: 'segment', p1, p2: mathPos },
      style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
    });
  }
}
