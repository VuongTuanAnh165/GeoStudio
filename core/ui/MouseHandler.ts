import type { GeometryRenderer } from '../types/renderer';
import type { Tool, ToolContext, ToolEvent } from './tools/Tool';
import type { GeometryCommand } from '../types/commands';
import type { GeometryObject } from '../types/geometry';

import type { SnapEngine, SnapSettings, SnapResult } from '../engine/SnapEngine';

export interface MouseHandlerContext {
  renderer: GeometryRenderer;
  executeCommand: (cmd: GeometryCommand) => void;
  getObject: (id: string) => GeometryObject | undefined;
  getObjects: () => GeometryObject[];
  generateId: (prefix: string) => string;
  selectObject: (id: string | null) => void;
  snapEngine?: SnapEngine;
  getSnapSettings?: () => SnapSettings;
  setSnapResult?: (result: SnapResult | null) => void;
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

  private createToolEventFromScreenPos(screenPos: {x: number, y: number}, nativeEvent?: any): ToolEvent {
    let mathPos = this.context.renderer.getMathPosition(screenPos);
    let hitObjectId = this.context.renderer.hitTest(screenPos);
    
    let snapResultOut;
    
    if (this.context.snapEngine && this.context.getSnapSettings) {
      const snapResult = this.context.snapEngine.snap(
        mathPos,
        this.context.getObjects(),
        this.context.getSnapSettings()
      );
      
      snapResultOut = snapResult.snapped ? snapResult : undefined;
      
      if (this.context.setSnapResult) {
        this.context.setSnapResult(snapResult.snapped ? snapResult : null);
      }
      
      if (snapResult.snapped) {
        mathPos = snapResult.pos;
        screenPos = this.context.renderer.getScreenPosition(mathPos);
        if (snapResult.snapType === 'point' && snapResult.targetIds && snapResult.targetIds.length > 0) {
          hitObjectId = snapResult.targetIds[0]!;
        } else if (snapResult.snapType === 'intersection' && snapResult.targetIds && snapResult.targetIds.length === 2) {
           hitObjectId = null;
        } else if (snapResult.snapType === 'midpoint' || snapResult.snapType === 'line' || snapResult.snapType === 'grid') {
           if (!hitObjectId && snapResult.targetIds && snapResult.targetIds.length > 0) {
             hitObjectId = snapResult.targetIds[0]!;
           }
        }
      }
    }
    
    return {
      mathPos,
      screenPos,
      hitObjectId,
      nativeEvent,
      snapResult: snapResultOut
    };
  }

  private createToolEvent(e: any): ToolEvent {
    // We can ask renderer to get math pos from event, then get screen pos from math pos
    let mathPos = this.context.renderer.getMathPositionFromEvent(e);
    let screenPos = this.context.renderer.getScreenPosition(mathPos);
    return this.createToolEventFromScreenPos(screenPos, e);
  }

  public handleIntent(intent: import('../types/input').InputIntent) {
    // 1. Calculate screen pos from normalized pos
    const container = document.getElementById('jxgbox');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const screenPos = {
      x: intent.position.x * rect.width,
      y: intent.position.y * rect.height
    };

    // 2. Handle non-tool intents like panning/zooming if needed
    // (For now, we map 'pan' directly to board navigation if needed, 
    // but the task says gesture engine -> input intent -> command engine. 
    // Usually pan is handled by JSXGraph native touch/mouse. For gesture, we might need a custom pan.)
    // Let's delegate 'pointer' and 'drag' to the active tool for now.
    
    if (intent.type === 'pan') {
      // Basic pan implementation via renderer's bounding box
      if (intent.action === 'down') {
        this.startPos = { ...screenPos };
      } else if (intent.action === 'move' && this.startPos) {
        const dx = screenPos.x - this.startPos.x;
        const dy = screenPos.y - this.startPos.y;
        this.startPos = { ...screenPos };
        
        // Convert screen pixels to math units
        const p1 = this.context.renderer.getMathPosition({ x: 0, y: 0 });
        const p2 = this.context.renderer.getMathPosition({ x: dx, y: dy });
        const mdx = p1.x - p2.x;
        const mdy = p1.y - p2.y;
        
        // Use an internal pan method or just move bounding box
        // @ts-ignore
        if (this.context.renderer.board) {
          // @ts-ignore
          const b = this.context.renderer.board;
          b.moveOrigin(screenPos.x, screenPos.y, true); // this might work, or change bounding box
        }
      } else if (intent.action === 'up') {
        this.startPos = null;
      }
      return;
    }

    // 3. Delegate standard interactions to tool
    if (!this.activeTool) return;
    const event = this.createToolEventFromScreenPos(screenPos);

    if (intent.action === 'down') {
      this.activeTool.onMouseDown?.(event, this.getToolContext());
    } else if (intent.action === 'move') {
      this.activeTool.onMouseMove?.(event, this.getToolContext());
    } else if (intent.action === 'up') {
      this.activeTool.onMouseUp?.(event, this.getToolContext());
    }
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

  private lastClickTime: number = 0;
  private lastClickObjectId: string | null = null;

  private onUp(e: any) {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    this.startPos = null;

    if (!this.activeTool || !this.activeTool.onMouseUp) return;
    const event = this.createToolEvent(e);

    // Double click detection
    const now = Date.now();
    if (now - this.lastClickTime < 300 && this.lastClickObjectId === event.hitObjectId) {
      if (event.hitObjectId) {
        window.dispatchEvent(new CustomEvent('geostudio:rename-object', {
          detail: { hitId: event.hitObjectId }
        }));
      }
      this.lastClickTime = 0;
      this.lastClickObjectId = null;
    } else {
      this.lastClickTime = now;
      this.lastClickObjectId = event.hitObjectId;
    }

    this.activeTool.onMouseUp(event, this.getToolContext());
  }
}
