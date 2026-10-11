import { BasePrimitive } from './BasePrimitive';
import type { Coords3D, GeometryObjectDefinition } from '../../types/geometry';

export interface Point3DDef extends GeometryObjectDefinition {
  kind: 'point3d';
  coords: Coords3D;
}

export class Point3D extends BasePrimitive {
  public override type = 'point' as const;
  public override dimension: 2 | 3 = 3;

  constructor(public x: number, public y: number, public z: number, id?: string) {
    super(id);
  }

  get coords(): Coords3D {
    return { x: this.x, y: this.y, z: this.z };
  }

  get definition(): Point3DDef {
    return { kind: 'point3d', coords: this.coords };
  }

  distanceTo(other: Coords3D | Point3D): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return Math.hypot(dx, dy, dz);
  }

  equals(other: Coords3D | Point3D, tolerance = 1e-10): number | boolean {
    return (
      Math.abs(this.x - other.x) <= tolerance &&
      Math.abs(this.y - other.y) <= tolerance &&
      Math.abs(this.z - other.z) <= tolerance
    );
  }

  toVector(): Vector3D {
    return new Vector3D(this.x, this.y, this.z);
  }

  toString(): string {
    return `Point3D(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`;
  }
}

export interface Vector3DDef extends GeometryObjectDefinition {
  kind: 'vector3d';
  x: number;
  y: number;
  z: number;
}

export class Vector3D extends BasePrimitive {
  public override type = 'vector' as const;
  public override dimension: 2 | 3 = 3;

  constructor(public x: number, public y: number, public z: number, id?: string) {
    super(id);
  }

  get coords(): Coords3D {
    return { x: this.x, y: this.y, z: this.z };
  }

  get definition(): Vector3DDef {
    return { kind: 'vector3d', x: this.x, y: this.y, z: this.z };
  }

  magnitude(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vector3D {
    const mag = this.magnitude();
    if (mag <= 1e-15 || !isFinite(mag)) {
      return new Vector3D(0, 0, 0);
    }
    return new Vector3D(this.x / mag, this.y / mag, this.z / mag);
  }

  dot(other: Coords3D | Vector3D): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Coords3D | Vector3D): Vector3D {
    return new Vector3D(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  add(other: Coords3D | Vector3D): Vector3D {
    return new Vector3D(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Coords3D | Vector3D): Vector3D {
    return new Vector3D(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  scale(scalar: number): Vector3D {
    return new Vector3D(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  angleTo(other: Coords3D | Vector3D): number {
    const d = this.dot(other);
    const m = this.magnitude() * (other instanceof Vector3D ? other.magnitude() : Math.hypot(other.x, other.y, other.z));
    if (m <= 1e-15) return 0;
    const cos = Math.max(-1, Math.min(1, d / m));
    return Math.acos(cos);
  }

  isZero(tolerance = 1e-10): boolean {
    return this.magnitude() <= tolerance;
  }

  isParallel(other: Coords3D | Vector3D, tolerance = 1e-8): boolean {
    return this.cross(other).magnitude() <= tolerance;
  }

  isPerpendicular(other: Coords3D | Vector3D, tolerance = 1e-8): boolean {
    return Math.abs(this.dot(other)) <= tolerance;
  }

  static fromTwoPoints(p1: Coords3D, p2: Coords3D, id?: string): Vector3D {
    return new Vector3D(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z, id);
  }

  toString(): string {
    return `Vector3D(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`;
  }
}

export interface Segment3DDef extends GeometryObjectDefinition {
  kind: 'segment3d';
  p1: Coords3D;
  p2: Coords3D;
}

export class Segment3D extends BasePrimitive {
  public override type = 'segment' as const;
  public override dimension: 2 | 3 = 3;

  constructor(public p1: Coords3D, public p2: Coords3D, id?: string) {
    super(id);
  }

  get length(): number {
    return Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y, this.p2.z - this.p1.z);
  }

  get definition(): Segment3DDef {
    return { kind: 'segment3d', p1: this.p1, p2: this.p2 };
  }

  midpoint(): Point3D {
    return new Point3D(
      (this.p1.x + this.p2.x) / 2,
      (this.p1.y + this.p2.y) / 2,
      (this.p1.z + this.p2.z) / 2
    );
  }

  direction(): Vector3D {
    return Vector3D.fromTwoPoints(this.p1, this.p2).normalize();
  }

  pointAt(t: number): Point3D {
    return new Point3D(
      this.p1.x + t * (this.p2.x - this.p1.x),
      this.p1.y + t * (this.p2.y - this.p1.y),
      this.p1.z + t * (this.p2.z - this.p1.z)
    );
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const d1 = Math.hypot(pt.x - this.p1.x, pt.y - this.p1.y, pt.z - this.p1.z);
    const d2 = Math.hypot(this.p2.x - pt.x, this.p2.y - pt.y, this.p2.z - pt.z);
    return Math.abs(d1 + d2 - this.length) <= tolerance;
  }

  toString(): string {
    return `Segment3D((${this.p1.x.toFixed(2)}, ${this.p1.y.toFixed(2)}, ${this.p1.z.toFixed(2)}) -> (${this.p2.x.toFixed(2)}, ${this.p2.y.toFixed(2)}, ${this.p2.z.toFixed(2)}))`;
  }
}

export interface Line3DDef extends GeometryObjectDefinition {
  kind: 'line3d';
  point: Coords3D;
  direction: Coords3D;
}

export class Line3D extends BasePrimitive {
  public override type = 'line' as const;
  public override dimension: 2 | 3 = 3;
  public direction: Vector3D;

  constructor(public point: Coords3D, direction: Coords3D | Vector3D, id?: string) {
    super(id);
    const vec = direction instanceof Vector3D ? direction : new Vector3D(direction.x, direction.y, direction.z);
    const norm = vec.normalize();
    this.direction = norm.isZero() ? new Vector3D(1, 0, 0) : norm;
  }

  static fromTwoPoints(p1: Coords3D, p2: Coords3D, id?: string): Line3D {
    const dir = Vector3D.fromTwoPoints(p1, p2);
    if (dir.isZero()) {
      throw new Error('Cannot create Line3D from coincident points');
    }
    return new Line3D(p1, dir, id);
  }

  get definition(): Line3DDef {
    return {
      kind: 'line3d',
      point: this.point,
      direction: { x: this.direction.x, y: this.direction.y, z: this.direction.z }
    };
  }

  pointAt(t: number): Point3D {
    return new Point3D(
      this.point.x + t * this.direction.x,
      this.point.y + t * this.direction.y,
      this.point.z + t * this.direction.z
    );
  }

  distanceToPoint(pt: Coords3D): number {
    const ap = Vector3D.fromTwoPoints(this.point, pt);
    return ap.cross(this.direction).magnitude();
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    return this.distanceToPoint(pt) <= tolerance;
  }

  isParallel(other: Line3D, tolerance = 1e-8): boolean {
    return this.direction.isParallel(other.direction, tolerance);
  }

  isPerpendicular(other: Line3D, tolerance = 1e-8): boolean {
    return this.direction.isPerpendicular(other.direction, tolerance);
  }

  toString(): string {
    return `Line3D(pt: (${this.point.x.toFixed(2)}, ${this.point.y.toFixed(2)}, ${this.point.z.toFixed(2)}), dir: (${this.direction.x.toFixed(2)}, ${this.direction.y.toFixed(2)}, ${this.direction.z.toFixed(2)}))`;
  }
}

export interface PlaneDef extends GeometryObjectDefinition {
  kind: 'plane';
  point: Coords3D;
  normal: Coords3D;
  d: number;
  p1?: Coords3D;
  p2?: Coords3D;
  p3?: Coords3D;
}

export class Plane extends BasePrimitive {
  public override type = 'plane' as const;
  public override dimension: 2 | 3 = 3;
  public normal: Vector3D;
  public d: number;
  public p1?: Coords3D;
  public p2?: Coords3D;
  public p3?: Coords3D;

  constructor(public point: Coords3D, normal: Coords3D | Vector3D, id?: string) {
    super(id);
    const vec = normal instanceof Vector3D ? normal : new Vector3D(normal.x, normal.y, normal.z);
    const normalized = vec.normalize();
    if (normalized.isZero()) {
      throw new Error('Plane normal cannot be zero vector');
    }
    this.normal = normalized;
    // d in ax + by + cz + d = 0 -> d = -(ax_0 + by_0 + cz_0)
    this.d = -(this.normal.x * point.x + this.normal.y * point.y + this.normal.z * point.z);
  }

  static fromPointAndNormal(point: Coords3D, normal: Coords3D | Vector3D, id?: string): Plane {
    return new Plane(point, normal, id);
  }

  static fromThreePoints(p1: Coords3D, p2: Coords3D, p3: Coords3D, id?: string): Plane {
    const v1 = Vector3D.fromTwoPoints(p1, p2);
    const v2 = Vector3D.fromTwoPoints(p1, p3);
    const normal = v1.cross(v2);
    if (normal.magnitude() <= 1e-10) {
      throw new Error('Points are collinear and cannot define a unique plane');
    }
    const plane = new Plane(p1, normal, id);
    plane.p1 = p1;
    plane.p2 = p2;
    plane.p3 = p3;
    return plane;
  }

  static fromEquation(a: number, b: number, c: number, d: number, id?: string): Plane {
    const len = Math.hypot(a, b, c);
    if (len <= 1e-10) {
      throw new Error('Invalid plane equation coefficients: normal vector cannot be zero');
    }
    const na = a / len;
    const nb = b / len;
    const nc = c / len;
    const nd = d / len;
    // Point on the plane closest to origin: -nd * n
    const point = { x: -nd * na, y: -nd * nb, z: -nd * nc };
    return new Plane(point, new Vector3D(na, nb, nc), id);
  }

  get equation(): { a: number; b: number; c: number; d: number } {
    return {
      a: this.normal.x,
      b: this.normal.y,
      c: this.normal.z,
      d: this.d
    };
  }

  get definition(): PlaneDef {
    const def: PlaneDef = {
      kind: 'plane',
      point: this.point,
      normal: { x: this.normal.x, y: this.normal.y, z: this.normal.z },
      d: this.d
    };
    if (this.p1 && this.p2 && this.p3) {
      def.p1 = this.p1;
      def.p2 = this.p2;
      def.p3 = this.p3;
    }
    return def;
  }

  distanceToPoint(pt: Coords3D): number {
    return Math.abs(this.normal.x * pt.x + this.normal.y * pt.y + this.normal.z * pt.z + this.d);
  }

  projectPoint(pt: Coords3D): Point3D {
    const dist = this.normal.x * pt.x + this.normal.y * pt.y + this.normal.z * pt.z + this.d;
    return new Point3D(
      pt.x - dist * this.normal.x,
      pt.y - dist * this.normal.y,
      pt.z - dist * this.normal.z
    );
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    return this.distanceToPoint(pt) <= tolerance;
  }

  isParallel(other: Plane, tolerance = 1e-8): boolean {
    return this.normal.isParallel(other.normal, tolerance);
  }

  isPerpendicular(other: Plane, tolerance = 1e-8): boolean {
    return this.normal.isPerpendicular(other.normal, tolerance);
  }

  angleTo(other: Plane): number {
    const cos = Math.min(1, Math.max(0, Math.abs(this.normal.dot(other.normal))));
    return Math.acos(cos);
  }

  toString(): string {
    return `Plane(${this.normal.x.toFixed(2)}x + ${this.normal.y.toFixed(2)}y + ${this.normal.z.toFixed(2)}z + ${this.d.toFixed(2)} = 0)`;
  }
}
