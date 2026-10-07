import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand, CreateCircleCommand } from '../../commands/primitives';
import type { Coords2D } from '../../types/geometry';

export class CircleTool implements Tool {
  readonly id = 'circle';
  private centerId: string | null = null;
  private tempPointId = 'temp_circle_p2';
  private tempCircleId = 'temp_circle';

  onActivate(context: ToolContext): void {
    this.centerId = null;
  }

  onDeactivate(context: ToolContext): void {
    context.clearTempObjects();
    this.centerId = null;
  }

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    let clickedPointId = event.hitObjectId;

    if (!clickedPointId || context.getObject(clickedPointId)?.type !== 'point') {
      clickedPointId = context.generateId('pt');
      context.executeCommand(new CreatePointCommand(event.mathPos.x, event.mathPos.y, clickedPointId));
    }

    if (!this.centerId) {
      this.centerId = clickedPointId;
      this.updatePreview(event.mathPos, context);
    } else {
      if (this.centerId !== clickedPointId) {
        context.clearTempObjects();
        const center = context.getObject(this.centerId)?.definition.coords as Coords2D;
        const point = event.mathPos;
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        const cmd = new CreateCircleCommand(center, radius, context.generateId('circ'));
        context.executeCommand(cmd);
      }
      this.centerId = null;
    }
  }

  onMouseMove(event: ToolEvent, context: ToolContext): void {
    if (this.centerId) {
      this.updatePreview(event.mathPos, context);
    }
  }
  
  private updatePreview(mathPos: Coords2D, context: ToolContext) {
    if (!this.centerId) return;
    const center = context.getObject(this.centerId)?.definition.coords as Coords2D | undefined;
    if (!center) return;
    
    if (Math.abs(center.x - mathPos.x) < 0.001 && Math.abs(center.y - mathPos.y) < 0.001) {
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
      id: this.tempCircleId,
      type: 'circle',
      dimension: 2,
      definition: { kind: 'circle', center, point: mathPos },
      style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
    });
  }
}
