import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand } from '../../commands/primitives';

export class PointTool implements Tool {
  readonly id = 'point';

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    // If we click on empty space, we create a point
    // If we click on an existing point, we probably shouldn't create a point on top of it?
    // In GeoGebra, clicking creates a point. If near an object, it snaps or creates point on object.
    // For now, just create a point at mathPos.
    
    // Check if we hit an existing point, maybe we don't create one if we hit a point.
    // We will just create a new point anyway unless it's too close to another point.
    const newId = context.generateId('pt');
    const cmd = new CreatePointCommand(event.mathPos.x, event.mathPos.y, newId);
    context.executeCommand(cmd);
  }
}
