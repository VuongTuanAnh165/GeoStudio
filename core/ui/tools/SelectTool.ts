import type { Tool, ToolContext, ToolEvent } from './Tool';
import { MovePointCommand } from '../../commands/mutations';

export class SelectTool implements Tool {
  readonly id = 'select';
  
  private draggingObjectId: string | null = null;

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    if (event.hitObjectId) {
      const obj = context.getObject(event.hitObjectId);
      if (obj?.type === 'point') {
        this.draggingObjectId = event.hitObjectId;
      }
    }
  }

  onMouseMove(event: ToolEvent, context: ToolContext): void {
    if (this.draggingObjectId) {
      const obj = context.getObject(this.draggingObjectId);
      if (obj?.type === 'point') {
        // Dragging point creates a command. 
        // Note: To avoid flooding the history, a real implementation would
        // use a draft state or batch the moves. For now, we dispatch on drag.
        const cmd = new MovePointCommand(this.draggingObjectId, event.mathPos.x, event.mathPos.y);
        context.executeCommand(cmd);
      }
    }
  }

  onMouseUp(event: ToolEvent, context: ToolContext): void {
    this.draggingObjectId = null;
  }
}
