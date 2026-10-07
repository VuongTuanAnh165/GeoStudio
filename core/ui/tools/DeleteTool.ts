import type { Tool, ToolContext, ToolEvent } from './Tool';
import { DeleteObjectCommand } from '../../commands/deletions';

export class DeleteTool implements Tool {
  readonly id = 'delete';

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    if (event.hitObjectId) {
      const cmd = new DeleteObjectCommand(event.hitObjectId);
      context.executeCommand(cmd);
    }
  }
}
