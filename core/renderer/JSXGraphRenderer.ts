import type { GeometryRenderer } from '../types/renderer';
import type { GeometryObject, Coords2D } from '../types/geometry';
import JXG from 'jsxgraph';

export class JSXGraphRenderer implements GeometryRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private board: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jxgObjects: Map<string, any> = new Map();

  init(container: string | HTMLElement): void {
    // Determine the container id
    const containerId = typeof container === 'string' ? container : container.id;
    
    // Initialize the board
    this.board = JXG.JSXGraph.initBoard(containerId, {
      boundingbox: [-10, 10, 10, -10],
      axis: true,
      grid: true,
      showCopyright: false,
      showNavigation: false,
      pan: { enabled: true, needShift: false },
      zoom: { wheel: true }
    });
  }

  clear(): void {
    if (this.board) {
      JXG.JSXGraph.freeBoard(this.board);
      this.jxgObjects.clear();
      this.board = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getStyleAttributes(obj: GeometryObject): Record<string, any> {
    const defaultAttrs = {
      name: obj.metadata?.label || '',
      withLabel: obj.style?.showLabel === true,
      visible: obj.style?.visible !== false,
      strokeColor: obj.style?.color || '#0000ff',
      strokeWidth: obj.style?.strokeWidth || 2,
      fixed: true // We will handle moving via our CommandEngine, so JSXGraph elements are "fixed" visually from its own dragging logic, or we let it drag but intercept? 
      // Actually, if we let JSXGraph drag it, it updates its internal state. We might want to disable internal dragging or sync it.
      // For Phase 3, we usually let our MouseHandler handle dragging, so JSXGraph elements should be pointer-events target but NOT internally dragged by JSXGraph physics to prevent state desync.
      // Wait, JXG points can be dragged by default. Let's make them fixed so our MouseHandler controls everything, or we use JSXGraph's drag events. 
      // plan.md says: `MouseHandler` class -> Drag -> move object. This implies we handle drag manually. So elements should not be draggable by JSXGraph.
    };
    
    // Merge explicit overrides
    return { ...defaultAttrs, fixed: true };
  }

  renderObject(obj: GeometryObject): void {
    if (!this.board) return;
    if (this.jxgObjects.has(obj.id)) {
      this.updateObject(obj.id, obj);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jxgEl: any;
    const attrs = this.getStyleAttributes(obj);
    attrs.id = obj.id; // Assign ID to find it later in hit tests

    try {
      switch (obj.type) {
        case 'point': {
          const coords = obj.definition.coords as Coords2D;
          jxgEl = this.board.create('point', [coords.x, coords.y], { ...attrs, size: 4, fillColor: attrs.strokeColor });
          break;
        }
        case 'segment': {
          const p1 = obj.definition.p1 as Coords2D;
          const p2 = obj.definition.p2 as Coords2D;
          jxgEl = this.board.create('segment', [[p1.x, p1.y], [p2.x, p2.y]], attrs);
          break;
        }
        case 'line': {
          const p = obj.definition.point as Coords2D;
          const d = obj.definition.direction as Coords2D;
          // Line from point and direction. We can create it using two points
          const p2 = { x: p.x + d.x, y: p.y + d.y };
          jxgEl = this.board.create('line', [[p.x, p.y], [p2.x, p2.y]], attrs);
          break;
        }
        case 'ray': {
          const o = obj.definition.origin as Coords2D;
          const d = obj.definition.direction as Coords2D;
          const p2 = { x: o.x + d.x, y: o.y + d.y };
          jxgEl = this.board.create('line', [[o.x, o.y], [p2.x, p2.y]], { ...attrs, straightFirst: false, straightLast: true });
          break;
        }
        case 'circle': {
          const c = obj.definition.center as Coords2D;
          const r = obj.definition.radius as number;
          // JSXGraph creates circle from center point and a point on circle, or center and radius.
          // By passing center coords and radius:
          jxgEl = this.board.create('circle', [[c.x, c.y], r], attrs);
          break;
        }
        case 'polygon': {
          const points = obj.definition.points as Coords2D[];
          const coordArrays = points.map(p => [p.x, p.y]);
          jxgEl = this.board.create('polygon', coordArrays, { ...attrs, hasInnerPoints: true });
          break;
        }
      }

      if (jxgEl) {
        this.jxgObjects.set(obj.id, jxgEl);
      }
    } catch (e) {
      console.error(`Failed to render object ${obj.id}:`, e);
    }
  }

  removeObject(id: string): void {
    if (!this.board) return;
    const jxgEl = this.jxgObjects.get(id);
    if (jxgEl) {
      this.board.removeObject(jxgEl);
      this.jxgObjects.delete(id);
    }
  }

  updateObject(id: string, obj: GeometryObject): void {
    if (!this.board) return;
    const jxgEl = this.jxgObjects.get(id);
    
    if (!jxgEl) {
      this.renderObject(obj);
      return;
    }

    // Update style attributes
    const attrs = this.getStyleAttributes(obj);
    for (const [key, val] of Object.entries(attrs)) {
      jxgEl.setAttribute({ [key]: val });
    }

    // Update coordinates based on type
    switch (obj.type) {
      case 'point': {
        const coords = obj.definition.coords as Coords2D;
        jxgEl.setPosition(JXG.COORDS_BY_USER, [coords.x, coords.y]);
        break;
      }
      case 'segment': {
        const p1 = obj.definition.p1 as Coords2D;
        const p2 = obj.definition.p2 as Coords2D;
        // JSXGraph segment points are usually jxgEl.point1 and jxgEl.point2
        jxgEl.point1.setPosition(JXG.COORDS_BY_USER, [p1.x, p1.y]);
        jxgEl.point2.setPosition(JXG.COORDS_BY_USER, [p2.x, p2.y]);
        break;
      }
      case 'line':
      case 'ray': {
        const p = obj.type === 'ray' ? obj.definition.origin as Coords2D : obj.definition.point as Coords2D;
        const d = obj.definition.direction as Coords2D;
        const p2 = { x: p.x + d.x, y: p.y + d.y };
        jxgEl.point1.setPosition(JXG.COORDS_BY_USER, [p.x, p.y]);
        jxgEl.point2.setPosition(JXG.COORDS_BY_USER, [p2.x, p2.y]);
        break;
      }
      case 'circle': {
        const c = obj.definition.center as Coords2D;
        const r = obj.definition.radius as number;
        jxgEl.center.setPosition(JXG.COORDS_BY_USER, [c.x, c.y]);
        jxgEl.setRadius(r);
        break;
      }
      case 'polygon': {
        const points = obj.definition.points as Coords2D[];
        for (let i = 0; i < points.length; i++) {
          if (jxgEl.vertices[i]) {
            jxgEl.vertices[i].setPosition(JXG.COORDS_BY_USER, [points[i]!.x, points[i]!.y]);
          }
        }
        break;
      }
    }
    
    this.board.update();
  }

  hitTest(screenPos: Coords2D): string | null {
    if (!this.board) return null;
    
    let hitId: string | null = null;
    
    // JSXGraph usually stores elements in board.objects
    // But we have our map, we can iterate to see which one contains the mouse
    for (const [id, jxgEl] of this.jxgObjects.entries()) {
      if (jxgEl.hasPoint && jxgEl.hasPoint(screenPos.x, screenPos.y)) {
        hitId = id;
        // Prioritize points over lines/polygons
        if (jxgEl.elType === 'point') {
          return id;
        }
      }
    }
    
    return hitId;
  }

  getRenderedIds(): string[] {
    return Array.from(this.jxgObjects.keys());
  }

  getScreenPosition(mathPos: Coords2D): Coords2D {
    if (!this.board) return { x: 0, y: 0 };
    // JSXGraph uses coords object
    const coords = new JXG.Coords(JXG.COORDS_BY_USER, [mathPos.x, mathPos.y], this.board);
    return { x: coords.scrCoords[1], y: coords.scrCoords[2] };
  }

  getMathPosition(screenPos: Coords2D): Coords2D {
    if (!this.board) return { x: 0, y: 0 };
    const coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [screenPos.x, screenPos.y], this.board);
    return { x: coords.usrCoords[1], y: coords.usrCoords[2] };
  }

  getMathPositionFromEvent(event: any): Coords2D {
    if (!this.board) return { x: 0, y: 0 };
    const coords = this.board.getUsrCoordsOfMouse(event);
    return { x: coords[0], y: coords[1] };
  }

  setGridVisible(visible: boolean): void {
    if (!this.board) return;
    // For JSXGraph, we can toggle the major/minor grids if they exist
    // Usually board.grids is an array of grid objects
    if (this.board.grids) {
      for (const grid of this.board.grids) {
        if (visible) {
          grid.show();
        } else {
          grid.hide();
        }
      }
      this.board.update();
    }
  }

  setAxisVisible(visible: boolean): void {
    if (!this.board) return;
    if (this.board.defaultAxes) {
      const axes = [this.board.defaultAxes.x, this.board.defaultAxes.y];
      for (const axis of axes) {
        if (axis) {
          if (visible) {
            axis.showElement();
          } else {
            axis.hideElement();
          }
        }
      }
      this.board.update();
    }
  }

  fitToView(): void {
    if (!this.board) return;
    
    // Check if we have objects
    if (this.jxgObjects.size === 0) {
      this.board.setBoundingBox([-10, 10, 10, -10], true);
      return;
    }

    // JSXGraph handles bounding box automatically if we ask or we can compute it
    // simple way: we can collect all points and set bbox
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const el of this.jxgObjects.values()) {
      if (el.elType === 'point') {
        const x = el.X();
        const y = el.Y();
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    
    if (minX === Infinity) {
      this.board.setBoundingBox([-10, 10, 10, -10], true);
    } else {
      const paddingX = Math.max((maxX - minX) * 0.1, 1);
      const paddingY = Math.max((maxY - minY) * 0.1, 1);
      this.board.setBoundingBox([
        minX - paddingX,
        maxY + paddingY,
        maxX + paddingX,
        minY - paddingY
      ], true);
    }
  }

  on(eventName: string, callback: (event: any) => void): void {
    if (this.board) {
      this.board.on(eventName, callback);
    }
  }

  off(eventName: string, callback: (event: any) => void): void {
    if (this.board) {
      this.board.off(eventName, callback);
    }
  }
}
