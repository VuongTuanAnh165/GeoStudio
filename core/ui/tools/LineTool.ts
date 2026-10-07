import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand, CreateLineCommand } from '../../commands/primitives';
import type { Coords2D } from '../../types/geometry';

export class LineTool implements Tool {
  readonly id = 'line';
  private firstPointId: string | null = null;
  private tempPointId = 'temp_line_p2';
  private tempLineId = 'temp_line';

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
        const p1 = context.getObject(this.firstPointId)?.definition.coords as Coords2D;
        const p2 = event.mathPos;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const direction = { x: dx / length, y: dy / length };
        
        const cmd = new CreateLineCommand(p1, direction, context.generateId('line'));
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
    
    // Do not draw preview if the two points are exactly the same to avoid degenerate lines
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
      id: this.tempLineId,
      type: 'line',
      dimension: 2,
      definition: { kind: 'segment', p1, p2: mathPos },
      style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
    });
  }
}
