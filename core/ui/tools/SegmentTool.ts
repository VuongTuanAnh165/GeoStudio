import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand, CreateSegmentCommand } from '../../commands/primitives';
import type { Coords2D } from '../../types/geometry';

export class SegmentTool implements Tool {
  readonly id = 'segment';
  private firstPointId: string | null = null;
  private tempPointId = 'temp_segment_p2';
  private tempSegmentId = 'temp_segment';

  onActivate(context: ToolContext): void {
    this.firstPointId = null;
  }

  onDeactivate(context: ToolContext): void {
    context.clearTempObjects();
    this.firstPointId = null;
  }

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    let clickedPointId = event.hitObjectId;

    // If click on empty space or non-point, create a point first
    if (!clickedPointId || context.getObject(clickedPointId)?.type !== 'point') {
      clickedPointId = context.generateId('pt');
      context.executeCommand(new CreatePointCommand(event.mathPos.x, event.mathPos.y, clickedPointId));
    }

    if (!this.firstPointId) {
      this.firstPointId = clickedPointId;
      // Initialize preview
      this.updatePreview(event.mathPos, context);
    } else {
      // Second click
      if (this.firstPointId !== clickedPointId) {
        context.clearTempObjects();
        const p1 = context.getObject(this.firstPointId)?.definition.coords as Coords2D;
        const p2 = event.mathPos; // Or getObject(clickedPointId).definition.coords
        const cmd = new CreateSegmentCommand(p1, p2, context.generateId('seg'));
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
    
    context.renderTempObject({
      id: this.tempPointId,
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: mathPos },
      style: { color: '#94a3b8' },
      metadata: { label: '' }
    });

    context.renderTempObject({
      id: this.tempSegmentId,
      type: 'segment',
      dimension: 2,
      definition: { kind: 'segment', p1, p2: mathPos },
      style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
    });
  }
}
