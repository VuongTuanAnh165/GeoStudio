import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreatePointCommand } from '../../commands/primitives';

import { CreateConstructionCommand } from '../../commands/constructions';

export class PointTool implements Tool {
  readonly id = 'point';

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    const newId = context.generateId('pt');
    
    if (event.snapResult && event.snapResult.snapped) {
      if (event.snapResult.snapType === 'intersection' && event.snapResult.targetIds?.length === 2) {
        const cmd = new CreateConstructionCommand('point', 'intersection', event.snapResult.targetIds, newId);
        context.executeCommand(cmd);
        return;
      }
      if (event.snapResult.snapType === 'midpoint' && event.snapResult.targetIds?.length === 1) {
        const cmd = new CreateConstructionCommand('point', 'midpoint', event.snapResult.targetIds, newId);
        context.executeCommand(cmd);
        return;
      }
      if (event.snapResult.snapType === 'line' && event.snapResult.targetIds?.length === 1) {
        const cmd = new CreateConstructionCommand('point', 'glider', event.snapResult.targetIds, newId, { coords: event.snapResult.pos });
        context.executeCommand(cmd);
        return;
      }
      // If snap to point or grid, we just create a point at that position, or handle point merge.
      // For now, if we snap to an existing point, we don't create a new one!
      if (event.snapResult.snapType === 'point') {
        // Select the point instead of creating a new one on top
        if (event.snapResult.targetIds && event.snapResult.targetIds.length > 0) {
          context.selectObject(event.snapResult.targetIds[0]!);
        }
        return;
      }
    }

    const cmd = new CreatePointCommand(event.mathPos.x, event.mathPos.y, newId);
    context.executeCommand(cmd);
  }
}
