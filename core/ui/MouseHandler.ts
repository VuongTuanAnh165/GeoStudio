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
  selectObject: (id: string | null) => void;
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
      selectObject: this.context.selectObject,
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

  private longPressTimeout: any = null;
  private startPos: { x: number, y: number } | null = null;
  private readonly LONG_PRESS_DURATION = 500;
  private readonly MOVE_THRESHOLD = 10; // pixels

  private onDown(e: any) {
    // Detect right click
    if (e.button === 2) {
      // Right click should trigger context menu, not normal tool action
      const event = this.createToolEvent(e);
      window.dispatchEvent(new CustomEvent('geostudio:context-menu', {
        detail: { clientX: e.clientX, clientY: e.clientY, hitId: event.hitObjectId }
      }));
      return;
    }

    // Start long-press detection for touch or pen
    if (e.type.startsWith('touch') || e.pointerType === 'touch' || e.pointerType === 'pen') {
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      
      this.startPos = { x: clientX, y: clientY };
      this.longPressTimeout = setTimeout(() => {
        const event = this.createToolEvent(e);
        window.dispatchEvent(new CustomEvent('geostudio:context-menu', {
          detail: { clientX, clientY, hitId: event.hitObjectId }
        }));
        this.longPressTimeout = null;
        this.startPos = null;
      }, this.LONG_PRESS_DURATION);
    }

    if (!this.activeTool || !this.activeTool.onMouseDown) return;
    const event = this.createToolEvent(e);
    this.activeTool.onMouseDown(event, this.getToolContext());
  }

  private onMove(e: any) {
    if (this.startPos) {
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      const dx = clientX - this.startPos.x;
      const dy = clientY - this.startPos.y;
      
      if (Math.sqrt(dx * dx + dy * dy) > this.MOVE_THRESHOLD) {
        if (this.longPressTimeout) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
        }
        this.startPos = null;
      }
    }

    if (!this.activeTool || !this.activeTool.onMouseMove) return;
    const event = this.createToolEvent(e);
    this.activeTool.onMouseMove(event, this.getToolContext());
  }

  private onUp(e: any) {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    this.startPos = null;

    if (!this.activeTool || !this.activeTool.onMouseUp) return;
    const event = this.createToolEvent(e);
    this.activeTool.onMouseUp(event, this.getToolContext());
  }
}
