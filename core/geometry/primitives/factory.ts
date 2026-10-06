import type { GeometryObject } from '../../types/geometry';
import {
  Point, Line, Segment, Ray, Circle, Arc, Angle, Vector, Polygon,
  type PointDef, type LineDef, type SegmentDef, type RayDef, type CircleDef, type ArcDef, type AngleDef, type VectorDef, type PolygonDef
} from './2d';

export function createPrimitiveFromJSON(json: GeometryObject): Point | Line | Segment | Ray | Circle | Arc | Angle | Vector | Polygon {
  let instance: Point | Line | Segment | Ray | Circle | Arc | Angle | Vector | Polygon;
  
  switch (json.type) {
    case 'point': {
      const def = json.definition as PointDef;
      instance = new Point(def.coords.x, def.coords.y, json.id);
      break;
    }
    case 'line': {
      const def = json.definition as LineDef;
      instance = new Line(def.point, def.direction, json.id);
      break;
    }
    case 'segment': {
      const def = json.definition as SegmentDef;
      instance = new Segment(def.p1, def.p2, json.id);
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
    case 'vector': {
      const def = json.definition as VectorDef;
      instance = new Vector(def.x, def.y, json.id);
      break;
    }
    case 'polygon': {
      const def = json.definition as PolygonDef;
      instance = new Polygon(def.points, json.id);
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
