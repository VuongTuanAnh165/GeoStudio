import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand, CreateTriangleCommand } from '../../commands/primitives';
import type { Coords2D } from '../../types/geometry';

export class TriangleTool implements Tool {
  readonly id = 'triangle';
  private pointIds: string[] = [];
  
  onActivate(context: ToolContext): void {
    this.pointIds = [];
  }

  onDeactivate(context: ToolContext): void {
    context.clearTempObjects();
    this.pointIds = [];
  }

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    let clickedPointId = event.hitObjectId;

    if (!clickedPointId || context.getObject(clickedPointId)?.type !== 'point') {
      clickedPointId = context.generateId('pt');
      context.executeCommand(new CreatePointCommand(event.mathPos.x, event.mathPos.y, clickedPointId));
    }

    this.pointIds.push(clickedPointId);

    if (this.pointIds.length === 3) {
      context.clearTempObjects();
      
      const p1 = context.getObject(this.pointIds[0]!)?.definition.coords as Coords2D;
      const p2 = context.getObject(this.pointIds[1]!)?.definition.coords as Coords2D;
      const p3 = context.getObject(this.pointIds[2]!)?.definition.coords as Coords2D;
      
      const cmd = new CreateTriangleCommand(p1, p2, p3, context.generateId('tri'));
      context.executeCommand(cmd);
      
      this.pointIds = [];
    } else {
      this.updatePreview(event.mathPos, context);
    }
  }

  onMouseMove(event: ToolEvent, context: ToolContext): void {
    if (this.pointIds.length > 0) {
      this.updatePreview(event.mathPos, context);
    }
  }

  private updatePreview(mathPos: Coords2D, context: ToolContext) {
    context.clearTempObjects();
    
    if (this.pointIds.length === 1) {
      const p1 = context.getObject(this.pointIds[0]!)?.definition.coords as Coords2D;
      if (p1) {
        context.renderTempObject({
          id: 'temp_tri_edge_1',
          type: 'segment',
          dimension: 2,
          definition: { kind: 'segment', p1, p2: mathPos },
          style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
        });
      }
    } else if (this.pointIds.length === 2) {
      const p1 = context.getObject(this.pointIds[0]!)?.definition.coords as Coords2D;
      const p2 = context.getObject(this.pointIds[1]!)?.definition.coords as Coords2D;
      
      if (p1 && p2) {
        context.renderTempObject({
          id: 'temp_tri_edge_1',
          type: 'segment',
          dimension: 2,
          definition: { kind: 'segment', p1, p2 },
          style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
        });
        context.renderTempObject({
          id: 'temp_tri_edge_2',
          type: 'segment',
          dimension: 2,
          definition: { kind: 'segment', p1: p2, p2: mathPos },
          style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
        });
        context.renderTempObject({
          id: 'temp_tri_edge_3',
          type: 'segment',
          dimension: 2,
          definition: { kind: 'segment', p1: mathPos, p2: p1 },
          style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
        });
      }
    }
    
    context.renderTempObject({
      id: 'temp_tri_p',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: mathPos },
      style: { color: '#94a3b8' },
      metadata: { label: '' }
    });
  }
}
