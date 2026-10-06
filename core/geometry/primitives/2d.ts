import { BasePrimitive } from './BasePrimitive';
import type { Coords2D, GeometryObjectDefinition } from '../../types/geometry';

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
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    return Math.sqrt(dx * dx + dy * dy);
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
    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    this.direction = len > 0 ? { x: direction.x / len, y: direction.y / len } : { x: 1, y: 0 };
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
    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    this.direction = len > 0 ? { x: direction.x / len, y: direction.y / len } : { x: 1, y: 0 };
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
    const v1 = { x: this.p1.x - this.vertex.x, y: this.p1.y - this.vertex.y };
    const v2 = { x: this.p2.x - this.vertex.x, y: this.p2.y - this.vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 0;
    // ensure within [-1, 1] for acos
    let cosTheta = dot / (mag1 * mag2);
    cosTheta = Math.max(-1, Math.min(1, cosTheta));
    return Math.acos(cosTheta);
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
    return Math.sqrt(this.x * this.x + this.y * this.y);
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
    if (this.points.length < 2) return 0;
    let peri = 0;
    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      peri += Math.sqrt(dx * dx + dy * dy);
    }
    return peri;
  }

  get area(): number {
    if (this.points.length < 3) return 0;
    let a = 0;
    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];
      a += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(a) / 2;
  }

  get definition(): PolygonDef {
    return { kind: 'polygon', points: this.points };
  }

  toString(): string {
    return `Polygon(${this.points.length} points)`;
  }
}
