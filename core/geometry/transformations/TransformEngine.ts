import type { Coords2D, ConstructionNode, GeometryObject, GeometryObjectDefinition } from '../../types/geometry';
import type { ConstructionGraph } from '../graph/ConstructionGraph';

export type TransformType = 'translation' | 'rotation' | 'reflection' | 'homothety';

export interface TransformParameters {
  transformType: TransformType;
  // Translation
  vector?: Coords2D;
  dx?: number;
  dy?: number;
  // Rotation & Homothety
  center?: Coords2D;
  angle?: number; // in radians
  angleDegrees?: number;
  ratio?: number;
  // Reflection
  lineP1?: Coords2D;
  lineP2?: Coords2D;
  centerP?: Coords2D; // for central reflection
}

export class TransformEngine {
  /**
   * Translate a 2D point by vector (dx, dy).
   */
  static translatePoint(p: Coords2D, v: Coords2D): Coords2D {
    return {
      x: p.x + v.x,
      y: p.y + v.y
    };
  }

  /**
   * Rotate a 2D point around a center point by an angle in radians.
   */
  static rotatePoint(p: Coords2D, center: Coords2D, angleRad: number): Coords2D {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  /**
   * Reflect a 2D point across a line defined by two points p1 and p2.
   * If p1 and p2 are coincidental, reflects across p1 as central symmetry.
   */
  static reflectPointAcrossLine(p: Coords2D, p1: Coords2D, p2: Coords2D): Coords2D {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-12) {
      return this.reflectPointAcrossPoint(p, p1);
    }
    const vx = p.x - p1.x;
    const vy = p.y - p1.y;
    const t = (vx * dx + vy * dy) / lenSq;
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    return {
      x: 2 * projX - p.x,
      y: 2 * projY - p.y
    };
  }

  /**
   * Reflect a 2D point across a central point (point symmetry).
   */
  static reflectPointAcrossPoint(p: Coords2D, center: Coords2D): Coords2D {
    return {
      x: 2 * center.x - p.x,
      y: 2 * center.y - p.y
    };
  }

  /**
   * Homothety (dilation / scaling) of a 2D point from a center point with ratio k.
   */
  static homothetyPoint(p: Coords2D, center: Coords2D, ratio: number): Coords2D {
    return {
      x: center.x + ratio * (p.x - center.x),
      y: center.y + ratio * (p.y - center.y)
    };
  }

  /**
   * Extract coordinates of a point from an object.
   */
  static getPointCoords(obj: GeometryObject | undefined, graph?: ConstructionGraph): Coords2D | undefined {
    if (!obj) return undefined;
    const def = obj.definition as Record<string, unknown> | undefined;
    if (def?.coords && typeof def.coords === 'object') {
      const c = def.coords as { x?: unknown; y?: unknown };
      if (typeof c.x === 'number' && typeof c.y === 'number') {
        return { x: c.x, y: c.y };
      }
    }
    if ('x' in obj && 'y' in obj && typeof (obj as { x: unknown }).x === 'number') {
      return { x: Number((obj as { x: number }).x), y: Number((obj as { y: number }).y) };
    }
    if (obj.parents && obj.parents.length > 0 && graph) {
      const pNode = graph.getNode(obj.parents[0] ?? '');
      if (pNode) return this.getPointCoords(pNode.object, graph);
    }
    return undefined;
  }

  /**
   * Extract two endpoints from a line, segment, or ray object.
   */
  static getLineEndpoints(obj: GeometryObject | undefined, graph?: ConstructionGraph): [Coords2D, Coords2D] | undefined {
    if (!obj) return undefined;
    const def = obj.definition as Record<string, unknown> | undefined;
    if (!def) return undefined;

    if (def.p1 && def.p2) {
      const p1 = def.p1 as Coords2D;
      const p2 = def.p2 as Coords2D;
      return [p1, p2];
    }
    if (def.point && def.direction) {
      const pt = def.point as Coords2D;
      const dir = def.direction as Coords2D;
      return [pt, { x: pt.x + dir.x, y: pt.y + dir.y }];
    }
    if (def.origin && def.direction) {
      const orig = def.origin as Coords2D;
      const dir = def.direction as Coords2D;
      return [orig, { x: orig.x + dir.x, y: orig.y + dir.y }];
    }
    if (obj.parents && obj.parents.length >= 2 && graph) {
      const n1 = graph.getNode(obj.parents[0] ?? '');
      const n2 = graph.getNode(obj.parents[1] ?? '');
      const c1 = this.getPointCoords(n1?.object, graph);
      const c2 = this.getPointCoords(n2?.object, graph);
      if (c1 && c2) return [c1, c2];
    }
    return undefined;
  }

  /**
   * Applies a point transformation function to all points/properties of a geometry definition.
   */
  static transformDefinition(
    type: string,
    def: Record<string, unknown>,
    transformFn: (p: Coords2D) => Coords2D,
    ratio: number = 1
  ): Record<string, unknown> {
    const res: Record<string, unknown> = { ...def };

    switch (type) {
      case 'point': {
        const coords = (def.coords as Coords2D) || { x: 0, y: 0 };
        res.coords = transformFn(coords);
        break;
      }
      case 'segment': {
        const p1 = (def.p1 as Coords2D) || { x: 0, y: 0 };
        const p2 = (def.p2 as Coords2D) || { x: 1, y: 0 };
        res.p1 = transformFn(p1);
        res.p2 = transformFn(p2);
        break;
      }
      case 'line': {
        let p1 = def.p1 as Coords2D | undefined;
        let p2 = def.p2 as Coords2D | undefined;
        if (!p1 || !p2) {
          const pt = (def.point as Coords2D) || { x: 0, y: 0 };
          const dir = (def.direction as Coords2D) || { x: 1, y: 0 };
          p1 = pt;
          p2 = { x: pt.x + dir.x, y: pt.y + dir.y };
        }
        const tp1 = transformFn(p1);
        const tp2 = transformFn(p2);
        const dx = tp2.x - tp1.x;
        const dy = tp2.y - tp1.y;
        const len = Math.hypot(dx, dy);
        res.point = tp1;
        res.direction = (len > 1e-12) ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
        res.p1 = tp1;
        res.p2 = tp2;
        break;
      }
      case 'ray': {
        const orig = (def.origin as Coords2D) || (def.p1 as Coords2D) || { x: 0, y: 0 };
        const dir = (def.direction as Coords2D) || { x: 1, y: 0 };
        const p2 = { x: orig.x + dir.x, y: orig.y + dir.y };
        const torig = transformFn(orig);
        const tp2 = transformFn(p2);
        const dx = tp2.x - torig.x;
        const dy = tp2.y - torig.y;
        const len = Math.hypot(dx, dy);
        res.origin = torig;
        res.direction = (len > 1e-12) ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
        break;
      }
      case 'circle': {
        const center = (def.center as Coords2D) || { x: 0, y: 0 };
        const radius = Number(def.radius ?? 1);
        res.center = transformFn(center);
        res.radius = Math.max(0.001, radius * Math.abs(ratio));
        break;
      }
      case 'polygon': {
        const points = (def.points as Coords2D[]) || [];
        res.points = points.map(p => transformFn(p));
        break;
      }
    }

    return res;
  }

  /**
   * Resolves the transform parameters from the ConstructionGraph dependencies.
   */
  static resolveParameters(
    node: ConstructionNode,
    graph: ConstructionGraph
  ): {
    sourceObj: GeometryObject;
    transformFn: (p: Coords2D) => Coords2D;
    ratio: number;
  } | null {
    const obj = node.object;
    const def = (obj.definition || {}) as Record<string, unknown>;
    const transformType = (def.transformType as TransformType) || 'translation';

    // Source object is typically parents[0] or def.sourceId
    const sourceId = (node.parents[0] as string | undefined) || (def.sourceId as string | undefined);
    if (!sourceId) return null;

    const sourceNode = graph.getNode(sourceId);
    if (!sourceNode || !sourceNode.object) return null;
    const sourceObj = sourceNode.object;

    // Helper to resolve point coords
    const getPt = (pId: string | undefined): Coords2D | undefined => {
      if (!pId) return undefined;
      return this.getPointCoords(graph.getNode(pId)?.object, graph);
    };

    // Helper to resolve slider value
    const getSliderVal = (pId: string | undefined): number | undefined => {
      if (!pId) return undefined;
      const n = graph.getNode(pId);
      if (!n || n.object.type !== 'slider') return undefined;
      const val = (n.object.definition as Record<string, unknown>)?.value;
      return typeof val === 'number' ? val : Number(val);
    };

    let transformFn: ((p: Coords2D) => Coords2D) | null = null;
    let ratio = 1;

    switch (transformType) {
      case 'translation': {
        let v: Coords2D = { x: Number(def.dx ?? 0), y: Number(def.dy ?? 0) };
        if (def.vector && typeof def.vector === 'object') {
          v = def.vector as Coords2D;
        }

        // Check if 2 points define vector (parents[1] -> parents[2])
        if (node.parents.length >= 3) {
          const pt1 = getPt(node.parents[1]);
          const pt2 = getPt(node.parents[2]);
          if (pt1 && pt2) {
            v = { x: pt2.x - pt1.x, y: pt2.y - pt1.y };
          }
        } else if (node.parents.length >= 2) {
          const parent2 = graph.getNode(node.parents[1] ?? '')?.object;
          if (parent2?.type === 'segment') {
            const segEndpoints = this.getLineEndpoints(parent2, graph);
            if (segEndpoints) {
              v = { x: segEndpoints[1].x - segEndpoints[0].x, y: segEndpoints[1].y - segEndpoints[0].y };
            }
          } else if (parent2?.type === 'vector') {
            const vDef = parent2.definition as Record<string, unknown>;
            v = { x: Number(vDef.x ?? vDef.dx ?? 0), y: Number(vDef.y ?? vDef.dy ?? 0) };
          } else if (parent2?.type === 'point') {
            const pt = this.getPointCoords(parent2, graph);
            if (pt) v = pt;
          }
        }

        transformFn = (p: Coords2D) => this.translatePoint(p, v);
        break;
      }

      case 'rotation': {
        let center: Coords2D = (def.center as Coords2D) || { x: 0, y: 0 };
        const centerPt = getPt(node.parents[1]);
        if (centerPt) {
          center = centerPt;
        }

        // Angle resolution
        let angleRad = Number(def.angle ?? (typeof def.angleDegrees === 'number' ? def.angleDegrees * Math.PI / 180 : Math.PI / 4));
        const sliderVal = getSliderVal(node.parents[2]) ?? getSliderVal(node.parents[1]);
        if (sliderVal !== undefined) {
          // If slider value is typically degrees (e.g. > 2*PI or def.angleUnit === 'deg')
          angleRad = Math.abs(sliderVal) > 2 * Math.PI || def.angleUnit === 'deg'
            ? sliderVal * Math.PI / 180
            : sliderVal;
        }

        transformFn = (p: Coords2D) => this.rotatePoint(p, center, angleRad);
        break;
      }

      case 'reflection': {
        const parent2Node = node.parents[1] ? graph.getNode(node.parents[1]) : undefined;
        const parent2 = parent2Node?.object;

        if (parent2?.type === 'point' && node.parents.length === 2) {
          // Central reflection through a point
          const center = this.getPointCoords(parent2, graph) || { x: 0, y: 0 };
          transformFn = (p: Coords2D) => this.reflectPointAcrossPoint(p, center);
        } else {
          // Axial reflection across line / segment / ray or 2 points
          let p1: Coords2D = (def.p1 as Coords2D) || { x: 0, y: 0 };
          let p2: Coords2D = (def.p2 as Coords2D) || { x: 1, y: 0 };

          if (node.parents.length >= 3) {
            const pt1 = getPt(node.parents[1]);
            const pt2 = getPt(node.parents[2]);
            if (pt1 && pt2) {
              p1 = pt1;
              p2 = pt2;
            }
          } else if (parent2) {
            const endpoints = this.getLineEndpoints(parent2, graph);
            if (endpoints) {
              p1 = endpoints[0];
              p2 = endpoints[1];
            }
          }

          transformFn = (p: Coords2D) => this.reflectPointAcrossLine(p, p1, p2);
        }
        break;
      }

      case 'homothety': {
        let center: Coords2D = (def.center as Coords2D) || { x: 0, y: 0 };
        const centerPt = getPt(node.parents[1]);
        if (centerPt) {
          center = centerPt;
        }

        let k = Number(def.ratio ?? 2);
        const sliderVal = getSliderVal(node.parents[2]) ?? getSliderVal(node.parents[1]);
        if (sliderVal !== undefined) {
          k = sliderVal;
        }
        ratio = k;

        transformFn = (p: Coords2D) => this.homothetyPoint(p, center, k);
        break;
      }
    }

    if (!transformFn) return null;

    return {
      sourceObj,
      transformFn,
      ratio
    };
  }

  /**
   * Evaluator invoked by ConstructionGraph for nodes where definition.kind === 'transform'.
   * Synchronizes the image object's definition with the current state of its parents.
   */
  static evaluate(node: ConstructionNode, graph: ConstructionGraph): void {
    const resolved = this.resolveParameters(node, graph);
    if (!resolved || !resolved.sourceObj) return;

    const { sourceObj, transformFn, ratio } = resolved;
    if (!sourceObj) return;
    const sourceDef = (sourceObj.definition || {}) as Record<string, unknown>;

    // For polygon, if points are missing in definition, check if it was constructed from point parents
    let effectiveSourceDef = { ...sourceDef };
    if (sourceObj.type === 'polygon' && (!effectiveSourceDef.points || !Array.isArray(effectiveSourceDef.points))) {
      if (sourceObj.parents && sourceObj.parents.length > 0) {
        const pts = sourceObj.parents
          .map(pId => this.getPointCoords(graph.getNode(pId)?.object, graph))
          .filter((p): p is Coords2D => p !== undefined);
        if (pts.length > 0) {
          effectiveSourceDef.points = pts;
        }
      }
    }

    const transformedDef = this.transformDefinition(
      sourceObj.type,
      effectiveSourceDef,
      transformFn,
      ratio
    );

    // Merge into the node's object definition preserving kind: 'transform' and metadata
    const obj = node.object;
    obj.type = sourceObj.type;
    try {
      obj.definition = {
        ...obj.definition,
        ...transformedDef,
        kind: 'transform'
      };
    } catch {
      if (typeof obj.definition === 'object' && obj.definition !== null) {
        Object.assign(obj.definition, transformedDef, { kind: 'transform' });
      }
    }

    // Also synchronize direct instance properties if primitive instances are used
    if (obj.type === 'point' && obj.definition.coords) {
      const c = obj.definition.coords as Coords2D;
      if ('x' in obj && 'y' in obj) {
        (obj as { x: number; y: number }).x = c.x;
        (obj as { x: number; y: number }).y = c.y;
      }
    } else if (obj.type === 'circle' && obj.definition.center) {
      if ('center' in obj) {
        (obj as { center: Coords2D }).center = { ...(obj.definition.center as Coords2D) };
      }
      if ('radius' in obj && typeof obj.definition.radius === 'number') {
        (obj as { radius: number }).radius = obj.definition.radius;
      }
    } else if (obj.type === 'segment' && obj.definition.p1 && obj.definition.p2) {
      if ('p1' in obj && 'p2' in obj) {
        (obj as { p1: Coords2D; p2: Coords2D }).p1 = { ...(obj.definition.p1 as Coords2D) };
        (obj as { p1: Coords2D; p2: Coords2D }).p2 = { ...(obj.definition.p2 as Coords2D) };
      }
    } else if (obj.type === 'polygon' && Array.isArray(obj.definition.points)) {
      if ('points' in obj) {
        (obj as { points: Coords2D[] }).points = [...(obj.definition.points as Coords2D[])];
      }
    }
  }
}
