import type { GeometryRenderer } from '../types/renderer';
import type { GeometryObject, Coords2D } from '../types/geometry';
import JXG from 'jsxgraph';

export class JSXGraphRenderer implements GeometryRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private board: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jxgObjects: Map<string, any> = new Map();

  init(container: string | HTMLElement): void {
    // Increase hit detection tolerance for easier selection of lines/curves
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (JXG.Options as any).precision.hasPoint = 15;

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

  getRawObject(id: string): any {
    return this.jxgObjects.get(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getStyleAttributes(obj: GeometryObject, isSelected: boolean = false): Record<string, any> {
    const baseColor = obj.style?.color || '#3b82f6';
    const baseStrokeWidth = (obj.style?.strokeWidth as number) || 2;

    let strokeColor = baseColor;
    let fillColor = baseColor;
    let strokeWidth = baseStrokeWidth;
    let size = 4;

    if (isSelected) {
      strokeWidth = baseStrokeWidth + 3;
      size = 6;
    }

    const defaultAttrs = {
      name: obj.metadata?.label || '',
      withLabel: obj.style?.showLabel === true,
      visible: obj.style?.visible !== false,
      strokeColor,
      strokeWidth,
      shadow: isSelected, // adds a drop shadow for highlight
      fixed: true
    };

    // We will return baseColor, strokeWidth and size for specific overrides
    return { attrs: defaultAttrs, strokeColor, size, isSelected, baseColor };
  }

  renderObject(obj: GeometryObject, isSelected: boolean = false): void {
    if (!this.board) return;
    if (this.jxgObjects.has(obj.id)) {
      this.updateObject(obj.id, obj, isSelected);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jxgEl: any;
    const styleInfo = this.getStyleAttributes(obj, isSelected);
    const attrs = styleInfo.attrs;
    attrs.id = obj.id; // Assign ID to find it later in hit tests

    try {
      const isConstructed = obj.parents && obj.parents.length > 0;

      if (isConstructed) {
        const args: any[] = [...(obj.parents as string[])].map(id => this.jxgObjects.get(id)).filter(Boolean);
        if (obj.definition.index !== undefined) {
          args.push(obj.definition.index);
        }

        const specificAttrs = { ...attrs };
        if (obj.type === 'point') {
          specificAttrs.size = styleInfo.size;
          specificAttrs.fillColor = styleInfo.strokeColor;
        } else if (obj.type === 'polygon') {
          specificAttrs.fillColor = styleInfo.baseColor;
          specificAttrs.fillOpacity = styleInfo.isSelected ? 0.3 : 0.1;
          specificAttrs.hasInnerPoints = true;
        }

        switch (obj.definition.kind) {
          case 'ray': {
            jxgEl = this.board.create('line', args, { ...specificAttrs, straightFirst: false, straightLast: true });
            break;
          }
          case 'glider': {
            const coords = obj.definition.coords as Coords2D;
            jxgEl = this.board.create('glider', [coords.x, coords.y, args[0]], specificAttrs);
            break;
          }
          case 'perpendicular_bisector': {
            let lineArg = args[0];
            if (args.length === 2) {
              lineArg = this.board.create('segment', [args[0], args[1]], { visible: false });
            }
            const midPoint = this.board.create('midpoint', args, { visible: false });
            jxgEl = this.board.create('perpendicular', [lineArg, midPoint], specificAttrs);

            // Smart construction: Right angle symbol
            const p1 = this.board.create('point', [() => jxgEl.point2.X(), () => jxgEl.point2.Y()], { visible: false });
            const p2 = this.board.create('point', [() => lineArg.point2.X(), () => lineArg.point2.Y()], { visible: false });
            this.board.create('nonreflexangle', [p1, midPoint, p2], {
              type: 'square', radius: 0.5, name: '', fillOpacity: 0, strokeWidth: 1, strokeColor: '#666'
            });

            // Smart construction: Equal segments
            if (args.length === 2) { // 2 points
              const s1 = this.board.create('segment', [args[0], midPoint], { visible: false });
              const s2 = this.board.create('segment', [midPoint, args[1]], { visible: false });
              this.board.create('hatch', [s1, 1], { face: '||', strokeColor: '#666' });
              this.board.create('hatch', [s2, 1], { face: '||', strokeColor: '#666' });
            }
            break;
          }
          case 'bisector': {
            if (args.length === 2) {
              const lines = this.board.create('bisectorlines', args, specificAttrs);
              jxgEl = lines.line1 || lines[1] || lines; // Try to extract the first line
            } else {
              jxgEl = this.board.create('bisector', args, specificAttrs);
              // Smart construction: Equal angles
              const pBisector = this.board.create('point', [() => jxgEl.point2.X(), () => jxgEl.point2.Y()], { visible: false });
              const angleOpts = { radius: 1, name: '', fillOpacity: 0.1, fillColor: '#3b82f6', strokeColor: '#3b82f6', withLabel: false };
              this.board.create('angle', [args[0], args[1], pBisector], angleOpts);
              this.board.create('angle', [pBisector, args[1], args[2]], angleOpts);
            }
            break;
          }
          case 'incircle': {
            const incircleArray = this.board.create('incircle', args, specificAttrs);
            jxgEl = incircleArray[1]; // The circle object
            break;
          }
          case 'perpendicular': {
            jxgEl = this.board.create('perpendicular', args, specificAttrs);
            // Smart construction: Right angle symbol
            const lineArg = args[0];
            const p1 = this.board.create('point', [() => jxgEl.point2.X(), () => jxgEl.point2.Y()], { visible: false });
            const p2 = this.board.create('point', [() => lineArg.point1.X(), () => lineArg.point1.Y()], { visible: false });
            const isect = this.board.create('intersection', [jxgEl, lineArg, 0], { visible: false });
            this.board.create('nonreflexangle', [p1, isect, p2], {
              type: 'square', radius: 0.5, name: '', fillOpacity: 0, strokeWidth: 1, strokeColor: '#666'
            });
            break;
          }
          case 'midpoint': {
            jxgEl = this.board.create('midpoint', args, specificAttrs);
            // Smart construction: Equal segments
            if (args.length === 2) { // created from 2 points
              const s1 = this.board.create('segment', [args[0], jxgEl], { visible: false });
              const s2 = this.board.create('segment', [jxgEl, args[1]], { visible: false });
              this.board.create('hatch', [s1, 1], { face: '||', strokeColor: '#666' });
              this.board.create('hatch', [s2, 1], { face: '||', strokeColor: '#666' });
            } else if (args.length === 1 && args[0].elType === 'segment') { // created from 1 segment
              const p1 = args[0].point1;
              const p2 = args[0].point2;
              const s1 = this.board.create('segment', [p1, jxgEl], { visible: false });
              const s2 = this.board.create('segment', [jxgEl, p2], { visible: false });
              this.board.create('hatch', [s1, 1], { face: '||', strokeColor: '#666' });
              this.board.create('hatch', [s2, 1], { face: '||', strokeColor: '#666' });
            }
            break;
          }
          case 'measurement': {
            const measureType = obj.definition.measureType as string;
            
            // Extract the objects from args to compute position and value dynamically
            // args contains JSXGraph objects corresponding to targetIds
            let textFn = () => '';
            let xFn = () => 0;
            let yFn = () => 0;

            if (measureType === 'distance') {
              if (args.length === 2) { // 2 points
                xFn = () => (args[0].X() + args[1].X()) / 2;
                yFn = () => (args[0].Y() + args[1].Y()) / 2;
                textFn = () => {
                  const d = Math.hypot(args[0].X() - args[1].X(), args[0].Y() - args[1].Y());
                  return `${args[0].name}${args[1].name} = ${d.toFixed(2)}`;
                };
              } else if (args.length === 1) { // 1 segment
                xFn = () => (args[0].point1.X() + args[0].point2.X()) / 2;
                yFn = () => (args[0].point1.Y() + args[0].point2.Y()) / 2;
                textFn = () => {
                  const p1 = args[0].point1;
                  const p2 = args[0].point2;
                  const d = Math.hypot(p1.X() - p2.X(), p1.Y() - p2.Y());
                  const name = args[0].name || `${p1.name}${p2.name}`;
                  return `${name} = ${d.toFixed(2)}`;
                };
              }
            } else if (measureType === 'angle') {
              if (args.length === 3) {
                // To position the text, place it at the bisector
                xFn = () => {
                  // We'll just put it near the vertex for now
                  const a = args[0], b = args[1], c = args[2];
                  return b.X() + 0.5; // naive
                };
                yFn = () => args[1].Y() + 0.5;
                textFn = () => {
                  const a = args[0], b = args[1], c = args[2];
                  const v1x = a.X() - b.X(), v1y = a.Y() - b.Y();
                  const v2x = c.X() - b.X(), v2y = c.Y() - b.Y();
                  const dot = v1x * v2x + v1y * v2y;
                  const mag1 = Math.hypot(v1x, v1y), mag2 = Math.hypot(v2x, v2y);
                  let cos = dot / (mag1 * mag2);
                  if (cos > 1) cos = 1; if (cos < -1) cos = -1;
                  const ang = Math.acos(cos) * (180 / Math.PI);
                  return `∠${a.name}${b.name}${c.name} = ${ang.toFixed(1)}°`;
                };
              }
            } else if (measureType === 'area') {
              if (args.length === 1 && args[0].elType === 'polygon') {
                xFn = () => {
                  let sumX = 0;
                  args[0].vertices.forEach((v: any) => sumX += v.X());
                  return sumX / (args[0].vertices.length - 1); // last vertex is duplicate
                };
                yFn = () => {
                  let sumY = 0;
                  args[0].vertices.forEach((v: any) => sumY += v.Y());
                  return sumY / (args[0].vertices.length - 1);
                };
                textFn = () => `S = ${args[0].Area().toFixed(2)}`;
              }
            } else if (measureType === 'perimeter') {
              if (args.length === 1 && args[0].elType === 'polygon') {
                xFn = () => {
                  let sumX = 0;
                  args[0].vertices.forEach((v: any) => sumX += v.X());
                  return sumX / (args[0].vertices.length - 1);
                };
                yFn = () => {
                  let sumY = 0;
                  args[0].vertices.forEach((v: any) => sumY += v.Y());
                  return (sumY / (args[0].vertices.length - 1)) - 0.5; // slightly below area
                };
                textFn = () => `P = ${args[0].Perimeter().toFixed(2)}`;
              }
            }

            jxgEl = this.board.create('text', [xFn, yFn, textFn], {
              ...specificAttrs,
              fontSize: 14,
              anchorX: 'middle',
              anchorY: 'middle',
              strokeColor: styleInfo.baseColor,
              cssClass: 'katex-formula',
              parse: false
            });
            break;
          }
          default:
            jxgEl = this.board.create(obj.definition.kind, args, specificAttrs);
            break;
        }
      } else {
        switch (obj.type) {
          case 'point': {
            const coords = obj.definition.coords as Coords2D;
            jxgEl = this.board.create('point', [coords.x, coords.y], { ...attrs, size: styleInfo.size, fillColor: styleInfo.strokeColor });
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
            jxgEl = this.board.create('circle', [[c.x, c.y], r], attrs);
            break;
          }
          case 'polygon': {
            const points = obj.definition.points as Coords2D[];
            const coordArrays = points.map(p => [p.x, p.y]);
            jxgEl = this.board.create('polygon', coordArrays, { ...attrs, hasInnerPoints: true, fillColor: styleInfo.baseColor, fillOpacity: styleInfo.isSelected ? 0.3 : 0.1 });
            break;
          }
        }
      }

      if (jxgEl) {
        this.jxgObjects.set(obj.id, jxgEl);
      }
    } catch (e) {
      console.error(`Failed to render object ${obj.id}:`, e);
    }
  }

  getMeasurementText(id: string): string {
    const el = this.jxgObjects.get(id);
    if (el && el.elType === 'text') {
      try {
        if (typeof el.plaintext === 'function') {
          return el.plaintext();
        }
        if (el.plaintext) {
          return el.plaintext;
        }
      } catch (e) {
        return '';
      }
    }
    return '';
  }

  removeObject(id: string): void {
    if (!this.board) return;
    const jxgEl = this.jxgObjects.get(id);
    if (jxgEl) {
      this.board.removeObject(jxgEl);
      this.jxgObjects.delete(id);
    }
  }

  updateObject(id: string, obj: GeometryObject, isSelected: boolean = false): void {
    if (!this.board) return;
    const jxgEl = this.jxgObjects.get(id);

    if (!jxgEl) {
      this.renderObject(obj, isSelected);
      const newEl = this.jxgObjects.get(id);
      if (newEl) {
        newEl.__geoState = { ref: obj, isSelected };
      }
      return;
    }

    // FAST PATH: If object reference and selection state haven't changed, skip heavy JSXGraph DOM updates!
    if (jxgEl.__geoState?.ref === obj && jxgEl.__geoState?.isSelected === isSelected) {
      return;
    }
    jxgEl.__geoState = { ref: obj, isSelected };

    // Update style attributes
    const styleInfo = this.getStyleAttributes(obj, isSelected);
    const attrs = styleInfo.attrs;

    if (obj.type === 'point') {
      attrs.size = styleInfo.size;
      attrs.fillColor = styleInfo.strokeColor;
    }
    if (obj.type === 'polygon') {
      attrs.fillColor = styleInfo.baseColor;
      attrs.fillOpacity = styleInfo.isSelected ? 0.3 : 0.1;
    }

    for (const [key, val] of Object.entries(attrs)) {
      jxgEl.setAttribute({ [key]: val });
    }

    const isConstructed = obj.parents && obj.parents.length > 0;
    if (isConstructed) {
      // Constructed objects update automatically in JSXGraph when parents change
      return;
    }

    // Update coordinates based on type for explicit primitives
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

  zoomIn(): void {
    if (this.board) this.board.zoomIn();
  }

  zoomOut(): void {
    if (this.board) this.board.zoomOut();
  }

  resetZoom(): void {
    if (this.board) this.board.zoom100();
  }

  getZoom(): number {
    if (!this.board) return 100;
    // zoomX and zoomY usually store the scale. 1.0 means 100%
    return Math.round((this.board.zoomX || 1) * 100);
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
