import type { GeometryObject } from '../../types/geometry';
import {
  Point, Line, Segment, Ray, Circle, Arc, Angle, Vector, Polygon, Slider,
  type PointDef, type LineDef, type SegmentDef, type RayDef, type CircleDef, type ArcDef, type AngleDef, type VectorDef, type PolygonDef, type SliderDef
} from './2d';
import {
  Point3D, Line3D, Segment3D, Plane, Vector3D,
  type Point3DDef, type Line3DDef, type Segment3DDef, type PlaneDef, type Vector3DDef
} from './3d';

export type AnyPrimitive =
  | Point | Line | Segment | Ray | Circle | Arc | Angle | Vector | Polygon | Slider
  | Point3D | Line3D | Segment3D | Plane | Vector3D;

export function createPrimitiveFromJSON(json: GeometryObject): AnyPrimitive {
  let instance: AnyPrimitive;

  switch (json.type) {
    case 'point':
    case 'point3d': {
      const def = json.definition as Record<string, unknown>;
      const coords = def.coords as { x?: number; y?: number; z?: number } | undefined;
      const is3D = json.dimension === 3 || def.kind === 'point3d' || coords?.z !== undefined;
      if (is3D && coords) {
        instance = new Point3D(coords.x ?? 0, coords.y ?? 0, coords.z ?? 0, json.id);
      } else {
        const pDef = json.definition as PointDef;
        instance = new Point(pDef.coords.x, pDef.coords.y, json.id);
      }
      break;
    }
    case 'line':
    case 'line3d': {
      const def = json.definition as Record<string, unknown>;
      const is3D = json.dimension === 3 || def.kind === 'line3d' || (def.point && typeof def.point === 'object' && 'z' in def.point);
      if (is3D) {
        const lDef = json.definition as Line3DDef;
        instance = new Line3D(lDef.point, lDef.direction, json.id);
      } else {
        const lDef = json.definition as LineDef;
        instance = new Line(lDef.point, lDef.direction, json.id);
      }
      break;
    }
    case 'segment':
    case 'segment3d': {
      const def = json.definition as Record<string, unknown>;
      const is3D = json.dimension === 3 || def.kind === 'segment3d' || (def.p1 && typeof def.p1 === 'object' && 'z' in def.p1);
      if (is3D) {
        const sDef = json.definition as Segment3DDef;
        instance = new Segment3D(sDef.p1, sDef.p2, json.id);
      } else {
        const sDef = json.definition as SegmentDef;
        instance = new Segment(sDef.p1, sDef.p2, json.id);
      }
      break;
    }
    case 'ray': {
      const def = json.definition as RayDef;
      instance = new Ray(def.origin, def.direction, json.id);
      break;
    }
    case 'circle': {
      const def = json.definition as CircleDef;
      instance = new Circle(def.center, def.radius, json.id);
      break;
    }
    case 'arc': {
      const def = json.definition as ArcDef;
      instance = new Arc(def.center, def.radius, def.startAngle, def.endAngle, json.id);
      break;
    }
    case 'angle': {
      const def = json.definition as AngleDef;
      instance = new Angle(def.vertex, def.p1, def.p2, json.id);
      break;
    }
    case 'vector':
    case 'vector3d': {
      const def = json.definition as Record<string, unknown>;
      const is3D = json.dimension === 3 || def.kind === 'vector3d' || def.z !== undefined;
      if (is3D) {
        const vDef = json.definition as Vector3DDef;
        instance = new Vector3D(vDef.x, vDef.y, vDef.z, json.id);
      } else {
        const vDef = json.definition as VectorDef;
        instance = new Vector(vDef.x, vDef.y, json.id);
      }
      break;
    }
    case 'plane': {
      const def = json.definition as PlaneDef;
      if (def.p1 && def.p2 && def.p3) {
        instance = Plane.fromThreePoints(def.p1, def.p2, def.p3, json.id);
      } else {
        instance = new Plane(def.point, def.normal, json.id);
      }
      break;
    }
    case 'polygon': {
      const def = json.definition as PolygonDef;
      instance = new Polygon(def.points, json.id);
      break;
    }
    case 'slider': {
      const def = json.definition as SliderDef;
      instance = new Slider(def.name, def.min, def.max, def.value, def.step, def.p1, def.p2, json.id);
      break;
    }
    default:
      throw new Error(`Unknown primitive type: ${json.type}`);
  }

  instance.parents = json.parents ? [...json.parents] : [];
  instance.constraints = json.constraints ? [...json.constraints] : [];
  instance.style = json.style ? { ...json.style } : {};
  instance.metadata = json.metadata ? { ...json.metadata } : {};

  return instance;
}
