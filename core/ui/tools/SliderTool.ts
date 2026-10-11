import type { Tool, ToolContext, ToolEvent } from './Tool';
import { CreateSliderCommand } from '../../commands/primitives';

export class SliderTool implements Tool {
  readonly id = 'slider';

  onMouseDown(event: ToolEvent, context: ToolContext): void {
    const id = context.generateId('sld');
    const x = event.mathPos.x;
    const y = event.mathPos.y;

    const p1 = { x: Number((x - 2).toFixed(2)), y: Number(y.toFixed(2)) };
    const p2 = { x: Number((x + 2).toFixed(2)), y: Number(y.toFixed(2)) };

    const cmd = new CreateSliderCommand(
      undefined, // auto-generate name like 'a', 'b', 'r', etc.
      0,         // min
      10,        // max
      5,         // initial value
      0.1,       // step
      p1,
      p2,
      id
    );

    context.executeCommand(cmd);
    context.selectObject(id);
  }
}
