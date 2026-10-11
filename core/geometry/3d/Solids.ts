import { BasePrimitive } from '../primitives/BasePrimitive';
import { Point3D, Vector3D, Segment3D } from '../primitives/3d';
import type { Coords3D, GeometryObjectDefinition } from '../../types/geometry';

// ==========================================
// Geometry Helper Functions (DRY & Reusable)
// ==========================================

/**
 * Tính diện tích đa giác 3D bằng Newell's method.
 * Hỗ trợ mọi đa giác phẳng bất kể hướng và góc xoay trong không gian 3D.
 */
export function polygonArea3D(points: Coords3D[]): number {
  const n = points.length;
  if (n < 3) return 0;
  let nx = 0;
  let ny = 0;
  let nz = 0;

  for (let i = 0; i < n; i++) {
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    nx += (p1.y - p2.y) * (p1.z + p2.z);
    ny += (p1.z - p2.z) * (p1.x + p2.x);
    nz += (p1.x - p2.x) * (p1.y + p2.y);
  }

  return 0.5 * Math.hypot(nx, ny, nz);
}

/**
 * Tính diện tích tam giác 3D từ 3 đỉnh: S = 0.5 * ||(B - A) x (C - A)||
 */
export function triangleArea3D(p1: Coords3D, p2: Coords3D, p3: Coords3D): number {
  const v1 = Vector3D.fromTwoPoints(p1, p2);
  const v2 = Vector3D.fromTwoPoints(p1, p3);
  return 0.5 * v1.cross(v2).magnitude();
}

/**
 * Thể tích tứ diện 3D: V = 1/6 * |((B - A) x (C - A)) . (D - A)|
 */
export function tetrahedronVolume(a: Coords3D, b: Coords3D, c: Coords3D, d: Coords3D): number {
  const ab = Vector3D.fromTwoPoints(a, b);
  const ac = Vector3D.fromTwoPoints(a, c);
  const ad = Vector3D.fromTwoPoints(a, d);
  return Math.abs(ab.cross(ac).dot(ad)) / 6;
}

/**
 * Thể tích có dấu (signed volume * 6) của 4 điểm 3D
 */
function signedVolume6(a: Coords3D, b: Coords3D, c: Coords3D, d: Coords3D): number {
  const ab = Vector3D.fromTwoPoints(a, b);
  const ac = Vector3D.fromTwoPoints(a, c);
  const ad = Vector3D.fromTwoPoints(a, d);
  return ab.cross(ac).dot(ad);
}

/**
 * Kiểm tra điểm p có nằm trong tứ diện ABCD không bằng toạ độ tỉ cự
 */
export function isPointInsideTetrahedron(p: Coords3D, a: Coords3D, b: Coords3D, c: Coords3D, d: Coords3D, tol = 1e-6): boolean {
  const vTot = signedVolume6(a, b, c, d);
  if (Math.abs(vTot) < 1e-12) {
    return false; // Degenerate tetrahedron
  }

  const v1 = signedVolume6(p, b, c, d);
  const v2 = signedVolume6(a, p, c, d);
  const v3 = signedVolume6(a, b, p, d);
  const v4 = signedVolume6(a, b, c, p);

  // Normalize by total signed volume
  const l1 = v1 / vTot;
  const l2 = v2 / vTot;
  const l3 = v3 / vTot;
  const l4 = v4 / vTot;

  return l1 >= -tol && l2 >= -tol && l3 >= -tol && l4 >= -tol;
}

// ==========================================
// Base Solid Abstract Classes
// ==========================================

export abstract class BaseSolid extends BasePrimitive {
  public override type = 'solid' as const;
  public override dimension: 2 | 3 = 3;

  abstract get kind(): string;
  abstract volume(): number;
  abstract surfaceArea(): number;
  abstract lateralArea(): number;
  abstract containsPoint(pt: Coords3D, tolerance?: number): boolean;
  abstract boundingBox(): { min: Coords3D; max: Coords3D };
}

export abstract class PolyhedronSolid extends BaseSolid {
  abstract get vertices(): Point3D[];
  abstract get edges(): Array<[number, number]>;
  abstract get faces(): number[][];

  getSegments(): Segment3D[] {
    const verts = this.vertices;
    return this.edges.map(([i1, i2]) => {
      const p1 = verts[i1]?.coords ?? { x: 0, y: 0, z: 0 };
      const p2 = verts[i2]?.coords ?? { x: 0, y: 0, z: 0 };
      return new Segment3D(p1, p2);
    });
  }

  boundingBox(): { min: Coords3D; max: Coords3D } {
    const verts = this.vertices;
    if (verts.length === 0) {
      return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
    }
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const v of verts) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.z < minZ) minZ = v.z;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
      if (v.z > maxZ) maxZ = v.z;
    }
    return { min: { x: minX, y: minY, z: minZ }, max: { x: maxX, y: maxY, z: maxZ } };
  }
}

export abstract class CurvedSolid extends BaseSolid {}

// ==========================================
// 1. Cube (Hình lập phương)
// ==========================================

export interface CubeDef extends GeometryObjectDefinition {
  kind: 'cube';
  origin: Coords3D;
  size: number;
}

export class Cube extends PolyhedronSolid {
  constructor(public origin: Coords3D, public size: number, id?: string) {
    super(id);
    if (size <= 0 || !isFinite(size)) {
      throw new Error('Cube size must be a positive number');
    }
  }

  get kind(): 'cube' {
    return 'cube';
  }

  get definition(): CubeDef {
    return {
      kind: 'cube',
      origin: this.origin,
      size: this.size
    };
  }

  get vertices(): Point3D[] {
    const { x, y, z } = this.origin;
    const s = this.size;
    return [
      new Point3D(x, y, z),         // 0: đáy dưới
      new Point3D(x + s, y, z),     // 1
      new Point3D(x + s, y + s, z), // 2
      new Point3D(x, y + s, z),     // 3
      new Point3D(x, y, z + s),     // 4: đáy trên
      new Point3D(x + s, y, z + s), // 5
      new Point3D(x + s, y + s, z + s), // 6
      new Point3D(x, y + s, z + s)  // 7
    ];
  }

  get edges(): Array<[number, number]> {
    return [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom
      [4, 5], [5, 6], [6, 7], [7, 4], // Top
      [0, 4], [1, 5], [2, 6], [3, 7]  // Vertical
    ];
  }

  get faces(): number[][] {
    return [
      [0, 3, 2, 1], // Bottom (z = min)
      [4, 5, 6, 7], // Top (z = max)
      [0, 1, 5, 4], // Front (y = min)
      [2, 3, 7, 6], // Back (y = max)
      [0, 4, 7, 3], // Left (x = min)
      [1, 2, 6, 5]  // Right (x = max)
    ];
  }

  volume(): number {
    return this.size * this.size * this.size;
  }

  surfaceArea(): number {
    return 6 * this.size * this.size;
  }

  lateralArea(): number {
    return 4 * this.size * this.size;
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const { x, y, z } = this.origin;
    const s = this.size;
    return (
      pt.x >= x - tolerance && pt.x <= x + s + tolerance &&
      pt.y >= y - tolerance && pt.y <= y + s + tolerance &&
      pt.z >= z - tolerance && pt.z <= z + s + tolerance
    );
  }

  static fromCenterAndSize(center: Coords3D, size: number, id?: string): Cube {
    const half = size / 2;
    return new Cube({ x: center.x - half, y: center.y - half, z: center.z - half }, size, id);
  }

  static fromTwoPoints(p1: Coords3D, p2: Coords3D, id?: string): Cube {
    const size = Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
    return new Cube(p1, size, id);
  }

  toString(): string {
    return `Cube(origin: (${this.origin.x.toFixed(2)}, ${this.origin.y.toFixed(2)}, ${this.origin.z.toFixed(2)}), size: ${this.size.toFixed(2)})`;
  }
}

// ==========================================
// 2. Cuboid (Hình hộp chữ nhật)
// ==========================================

export interface CuboidDef extends GeometryObjectDefinition {
  kind: 'cuboid';
  origin: Coords3D;
  width: number;
  depth: number;
  height: number;
}

export class Cuboid extends PolyhedronSolid {
  constructor(
    public origin: Coords3D,
    public width: number,
    public depth: number,
    public height: number,
    id?: string
  ) {
    super(id);
    if (width <= 0 || depth <= 0 || height <= 0 || !isFinite(width) || !isFinite(depth) || !isFinite(height)) {
      throw new Error('Cuboid dimensions (width, depth, height) must be positive numbers');
    }
  }

  get kind(): 'cuboid' {
    return 'cuboid';
  }

  get definition(): CuboidDef {
    return {
      kind: 'cuboid',
      origin: this.origin,
      width: this.width,
      depth: this.depth,
      height: this.height
    };
  }

  get vertices(): Point3D[] {
    const { x, y, z } = this.origin;
    const { width: w, depth: d, height: h } = this;
    return [
      new Point3D(x, y, z),         // 0
      new Point3D(x + w, y, z),     // 1
      new Point3D(x + w, y + d, z), // 2
      new Point3D(x, y + d, z),     // 3
      new Point3D(x, y, z + h),     // 4
      new Point3D(x + w, y, z + h), // 5
      new Point3D(x + w, y + d, z + h), // 6
      new Point3D(x, y + d, z + h)  // 7
    ];
  }

  get edges(): Array<[number, number]> {
    return [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom
      [4, 5], [5, 6], [6, 7], [7, 4], // Top
      [0, 4], [1, 5], [2, 6], [3, 7]  // Vertical
    ];
  }

  get faces(): number[][] {
    return [
      [0, 3, 2, 1], // Bottom
      [4, 5, 6, 7], // Top
      [0, 1, 5, 4], // Front
      [2, 3, 7, 6], // Back
      [0, 4, 7, 3], // Left
      [1, 2, 6, 5]  // Right
    ];
  }

  volume(): number {
    return this.width * this.depth * this.height;
  }

  surfaceArea(): number {
    const { width: w, depth: d, height: h } = this;
    return 2 * (w * d + d * h + h * w);
  }

  lateralArea(): number {
    const { width: w, depth: d, height: h } = this;
    return 2 * h * (w + d);
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const { x, y, z } = this.origin;
    const { width: w, depth: d, height: h } = this;
    return (
      pt.x >= x - tolerance && pt.x <= x + w + tolerance &&
      pt.y >= y - tolerance && pt.y <= y + d + tolerance &&
      pt.z >= z - tolerance && pt.z <= z + h + tolerance
    );
  }

  static fromCenterAndDimensions(center: Coords3D, width: number, depth: number, height: number, id?: string): Cuboid {
    return new Cuboid(
      { x: center.x - width / 2, y: center.y - depth / 2, z: center.z - height / 2 },
      width,
      depth,
      height,
      id
    );
  }

  static fromTwoCorners(p1: Coords3D, p2: Coords3D, id?: string): Cuboid {
    const origin = {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
      z: Math.min(p1.z, p2.z)
    };
    const width = Math.abs(p2.x - p1.x);
    const depth = Math.abs(p2.y - p1.y);
    const height = Math.abs(p2.z - p1.z);
    return new Cuboid(origin, width, depth, height, id);
  }

  toString(): string {
    return `Cuboid(origin: (${this.origin.x.toFixed(2)}, ${this.origin.y.toFixed(2)}, ${this.origin.z.toFixed(2)}), w: ${this.width.toFixed(2)}, d: ${this.depth.toFixed(2)}, h: ${this.height.toFixed(2)})`;
  }
}

// ==========================================
// 3. Tetrahedron (Hình tứ diện)
// ==========================================

export interface TetrahedronDef extends GeometryObjectDefinition {
  kind: 'tetrahedron';
  a: Coords3D;
  b: Coords3D;
  c: Coords3D;
  d: Coords3D;
}

export class Tetrahedron extends PolyhedronSolid {
  constructor(
    public a: Coords3D,
    public b: Coords3D,
    public c: Coords3D,
    public d: Coords3D,
    id?: string
  ) {
    super(id);
  }

  get kind(): 'tetrahedron' {
    return 'tetrahedron';
  }

  get definition(): TetrahedronDef {
    return {
      kind: 'tetrahedron',
      a: this.a,
      b: this.b,
      c: this.c,
      d: this.d
    };
  }

  get vertices(): Point3D[] {
    return [
      new Point3D(this.a.x, this.a.y, this.a.z),
      new Point3D(this.b.x, this.b.y, this.b.z),
      new Point3D(this.c.x, this.c.y, this.c.z),
      new Point3D(this.d.x, this.d.y, this.d.z)
    ];
  }

  get edges(): Array<[number, number]> {
    return [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [1, 3], [2, 3]
    ];
  }

  get faces(): number[][] {
    return [
      [0, 1, 2], // Face ABC
      [0, 1, 3], // Face ABD
      [0, 2, 3], // Face ACD
      [1, 2, 3]  // Face BCD
    ];
  }

  volume(): number {
    return tetrahedronVolume(this.a, this.b, this.c, this.d);
  }

  surfaceArea(): number {
    return (
      triangleArea3D(this.a, this.b, this.c) +
      triangleArea3D(this.a, this.b, this.d) +
      triangleArea3D(this.a, this.c, this.d) +
      triangleArea3D(this.b, this.c, this.d)
    );
  }

  lateralArea(): number {
    // Với đáy ABC, 3 mặt bên là ABD, ACD, BCD
    return (
      triangleArea3D(this.a, this.b, this.d) +
      triangleArea3D(this.a, this.c, this.d) +
      triangleArea3D(this.b, this.c, this.d)
    );
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    return isPointInsideTetrahedron(pt, this.a, this.b, this.c, this.d, tolerance);
  }

  static regular(center: Coords3D, edgeLength: number, id?: string): Tetrahedron {
    if (edgeLength <= 0 || !isFinite(edgeLength)) {
      throw new Error('Tetrahedron edge length must be positive');
    }
    // R = edgeLength * sqrt(6)/4
    const r = (edgeLength * Math.sqrt(6)) / 4;
    const a: Coords3D = { x: center.x, y: center.y, z: center.z + r };
    const b: Coords3D = {
      x: center.x + ((2 * Math.sqrt(2)) / 3) * r,
      y: center.y,
      z: center.z - r / 3
    };
    const c: Coords3D = {
      x: center.x - (Math.sqrt(2) / 3) * r,
      y: center.y + (Math.sqrt(6) / 3) * r,
      z: center.z - r / 3
    };
    const d: Coords3D = {
      x: center.x - (Math.sqrt(2) / 3) * r,
      y: center.y - (Math.sqrt(6) / 3) * r,
      z: center.z - r / 3
    };
    return new Tetrahedron(a, b, c, d, id);
  }

  toString(): string {
    return `Tetrahedron(A: (${this.a.x.toFixed(2)}, ${this.a.y.toFixed(2)}, ${this.a.z.toFixed(2)}), B: (${this.b.x.toFixed(2)}, ${this.b.y.toFixed(2)}, ${this.b.z.toFixed(2)}), C: (${this.c.x.toFixed(2)}, ${this.c.y.toFixed(2)}, ${this.c.z.toFixed(2)}), D: (${this.d.x.toFixed(2)}, ${this.d.y.toFixed(2)}, ${this.d.z.toFixed(2)}))`;
  }
}

// ==========================================
// 4. Pyramid (Hình chóp)
// ==========================================

export interface PyramidDef extends GeometryObjectDefinition {
  kind: 'pyramid';
  apex: Coords3D;
  baseVertices: Coords3D[];
}

export class Pyramid extends PolyhedronSolid {
  constructor(public apex: Coords3D, public baseVertices: Coords3D[], id?: string) {
    super(id);
    if (!baseVertices || baseVertices.length < 3) {
      throw new Error('Pyramid base must have at least 3 vertices');
    }
  }

  get kind(): 'pyramid' {
    return 'pyramid';
  }

  get definition(): PyramidDef {
    return {
      kind: 'pyramid',
      apex: this.apex,
      baseVertices: this.baseVertices.map(v => ({ x: v.x, y: v.y, z: v.z }))
    };
  }

  get vertices(): Point3D[] {
    const list = this.baseVertices.map(v => new Point3D(v.x, v.y, v.z));
    list.push(new Point3D(this.apex.x, this.apex.y, this.apex.z));
    return list;
  }

  get edges(): Array<[number, number]> {
    const n = this.baseVertices.length;
    const edges: Array<[number, number]> = [];
    // Base edges
    for (let i = 0; i < n; i++) {
      edges.push([i, (i + 1) % n]);
    }
    // Lateral edges connecting to apex (index n)
    for (let i = 0; i < n; i++) {
      edges.push([i, n]);
    }
    return edges;
  }

  get faces(): number[][] {
    const n = this.baseVertices.length;
    const faces: number[][] = [];
    // Base face
    const baseFace: number[] = [];
    for (let i = 0; i < n; i++) {
      baseFace.push(i);
    }
    faces.push(baseFace);
    // Lateral faces (triangles with apex n)
    for (let i = 0; i < n; i++) {
      faces.push([i, (i + 1) % n, n]);
    }
    return faces;
  }

  volume(): number {
    const n = this.baseVertices.length;
    let totalVol = 0;
    const p0 = this.baseVertices[0]!;
    // Triangulate base from p0 and sum tetrahedra with apex
    for (let i = 1; i < n - 1; i++) {
      const p1 = this.baseVertices[i]!;
      const p2 = this.baseVertices[i + 1]!;
      totalVol += tetrahedronVolume(this.apex, p0, p1, p2);
    }
    return totalVol;
  }

  lateralArea(): number {
    const n = this.baseVertices.length;
    let lat = 0;
    for (let i = 0; i < n; i++) {
      const p1 = this.baseVertices[i]!;
      const p2 = this.baseVertices[(i + 1) % n]!;
      lat += triangleArea3D(p1, p2, this.apex);
    }
    return lat;
  }

  surfaceArea(): number {
    const base = polygonArea3D(this.baseVertices);
    return base + this.lateralArea();
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const n = this.baseVertices.length;
    const p0 = this.baseVertices[0]!;
    for (let i = 1; i < n - 1; i++) {
      const p1 = this.baseVertices[i]!;
      const p2 = this.baseVertices[i + 1]!;
      if (isPointInsideTetrahedron(pt, this.apex, p0, p1, p2, tolerance)) {
        return true;
      }
    }
    return false;
  }

  static regular(baseCenter: Coords3D, radius: number, sides: number, height: number, id?: string): Pyramid {
    if (sides < 3) throw new Error('Sides must be at least 3');
    if (radius <= 0) throw new Error('Radius must be positive');
    if (height <= 0) throw new Error('Height must be positive');

    const baseVertices: Coords3D[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides;
      baseVertices.push({
        x: baseCenter.x + radius * Math.cos(angle),
        y: baseCenter.y + radius * Math.sin(angle),
        z: baseCenter.z
      });
    }
    const apex: Coords3D = {
      x: baseCenter.x,
      y: baseCenter.y,
      z: baseCenter.z + height
    };
    return new Pyramid(apex, baseVertices, id);
  }

  toString(): string {
    return `Pyramid(apex: (${this.apex.x.toFixed(2)}, ${this.apex.y.toFixed(2)}, ${this.apex.z.toFixed(2)}), baseVertices: ${this.baseVertices.length})`;
  }
}

// ==========================================
// 5. Prism (Hình lăng trụ)
// ==========================================

export interface PrismDef extends GeometryObjectDefinition {
  kind: 'prism';
  baseVertices: Coords3D[];
  topVertices: Coords3D[];
}

export class Prism extends PolyhedronSolid {
  constructor(public baseVertices: Coords3D[], public topVertices: Coords3D[], id?: string) {
    super(id);
    if (!baseVertices || !topVertices || baseVertices.length < 3 || baseVertices.length !== topVertices.length) {
      throw new Error('Prism base and top must have the same number of vertices (>= 3)');
    }
  }

  get kind(): 'prism' {
    return 'prism';
  }

  get definition(): PrismDef {
    return {
      kind: 'prism',
      baseVertices: this.baseVertices.map(v => ({ x: v.x, y: v.y, z: v.z })),
      topVertices: this.topVertices.map(v => ({ x: v.x, y: v.y, z: v.z }))
    };
  }

  get vertices(): Point3D[] {
    const verts: Point3D[] = [];
    for (const v of this.baseVertices) {
      verts.push(new Point3D(v.x, v.y, v.z));
    }
    for (const v of this.topVertices) {
      verts.push(new Point3D(v.x, v.y, v.z));
    }
    return verts;
  }

  get edges(): Array<[number, number]> {
    const n = this.baseVertices.length;
    const edges: Array<[number, number]> = [];
    // Bottom edges
    for (let i = 0; i < n; i++) {
      edges.push([i, (i + 1) % n]);
    }
    // Top edges
    for (let i = 0; i < n; i++) {
      edges.push([n + i, n + ((i + 1) % n)]);
    }
    // Vertical / lateral edges
    for (let i = 0; i < n; i++) {
      edges.push([i, n + i]);
    }
    return edges;
  }

  get faces(): number[][] {
    const n = this.baseVertices.length;
    const faces: number[][] = [];
    // Bottom face
    const bottomFace: number[] = [];
    for (let i = 0; i < n; i++) {
      bottomFace.push(i);
    }
    faces.push(bottomFace);
    // Top face
    const topFace: number[] = [];
    for (let i = 0; i < n; i++) {
      topFace.push(n + i);
    }
    faces.push(topFace);
    // Lateral faces (quadrilaterals)
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      faces.push([i, next, n + next, n + i]);
    }
    return faces;
  }

  volume(): number {
    const n = this.baseVertices.length;
    let totalVol = 0;
    const b0 = this.baseVertices[0]!;
    // Decompose triangular prism sections into 3 tetrahedra each
    for (let i = 1; i < n - 1; i++) {
      const bi = this.baseVertices[i]!;
      const bj = this.baseVertices[i + 1]!;
      const t0 = this.topVertices[0]!;
      const ti = this.topVertices[i]!;
      const tj = this.topVertices[i + 1]!;

      // Triangular prism (b0, bi, bj, t0, ti, tj) decomposes into 3 tetrahedra:
      // (b0, bi, bj, tj), (b0, bi, ti, tj), (b0, t0, ti, tj)
      totalVol += tetrahedronVolume(b0, bi, bj, tj);
      totalVol += tetrahedronVolume(b0, bi, ti, tj);
      totalVol += tetrahedronVolume(b0, t0, ti, tj);
    }
    return totalVol;
  }

  lateralArea(): number {
    const n = this.baseVertices.length;
    let lat = 0;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const b1 = this.baseVertices[i]!;
      const b2 = this.baseVertices[next]!;
      const t2 = this.topVertices[next]!;
      const t1 = this.topVertices[i]!;
      // Split quadrilateral face into two triangles
      lat += triangleArea3D(b1, b2, t2) + triangleArea3D(b1, t2, t1);
    }
    return lat;
  }

  surfaceArea(): number {
    const sBase = polygonArea3D(this.baseVertices);
    const sTop = polygonArea3D(this.topVertices);
    return sBase + sTop + this.lateralArea();
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const n = this.baseVertices.length;
    const b0 = this.baseVertices[0]!;
    for (let i = 1; i < n - 1; i++) {
      const bi = this.baseVertices[i]!;
      const bj = this.baseVertices[i + 1]!;
      const t0 = this.topVertices[0]!;
      const ti = this.topVertices[i]!;
      const tj = this.topVertices[i + 1]!;

      if (
        isPointInsideTetrahedron(pt, b0, bi, bj, tj, tolerance) ||
        isPointInsideTetrahedron(pt, b0, bi, ti, tj, tolerance) ||
        isPointInsideTetrahedron(pt, b0, t0, ti, tj, tolerance)
      ) {
        return true;
      }
    }
    return false;
  }

  static fromBaseAndVector(baseVertices: Coords3D[], extrusionVector: Coords3D | Vector3D, id?: string): Prism {
    const vec = extrusionVector instanceof Vector3D
      ? extrusionVector
      : new Vector3D(extrusionVector.x, extrusionVector.y, extrusionVector.z);

    const topVertices = baseVertices.map(v => ({
      x: v.x + vec.x,
      y: v.y + vec.y,
      z: v.z + vec.z
    }));
    return new Prism(baseVertices, topVertices, id);
  }

  static regular(baseCenter: Coords3D, radius: number, sides: number, height: number, id?: string): Prism {
    if (sides < 3) throw new Error('Sides must be at least 3');
    if (radius <= 0) throw new Error('Radius must be positive');
    if (height <= 0) throw new Error('Height must be positive');

    const baseVertices: Coords3D[] = [];
    const topVertices: Coords3D[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides;
      const x = baseCenter.x + radius * Math.cos(angle);
      const y = baseCenter.y + radius * Math.sin(angle);
      baseVertices.push({ x, y, z: baseCenter.z });
      topVertices.push({ x, y, z: baseCenter.z + height });
    }
    return new Prism(baseVertices, topVertices, id);
  }

  toString(): string {
    return `Prism(baseVertices: ${this.baseVertices.length}, topVertices: ${this.topVertices.length})`;
  }
}

// ==========================================
// 6. PyramidalFrustum (Hình chóp cụt)
// ==========================================

export interface PyramidalFrustumDef extends GeometryObjectDefinition {
  kind: 'pyramidal_frustum';
  bottomVertices: Coords3D[];
  topVertices: Coords3D[];
}

export class PyramidalFrustum extends PolyhedronSolid {
  constructor(public bottomVertices: Coords3D[], public topVertices: Coords3D[], id?: string) {
    super(id);
    if (!bottomVertices || !topVertices || bottomVertices.length < 3 || bottomVertices.length !== topVertices.length) {
      throw new Error('PyramidalFrustum bottom and top must have the same number of vertices (>= 3)');
    }
  }

  get kind(): 'pyramidal_frustum' {
    return 'pyramidal_frustum';
  }

  get definition(): PyramidalFrustumDef {
    return {
      kind: 'pyramidal_frustum',
      bottomVertices: this.bottomVertices.map(v => ({ x: v.x, y: v.y, z: v.z })),
      topVertices: this.topVertices.map(v => ({ x: v.x, y: v.y, z: v.z }))
    };
  }

  get vertices(): Point3D[] {
    const verts: Point3D[] = [];
    for (const v of this.bottomVertices) {
      verts.push(new Point3D(v.x, v.y, v.z));
    }
    for (const v of this.topVertices) {
      verts.push(new Point3D(v.x, v.y, v.z));
    }
    return verts;
  }

  get edges(): Array<[number, number]> {
    const n = this.bottomVertices.length;
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n]);
    for (let i = 0; i < n; i++) edges.push([n + i, n + ((i + 1) % n)]);
    for (let i = 0; i < n; i++) edges.push([i, n + i]);
    return edges;
  }

  get faces(): number[][] {
    const n = this.bottomVertices.length;
    const faces: number[][] = [];
    const bottomFace: number[] = [];
    for (let i = 0; i < n; i++) bottomFace.push(i);
    faces.push(bottomFace);
    const topFace: number[] = [];
    for (let i = 0; i < n; i++) topFace.push(n + i);
    faces.push(topFace);
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      faces.push([i, next, n + next, n + i]);
    }
    return faces;
  }

  volume(): number {
    const n = this.bottomVertices.length;
    let totalVol = 0;
    const b0 = this.bottomVertices[0]!;
    // Decompose into tetrahedra matching triangular frustum sections
    for (let i = 1; i < n - 1; i++) {
      const bi = this.bottomVertices[i]!;
      const bj = this.bottomVertices[i + 1]!;
      const t0 = this.topVertices[0]!;
      const ti = this.topVertices[i]!;
      const tj = this.topVertices[i + 1]!;

      totalVol += tetrahedronVolume(b0, bi, bj, tj);
      totalVol += tetrahedronVolume(b0, bi, ti, tj);
      totalVol += tetrahedronVolume(b0, t0, ti, tj);
    }
    return totalVol;
  }

  lateralArea(): number {
    const n = this.bottomVertices.length;
    let lat = 0;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const b1 = this.bottomVertices[i]!;
      const b2 = this.bottomVertices[next]!;
      const t2 = this.topVertices[next]!;
      const t1 = this.topVertices[i]!;
      lat += triangleArea3D(b1, b2, t2) + triangleArea3D(b1, t2, t1);
    }
    return lat;
  }

  surfaceArea(): number {
    const sBottom = polygonArea3D(this.bottomVertices);
    const sTop = polygonArea3D(this.topVertices);
    return sBottom + sTop + this.lateralArea();
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const n = this.bottomVertices.length;
    const b0 = this.bottomVertices[0]!;
    for (let i = 1; i < n - 1; i++) {
      const bi = this.bottomVertices[i]!;
      const bj = this.bottomVertices[i + 1]!;
      const t0 = this.topVertices[0]!;
      const ti = this.topVertices[i]!;
      const tj = this.topVertices[i + 1]!;

      if (
        isPointInsideTetrahedron(pt, b0, bi, bj, tj, tolerance) ||
        isPointInsideTetrahedron(pt, b0, bi, ti, tj, tolerance) ||
        isPointInsideTetrahedron(pt, b0, t0, ti, tj, tolerance)
      ) {
        return true;
      }
    }
    return false;
  }

  toString(): string {
    return `PyramidalFrustum(bottomVertices: ${this.bottomVertices.length}, topVertices: ${this.topVertices.length})`;
  }
}

// ==========================================
// 7. Sphere (Hình cầu)
// ==========================================

export interface SphereDef extends GeometryObjectDefinition {
  kind: 'sphere';
  center: Coords3D;
  radius: number;
}

export class Sphere extends CurvedSolid {
  constructor(public center: Coords3D, public radius: number, id?: string) {
    super(id);
    if (radius <= 0 || !isFinite(radius)) {
      throw new Error('Sphere radius must be a positive number');
    }
  }

  get kind(): 'sphere' {
    return 'sphere';
  }

  get definition(): SphereDef {
    return {
      kind: 'sphere',
      center: this.center,
      radius: this.radius
    };
  }

  volume(): number {
    return (4 / 3) * Math.PI * Math.pow(this.radius, 3);
  }

  surfaceArea(): number {
    return 4 * Math.PI * Math.pow(this.radius, 2);
  }

  lateralArea(): number {
    return this.surfaceArea();
  }

  distanceToPoint(pt: Coords3D): number {
    const distToCenter = Math.hypot(pt.x - this.center.x, pt.y - this.center.y, pt.z - this.center.z);
    return Math.abs(distToCenter - this.radius);
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const distToCenter = Math.hypot(pt.x - this.center.x, pt.y - this.center.y, pt.z - this.center.z);
    return distToCenter <= this.radius + tolerance;
  }

  boundingBox(): { min: Coords3D; max: Coords3D } {
    const { x, y, z } = this.center;
    const r = this.radius;
    return {
      min: { x: x - r, y: y - r, z: z - r },
      max: { x: x + r, y: y + r, z: z + r }
    };
  }

  static fromDiameter(p1: Coords3D, p2: Coords3D, id?: string): Sphere {
    const center: Coords3D = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      z: (p1.z + p2.z) / 2
    };
    const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z) / 2;
    return new Sphere(center, radius, id);
  }

  toString(): string {
    return `Sphere(center: (${this.center.x.toFixed(2)}, ${this.center.y.toFixed(2)}, ${this.center.z.toFixed(2)}), r: ${this.radius.toFixed(2)})`;
  }
}

// ==========================================
// 8. Cylinder (Hình trụ)
// ==========================================

export interface CylinderDef extends GeometryObjectDefinition {
  kind: 'cylinder';
  bottomCenter: Coords3D;
  topCenter: Coords3D;
  radius: number;
}

export class Cylinder extends CurvedSolid {
  constructor(
    public bottomCenter: Coords3D,
    public topCenter: Coords3D,
    public radius: number,
    id?: string
  ) {
    super(id);
    if (radius <= 0 || !isFinite(radius)) {
      throw new Error('Cylinder radius must be a positive number');
    }
    const h = Math.hypot(
      topCenter.x - bottomCenter.x,
      topCenter.y - bottomCenter.y,
      topCenter.z - bottomCenter.z
    );
    if (h <= 1e-10) {
      throw new Error('Cylinder bottomCenter and topCenter cannot be coincident');
    }
  }

  get kind(): 'cylinder' {
    return 'cylinder';
  }

  get definition(): CylinderDef {
    return {
      kind: 'cylinder',
      bottomCenter: this.bottomCenter,
      topCenter: this.topCenter,
      radius: this.radius
    };
  }

  get height(): number {
    return Math.hypot(
      this.topCenter.x - this.bottomCenter.x,
      this.topCenter.y - this.bottomCenter.y,
      this.topCenter.z - this.bottomCenter.z
    );
  }

  volume(): number {
    return Math.PI * Math.pow(this.radius, 2) * this.height;
  }

  lateralArea(): number {
    return 2 * Math.PI * this.radius * this.height;
  }

  surfaceArea(): number {
    return this.lateralArea() + 2 * Math.PI * Math.pow(this.radius, 2);
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const h = this.height;
    const axis = Vector3D.fromTwoPoints(this.bottomCenter, this.topCenter).normalize();
    const v = Vector3D.fromTwoPoints(this.bottomCenter, pt);

    const t = v.dot(axis); // Coordinate along axis
    if (t < -tolerance || t > h + tolerance) {
      return false;
    }

    // Perpendicular component to axis
    const vPerp = v.subtract(axis.scale(t));
    return vPerp.magnitude() <= this.radius + tolerance;
  }

  boundingBox(): { min: Coords3D; max: Coords3D } {
    const r = this.radius;
    const b = this.bottomCenter;
    const t = this.topCenter;
    return {
      min: {
        x: Math.min(b.x, t.x) - r,
        y: Math.min(b.y, t.y) - r,
        z: Math.min(b.z, t.z) - r
      },
      max: {
        x: Math.max(b.x, t.x) + r,
        y: Math.max(b.y, t.y) + r,
        z: Math.max(b.z, t.z) + r
      }
    };
  }

  static fromCenterHeightRadius(
    center: Coords3D,
    height: number,
    radius: number,
    axis?: Coords3D | Vector3D,
    id?: string
  ): Cylinder {
    if (height <= 0) throw new Error('Height must be positive');
    const ax = axis ? (axis instanceof Vector3D ? axis.normalize() : new Vector3D(axis.x, axis.y, axis.z).normalize()) : new Vector3D(0, 0, 1);
    const bottomCenter: Coords3D = {
      x: center.x - ax.x * (height / 2),
      y: center.y - ax.y * (height / 2),
      z: center.z - ax.z * (height / 2)
    };
    const topCenter: Coords3D = {
      x: center.x + ax.x * (height / 2),
      y: center.y + ax.y * (height / 2),
      z: center.z + ax.z * (height / 2)
    };
    return new Cylinder(bottomCenter, topCenter, radius, id);
  }

  toString(): string {
    return `Cylinder(r: ${this.radius.toFixed(2)}, h: ${this.height.toFixed(2)})`;
  }
}

// ==========================================
// 9. Cone (Hình nón)
// ==========================================

export interface ConeDef extends GeometryObjectDefinition {
  kind: 'cone';
  baseCenter: Coords3D;
  apex: Coords3D;
  radius: number;
}

export class Cone extends CurvedSolid {
  constructor(
    public baseCenter: Coords3D,
    public apex: Coords3D,
    public radius: number,
    id?: string
  ) {
    super(id);
    if (radius <= 0 || !isFinite(radius)) {
      throw new Error('Cone radius must be a positive number');
    }
    const h = Math.hypot(
      apex.x - baseCenter.x,
      apex.y - baseCenter.y,
      apex.z - baseCenter.z
    );
    if (h <= 1e-10) {
      throw new Error('Cone baseCenter and apex cannot be coincident');
    }
  }

  get kind(): 'cone' {
    return 'cone';
  }

  get definition(): ConeDef {
    return {
      kind: 'cone',
      baseCenter: this.baseCenter,
      apex: this.apex,
      radius: this.radius
    };
  }

  get height(): number {
    return Math.hypot(
      this.apex.x - this.baseCenter.x,
      this.apex.y - this.baseCenter.y,
      this.apex.z - this.baseCenter.z
    );
  }

  get slantHeight(): number {
    const h = this.height;
    return Math.hypot(h, this.radius);
  }

  volume(): number {
    return (1 / 3) * Math.PI * Math.pow(this.radius, 2) * this.height;
  }

  lateralArea(): number {
    return Math.PI * this.radius * this.slantHeight;
  }

  surfaceArea(): number {
    return this.lateralArea() + Math.PI * Math.pow(this.radius, 2);
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const h = this.height;
    const axis = Vector3D.fromTwoPoints(this.baseCenter, this.apex).normalize();
    const v = Vector3D.fromTwoPoints(this.baseCenter, pt);

    const t = v.dot(axis); // 0 at base, h at apex
    if (t < -tolerance || t > h + tolerance) {
      return false;
    }

    const currentRadius = this.radius * (1 - Math.max(0, Math.min(h, t)) / h);
    const vPerp = v.subtract(axis.scale(t));
    return vPerp.magnitude() <= currentRadius + tolerance;
  }

  boundingBox(): { min: Coords3D; max: Coords3D } {
    const r = this.radius;
    const b = this.baseCenter;
    const a = this.apex;
    return {
      min: {
        x: Math.min(b.x - r, a.x),
        y: Math.min(b.y - r, a.y),
        z: Math.min(b.z - r, a.z)
      },
      max: {
        x: Math.max(b.x + r, a.x),
        y: Math.max(b.y + r, a.y),
        z: Math.max(b.z + r, a.z)
      }
    };
  }

  static fromCenterHeightRadius(
    baseCenter: Coords3D,
    height: number,
    radius: number,
    axis?: Coords3D | Vector3D,
    id?: string
  ): Cone {
    if (height <= 0) throw new Error('Height must be positive');
    const ax = axis ? (axis instanceof Vector3D ? axis.normalize() : new Vector3D(axis.x, axis.y, axis.z).normalize()) : new Vector3D(0, 0, 1);
    const apex: Coords3D = {
      x: baseCenter.x + ax.x * height,
      y: baseCenter.y + ax.y * height,
      z: baseCenter.z + ax.z * height
    };
    return new Cone(baseCenter, apex, radius, id);
  }

  toString(): string {
    return `Cone(r: ${this.radius.toFixed(2)}, h: ${this.height.toFixed(2)})`;
  }
}

// ==========================================
// 10. Frustum (Hình nón cụt / Conical Frustum)
// ==========================================

export interface FrustumDef extends GeometryObjectDefinition {
  kind: 'frustum';
  bottomCenter: Coords3D;
  topCenter: Coords3D;
  bottomRadius: number;
  topRadius: number;
}

export class Frustum extends CurvedSolid {
  constructor(
    public bottomCenter: Coords3D,
    public topCenter: Coords3D,
    public bottomRadius: number,
    public topRadius: number,
    id?: string
  ) {
    super(id);
    if (bottomRadius < 0 || topRadius < 0 || (bottomRadius === 0 && topRadius === 0) || !isFinite(bottomRadius) || !isFinite(topRadius)) {
      throw new Error('Frustum radii must be non-negative and at least one must be positive');
    }
    const h = Math.hypot(
      topCenter.x - bottomCenter.x,
      topCenter.y - bottomCenter.y,
      topCenter.z - bottomCenter.z
    );
    if (h <= 1e-10) {
      throw new Error('Frustum bottomCenter and topCenter cannot be coincident');
    }
  }

  get kind(): 'frustum' {
    return 'frustum';
  }

  get definition(): FrustumDef {
    return {
      kind: 'frustum',
      bottomCenter: this.bottomCenter,
      topCenter: this.topCenter,
      bottomRadius: this.bottomRadius,
      topRadius: this.topRadius
    };
  }

  get height(): number {
    return Math.hypot(
      this.topCenter.x - this.bottomCenter.x,
      this.topCenter.y - this.bottomCenter.y,
      this.topCenter.z - this.bottomCenter.z
    );
  }

  get slantHeight(): number {
    const h = this.height;
    return Math.hypot(h, this.bottomRadius - this.topRadius);
  }

  volume(): number {
    const r1 = this.bottomRadius;
    const r2 = this.topRadius;
    return (1 / 3) * Math.PI * this.height * (r1 * r1 + r1 * r2 + r2 * r2);
  }

  lateralArea(): number {
    return Math.PI * (this.bottomRadius + this.topRadius) * this.slantHeight;
  }

  surfaceArea(): number {
    const r1 = this.bottomRadius;
    const r2 = this.topRadius;
    return this.lateralArea() + Math.PI * (r1 * r1 + r2 * r2);
  }

  containsPoint(pt: Coords3D, tolerance = 1e-6): boolean {
    const h = this.height;
    const axis = Vector3D.fromTwoPoints(this.bottomCenter, this.topCenter).normalize();
    const v = Vector3D.fromTwoPoints(this.bottomCenter, pt);

    const t = v.dot(axis);
    if (t < -tolerance || t > h + tolerance) {
      return false;
    }

    const frac = Math.max(0, Math.min(h, t)) / h;
    const currentRadius = this.bottomRadius + (this.topRadius - this.bottomRadius) * frac;
    const vPerp = v.subtract(axis.scale(t));
    return vPerp.magnitude() <= currentRadius + tolerance;
  }

  boundingBox(): { min: Coords3D; max: Coords3D } {
    const maxR = Math.max(this.bottomRadius, this.topRadius);
    const b = this.bottomCenter;
    const t = this.topCenter;
    return {
      min: {
        x: Math.min(b.x, t.x) - maxR,
        y: Math.min(b.y, t.y) - maxR,
        z: Math.min(b.z, t.z) - maxR
      },
      max: {
        x: Math.max(b.x, t.x) + maxR,
        y: Math.max(b.y, t.y) + maxR,
        z: Math.max(b.z, t.z) + maxR
      }
    };
  }

  static fromCenterHeightRadii(
    center: Coords3D,
    height: number,
    bottomRadius: number,
    topRadius: number,
    axis?: Coords3D | Vector3D,
    id?: string
  ): Frustum {
    if (height <= 0) throw new Error('Height must be positive');
    const ax = axis ? (axis instanceof Vector3D ? axis.normalize() : new Vector3D(axis.x, axis.y, axis.z).normalize()) : new Vector3D(0, 0, 1);
    const bottomCenter: Coords3D = {
      x: center.x - ax.x * (height / 2),
      y: center.y - ax.y * (height / 2),
      z: center.z - ax.z * (height / 2)
    };
    const topCenter: Coords3D = {
      x: center.x + ax.x * (height / 2),
      y: center.y + ax.y * (height / 2),
      z: center.z + ax.z * (height / 2)
    };
    return new Frustum(bottomCenter, topCenter, bottomRadius, topRadius, id);
  }

  toString(): string {
    return `Frustum(r1: ${this.bottomRadius.toFixed(2)}, r2: ${this.topRadius.toFixed(2)}, h: ${this.height.toFixed(2)})`;
  }
}
