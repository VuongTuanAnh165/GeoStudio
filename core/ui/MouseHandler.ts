import type { GeometryRenderer } from '../types/renderer';
import type { Tool, ToolContext, ToolEvent } from './tools/Tool';
import type { GeometryCommand } from '../types/commands';
import type { GeometryObject } from '../types/geometry';

export interface MouseHandlerContext {
  renderer: GeometryRenderer;
  executeCommand: (cmd: GeometryCommand) => void;
  getObject: (id: string) => GeometryObject | undefined;
  getObjects: () => GeometryObject[];
  generateId: (prefix: string) => string;
}

export class MouseHandler {
  private activeTool: Tool | null = null;
  private tempObjects = new Map<string, GeometryObject>();
  
  constructor(private context: MouseHandlerContext) {
    this.context.renderer.on('down', this.onDown.bind(this));
    this.context.renderer.on('move', this.onMove.bind(this));
    this.context.renderer.on('up', this.onUp.bind(this));
  }

  setActiveTool(tool: Tool | null) {
    if (this.activeTool && this.activeTool.onDeactivate) {
      this.activeTool.onDeactivate(this.getToolContext());
    }
    this.activeTool = tool;
    if (this.activeTool && this.activeTool.onActivate) {
      this.activeTool.onActivate(this.getToolContext());
    }
  }

  private getToolContext(): ToolContext {
    return {
      executeCommand: this.context.executeCommand,
      getObject: this.context.getObject,
      getObjects: this.context.getObjects,
      generateId: this.context.generateId,
      renderTempObject: (obj: GeometryObject) => {
        this.tempObjects.set(obj.id, obj);
        this.context.renderer.renderObject(obj);
      },
      removeTempObject: (id: string) => {
        this.tempObjects.delete(id);
        this.context.renderer.removeObject(id);
      },
      clearTempObjects: () => {
        for (const id of this.tempObjects.keys()) {
          this.context.renderer.removeObject(id);
        }
        this.tempObjects.clear();
      }
    };
  }

  private createToolEvent(e: any): ToolEvent {
    const mathPos = this.context.renderer.getMathPositionFromEvent(e);
    const screenPos = this.context.renderer.getScreenPosition(mathPos);
    const hitObjectId = this.context.renderer.hitTest(screenPos);
    
    return {
      mathPos,
      screenPos,
      hitObjectId,
      nativeEvent: e
    };
  }

  private onDown(e: any) {
    if (!this.activeTool || !this.activeTool.onMouseDown) return;
    const event = this.createToolEvent(e);
    this.activeTool.onMouseDown(event, this.getToolContext());
  }

  private onMove(e: any) {
    if (!this.activeTool || !this.activeTool.onMouseMove) return;
    const event = this.createToolEvent(e);
    this.activeTool.onMouseMove(event, this.getToolContext());
  }

  private onUp(e: any) {
    if (!this.activeTool || !this.activeTool.onMouseUp) return;
    const event = this.createToolEvent(e);
    this.activeTool.onMouseUp(event, this.getToolContext());
  }
}
