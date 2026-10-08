import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand } from '../../commands/primitives';
import { CreateConstructionCommand } from '../../commands/constructions';
import type { Coords2D } from '../../types/geometry';

export class PolygonTool implements Tool {
  readonly id = 'polygon';
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

    if (this.pointIds.length > 2 && clickedPointId === this.pointIds[0]!) {
      // Close polygon
      context.clearTempObjects();
      
      const cmd = new CreateConstructionCommand('polygon', 'polygon', this.pointIds, context.generateId('poly'));
      context.executeCommand(cmd);
      
      this.pointIds = [];
    } else {
      this.pointIds.push(clickedPointId);
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
    
    for (let i = 0; i < this.pointIds.length - 1; i++) {
      const p1 = context.getObject(this.pointIds[i]!)?.definition.coords as Coords2D;
      const p2 = context.getObject(this.pointIds[i+1]!)?.definition.coords as Coords2D;
      if (p1 && p2) {
        context.renderTempObject({
          id: `temp_poly_edge_${i}`,
          type: 'segment',
          dimension: 2,
          definition: { kind: 'segment', p1, p2 },
          style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
        });
      }
    }
    
    const lastP = context.getObject(this.pointIds[this.pointIds.length - 1]!)?.definition.coords as Coords2D;
    if (lastP) {
      context.renderTempObject({
        id: 'temp_poly_edge_cursor',
        type: 'segment',
        dimension: 2,
        definition: { kind: 'segment', p1: lastP, p2: mathPos },
        style: { color: '#94a3b8', strokeWidth: 2, showLabel: false }
      });
    }
    
    context.renderTempObject({
      id: 'temp_poly_p',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: mathPos },
      style: { color: '#94a3b8' },
      metadata: { label: '' }
    });
  }
}
