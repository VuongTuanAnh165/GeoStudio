import { BasePrimitive } from './BasePrimitive';
import type { Coords2D, GeometryObjectDefinition } from '../../types/geometry';
import { distanceCoords, angleCoords, polygonAreaCoords, polygonPerimeterCoords } from '../measurements';

export interface PointDef extends GeometryObjectDefinition {
  kind: 'point';
  coords: Coords2D;
}

export class Point extends BasePrimitive {
  public type = 'point' as const;

  constructor(public x: number, public y: number, id?: string) {
    super(id);
  }

  get definition(): PointDef {
    return { kind: 'point', coords: { x: this.x, y: this.y } };
  }

  toString(): string {
    return `Point(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}

export interface SegmentDef extends GeometryObjectDefinition {
  kind: 'segment';
  p1: Coords2D;
  p2: Coords2D;
}

export class Segment extends BasePrimitive {
  public type = 'segment' as const;

  constructor(public p1: Coords2D, public p2: Coords2D, id?: string) {
    super(id);
  }

  get length(): number {
    return distanceCoords(this.p1, this.p2);
  }

  get definition(): SegmentDef {
    return { kind: 'segment', p1: this.p1, p2: this.p2 };
  }

  toString(): string {
    return `Segment((${this.p1.x.toFixed(2)}, ${this.p1.y.toFixed(2)}) -> (${this.p2.x.toFixed(2)}, ${this.p2.y.toFixed(2)}))`;
  }
}

export interface LineDef extends GeometryObjectDefinition {
  kind: 'line';
  point: Coords2D;
  direction: Coords2D; // Normalized vector
}

export class Line extends BasePrimitive {
  public type = 'line' as const;
  public direction: Coords2D;

  constructor(public point: Coords2D, direction: Coords2D, id?: string) {
    super(id);
    // Normalize direction
    const len = Math.hypot(direction.x, direction.y);
    this.direction = (len > 1e-150 && isFinite(len)) ? { x: direction.x / len, y: direction.y / len } : { x: 1, y: 0 };
  }

  static fromTwoPoints(p1: Coords2D, p2: Coords2D, id?: string): Line {
    return new Line(p1, { x: p2.x - p1.x, y: p2.y - p1.y }, id);
  }

  get definition(): LineDef {
    return { kind: 'line', point: this.point, direction: this.direction };
  }

  toString(): string {
    return `Line(pt: (${this.point.x.toFixed(2)}, ${this.point.y.toFixed(2)}), dir: (${this.direction.x.toFixed(2)}, ${this.direction.y.toFixed(2)}))`;
  }
}

export interface RayDef extends GeometryObjectDefinition {
  kind: 'ray';
  origin: Coords2D;
  direction: Coords2D; // Normalized vector
}

export class Ray extends BasePrimitive {
  public type = 'ray' as const;
  public direction: Coords2D;

  constructor(public origin: Coords2D, direction: Coords2D, id?: string) {
    super(id);
    const len = Math.hypot(direction.x, direction.y);
    this.direction = (len > 1e-150 && isFinite(len)) ? { x: direction.x / len, y: direction.y / len } : { x: 1, y: 0 };
  }

  static fromTwoPoints(origin: Coords2D, p2: Coords2D, id?: string): Ray {
    return new Ray(origin, { x: p2.x - origin.x, y: p2.y - origin.y }, id);
  }

  get definition(): RayDef {
    return { kind: 'ray', origin: this.origin, direction: this.direction };
  }

  toString(): string {
    return `Ray(origin: (${this.origin.x.toFixed(2)}, ${this.origin.y.toFixed(2)}), dir: (${this.direction.x.toFixed(2)}, ${this.direction.y.toFixed(2)}))`;
  }
}

export interface CircleDef extends GeometryObjectDefinition {
  kind: 'circle';
  center: Coords2D;
  radius: number;
}

export class Circle extends BasePrimitive {
  public type = 'circle' as const;

  constructor(public center: Coords2D, public radius: number, id?: string) {
    super(id);
  }

  get definition(): CircleDef {
    return { kind: 'circle', center: this.center, radius: this.radius };
  }

  toString(): string {
    return `Circle(center: (${this.center.x.toFixed(2)}, ${this.center.y.toFixed(2)}), r: ${this.radius.toFixed(2)})`;
  }
}

export interface ArcDef extends GeometryObjectDefinition {
  kind: 'arc';
  center: Coords2D;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export class Arc extends BasePrimitive {
  public type = 'arc' as const;

  constructor(
    public center: Coords2D,
    public radius: number,
    public startAngle: number,
    public endAngle: number,
    id?: string
  ) {
    super(id);
  }

  get definition(): ArcDef {
    return {
      kind: 'arc',
      center: this.center,
      radius: this.radius,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
    };
  }

  toString(): string {
    return `Arc(center: (${this.center.x.toFixed(2)}, ${this.center.y.toFixed(2)}), r: ${this.radius.toFixed(2)}, span: ${this.startAngle.toFixed(2)}-${this.endAngle.toFixed(2)})`;
  }
}

export interface AngleDef extends GeometryObjectDefinition {
  kind: 'angle';
  vertex: Coords2D;
  p1: Coords2D;
  p2: Coords2D;
}

export class Angle extends BasePrimitive {
  public type = 'angle' as const;

  constructor(public vertex: Coords2D, public p1: Coords2D, public p2: Coords2D, id?: string) {
    super(id);
  }

  get measure(): number {
    return angleCoords(this.vertex, this.p1, this.p2);
  }

  get definition(): AngleDef {
    return { kind: 'angle', vertex: this.vertex, p1: this.p1, p2: this.p2 };
  }

  toString(): string {
    return `Angle(measure: ${(this.measure * (180 / Math.PI)).toFixed(2)}°)`;
  }
}

export interface VectorDef extends GeometryObjectDefinition {
  kind: 'vector';
  x: number;
  y: number;
}

export class Vector extends BasePrimitive {
  public type = 'vector' as const;

  constructor(public x: number, public y: number, id?: string) {
    super(id);
  }

  get magnitude(): number {
    return Math.hypot(this.x, this.y);
  }

  get direction(): number {
    return Math.atan2(this.y, this.x);
  }

  get definition(): VectorDef {
    return { kind: 'vector', x: this.x, y: this.y };
  }

  toString(): string {
    return `Vector(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}

export interface PolygonDef extends GeometryObjectDefinition {
  kind: 'polygon';
  points: Coords2D[];
}

export class Polygon extends BasePrimitive {
  public type = 'polygon' as const;

  constructor(public points: Coords2D[], id?: string) {
    super(id);
  }

  get perimeter(): number {
    return polygonPerimeterCoords(this.points);
  }

  get area(): number {
    return polygonAreaCoords(this.points);
  }

  get definition(): PolygonDef {
    return { kind: 'polygon', points: this.points };
  }

  toString(): string {
    return `Polygon(${this.points.length} points)`;
  }
}
