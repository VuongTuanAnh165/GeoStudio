import { describe, it, expect } from 'vitest';
import {
  Point3D, Vector3D, Segment3D, Line3D, Plane,
  createPrimitiveFromJSON
} from '../../../../../core/geometry/primitives';

describe('Point3D Primitive', () => {
  it('creates Point3D with coordinates and 3D dimension', () => {
    const pt = new Point3D(1, 2, 3, 'p1');
    expect(pt.id).toBe('p1');
    expect(pt.x).toBe(1);
    expect(pt.y).toBe(2);
    expect(pt.z).toBe(3);
    expect(pt.dimension).toBe(3);
    expect(pt.type).toBe('point');
    expect(pt.coords).toEqual({ x: 1, y: 2, z: 3 });
    expect(pt.definition).toEqual({
      kind: 'point3d',
      coords: { x: 1, y: 2, z: 3 }
    });
  });

  it('calculates Euclidean distance in 3D', () => {
    const p1 = new Point3D(1, 2, 3);
    const p2 = new Point3D(4, 6, 3); // dx=3, dy=4, dz=0 -> dist=5
    expect(p1.distanceTo(p2)).toBeCloseTo(5);

    const p3 = new Point3D(1, 2, 3);
    const p4 = new Point3D(2, 4, 5); // dx=1, dy=2, dz=2 -> dist=3
    expect(p3.distanceTo(p4)).toBeCloseTo(3);
  });

  it('checks equality within tolerance', () => {
    const p1 = new Point3D(1.0000000001, 2, 3);
    const p2 = new Point3D(1, 2, 3);
    expect(p1.equals(p2, 1e-8)).toBe(true);
    expect(p1.equals(new Point3D(1, 2, 4))).toBe(false);
  });

  it('converts to Vector3D and string', () => {
    const pt = new Point3D(2, -3, 5);
    const vec = pt.toVector();
    expect(vec).toBeInstanceOf(Vector3D);
    expect(vec.x).toBe(2);
    expect(vec.y).toBe(-3);
    expect(vec.z).toBe(5);
    expect(pt.toString()).toContain('Point3D(2.00, -3.00, 5.00)');
  });
});

describe('Vector3D Primitive', () => {
  it('computes magnitude and magnitudeSquared', () => {
    const v = new Vector3D(2, 3, 6); // 4 + 9 + 36 = 49 -> mag=7
    expect(v.magnitudeSquared()).toBe(49);
    expect(v.magnitude()).toBeCloseTo(7);
  });

  it('normalizes vector correctly and handles zero vector', () => {
    const v = new Vector3D(0, 3, 4); // mag=5
    const unit = v.normalize();
    expect(unit.magnitude()).toBeCloseTo(1);
    expect(unit.x).toBeCloseTo(0);
    expect(unit.y).toBeCloseTo(0.6);
    expect(unit.z).toBeCloseTo(0.8);

    const zero = new Vector3D(0, 0, 0);
    expect(zero.normalize().magnitude()).toBe(0);
  });

  it('computes dot product and detects perpendicularity', () => {
    const v1 = new Vector3D(1, 2, 3);
    const v2 = new Vector3D(4, -5, 2); // 4 - 10 + 6 = 0
    expect(v1.dot(v2)).toBeCloseTo(0);
    expect(v1.isPerpendicular(v2)).toBe(true);

    const v3 = new Vector3D(1, 0, 0);
    const v4 = new Vector3D(2, 0, 0);
    expect(v3.dot(v4)).toBe(2);
    expect(v3.isPerpendicular(v4)).toBe(false);
  });

  it('computes cross product and verifies standard orthogonal basis', () => {
    const i = new Vector3D(1, 0, 0);
    const j = new Vector3D(0, 1, 0);
    const k = i.cross(j); // i x j = k
    expect(k.x).toBeCloseTo(0);
    expect(k.y).toBeCloseTo(0);
    expect(k.z).toBeCloseTo(1);

    const kCrossI = k.cross(i); // k x i = j
    expect(kCrossI.x).toBeCloseTo(0);
    expect(kCrossI.y).toBeCloseTo(1);
    expect(kCrossI.z).toBeCloseTo(0);
  });

  it('computes vector arithmetic (add, subtract, scale)', () => {
    const v1 = new Vector3D(1, 2, 3);
    const v2 = new Vector3D(4, 5, 6);

    const sum = v1.add(v2);
    expect(sum.x).toBe(5);
    expect(sum.y).toBe(7);
    expect(sum.z).toBe(9);

    const diff = v2.subtract(v1);
    expect(diff.x).toBe(3);
    expect(diff.y).toBe(3);
    expect(diff.z).toBe(3);

    const scaled = v1.scale(2.5);
    expect(scaled.x).toBe(2.5);
    expect(scaled.y).toBe(5);
    expect(scaled.z).toBe(7.5);
  });

  it('computes angle between vectors and detects parallelism', () => {
    const v1 = new Vector3D(1, 0, 0);
    const v2 = new Vector3D(0, 1, 0);
    expect(v1.angleTo(v2)).toBeCloseTo(Math.PI / 2);

    const vParallel = new Vector3D(3, 0, 0);
    expect(v1.isParallel(vParallel)).toBe(true);
    expect(v1.angleTo(vParallel)).toBeCloseTo(0);

    const vOpposite = new Vector3D(-2, 0, 0);
    expect(v1.isParallel(vOpposite)).toBe(true);
    expect(v1.angleTo(vOpposite)).toBeCloseTo(Math.PI);
  });

  it('constructs vector from two points', () => {
    const p1 = { x: 1, y: 2, z: 3 };
    const p2 = { x: 4, y: 6, z: 8 };
    const vec = Vector3D.fromTwoPoints(p1, p2);
    expect(vec.x).toBe(3);
    expect(vec.y).toBe(4);
    expect(vec.z).toBe(5);
  });
});

describe('Segment3D Primitive', () => {
  it('computes length, midpoint, and direction', () => {
    const p1 = { x: 0, y: 0, z: 0 };
    const p2 = { x: 2, y: 4, z: 4 }; // len = sqrt(4+16+16)=6
    const seg = new Segment3D(p1, p2, 'seg1');

    expect(seg.length).toBeCloseTo(6);
    expect(seg.dimension).toBe(3);
    expect(seg.type).toBe('segment');

    const mid = seg.midpoint();
    expect(mid.x).toBeCloseTo(1);
    expect(mid.y).toBeCloseTo(2);
    expect(mid.z).toBeCloseTo(2);

    const dir = seg.direction();
    expect(dir.magnitude()).toBeCloseTo(1);
    expect(dir.x).toBeCloseTo(2 / 6);
    expect(dir.y).toBeCloseTo(4 / 6);
    expect(dir.z).toBeCloseTo(4 / 6);
  });

  it('evaluates points along segment with pointAt and containsPoint', () => {
    const p1 = { x: 1, y: 1, z: 1 };
    const p2 = { x: 3, y: 5, z: 9 };
    const seg = new Segment3D(p1, p2);

    const ptMid = seg.pointAt(0.5);
    expect(ptMid.x).toBeCloseTo(2);
    expect(ptMid.y).toBeCloseTo(3);
    expect(ptMid.z).toBeCloseTo(5);
    expect(seg.containsPoint(ptMid.coords)).toBe(true);

    const ptStart = seg.pointAt(0);
    expect(seg.containsPoint(ptStart.coords)).toBe(true);

    const ptBeyond = seg.pointAt(1.5);
    expect(seg.containsPoint(ptBeyond.coords)).toBe(false);

    const ptOff = { x: 2, y: 4, z: 5 };
    expect(seg.containsPoint(ptOff)).toBe(false);
  });
});

describe('Line3D Primitive', () => {
  it('constructs line from point and direction and normalizes direction', () => {
    const pt = { x: 1, y: 2, z: 3 };
    const dir = new Vector3D(0, 3, 4);
    const line = new Line3D(pt, dir, 'line1');

    expect(line.direction.magnitude()).toBeCloseTo(1);
    expect(line.direction.y).toBeCloseTo(0.6);
    expect(line.direction.z).toBeCloseTo(0.8);
    expect(line.dimension).toBe(3);
    expect(line.type).toBe('line');
  });

  it('constructs line from two distinct points and throws on coincident points', () => {
    const p1 = { x: 1, y: 2, z: 3 };
    const p2 = { x: 1, y: 2, z: 5 };
    const line = Line3D.fromTwoPoints(p1, p2);

    expect(line.point).toEqual(p1);
    expect(line.direction.z).toBeCloseTo(1);

    expect(() => Line3D.fromTwoPoints(p1, { ...p1 })).toThrow('coincident points');
  });

  it('computes distance to point and tests point containment', () => {
    // Line along x-axis through (0, 0, 0)
    const line = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });

    // Point on line
    expect(line.distanceToPoint({ x: 5, y: 0, z: 0 })).toBeCloseTo(0);
    expect(line.containsPoint({ x: 5, y: 0, z: 0 })).toBe(true);

    // Point off line: (5, 3, 4) -> distance = sqrt(9+16) = 5
    expect(line.distanceToPoint({ x: 5, y: 3, z: 4 })).toBeCloseTo(5);
    expect(line.containsPoint({ x: 5, y: 3, z: 4 })).toBe(false);
  });

  it('evaluates line parallelism and perpendicularity', () => {
    const l1 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    const l2 = new Line3D({ x: 0, y: 5, z: 5 }, { x: 2, y: 0, z: 0 });
    const l3 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });

    expect(l1.isParallel(l2)).toBe(true);
    expect(l1.isPerpendicular(l3)).toBe(true);
    expect(l1.isParallel(l3)).toBe(false);
  });
});

describe('Plane Primitive', () => {
  it('constructs plane from point and normal vector', () => {
    const pt = { x: 1, y: 2, z: 3 };
    const norm = new Vector3D(0, 0, 1); // horizontal plane z = 3
    const plane = Plane.fromPointAndNormal(pt, norm, 'plane1');

    expect(plane.normal.z).toBeCloseTo(1);
    expect(plane.d).toBeCloseTo(-3); // 0x + 0y + 1z - 3 = 0
    expect(plane.dimension).toBe(3);
    expect(plane.type).toBe('plane');

    // Throws on zero normal vector
    expect(() => Plane.fromPointAndNormal(pt, { x: 0, y: 0, z: 0 })).toThrow('zero vector');
  });

  it('constructs plane from 3 non-collinear points and throws on collinear points', () => {
    // Standard Oxy plane passing through (0,0,0), (1,0,0), (0,1,0)
    const p1 = { x: 0, y: 0, z: 0 };
    const p2 = { x: 1, y: 0, z: 0 };
    const p3 = { x: 0, y: 1, z: 0 };
    const plane = Plane.fromThreePoints(p1, p2, p3);

    expect(plane.normal.x).toBeCloseTo(0);
    expect(plane.normal.y).toBeCloseTo(0);
    expect(Math.abs(plane.normal.z)).toBeCloseTo(1);
    expect(plane.containsPoint(p1)).toBe(true);
    expect(plane.containsPoint(p2)).toBe(true);
    expect(plane.containsPoint(p3)).toBe(true);

    // 3 collinear points: (0,0,0), (1,1,1), (2,2,2)
    const pCollinear = { x: 2, y: 2, z: 2 };
    expect(() => Plane.fromThreePoints(p1, { x: 1, y: 1, z: 1 }, pCollinear)).toThrow('collinear');
  });

  it('constructs plane from Cartesian equation ax + by + cz + d = 0', () => {
    // 2x + 2y + 1z - 9 = 0 -> normal length = sqrt(4+4+1)=3 -> na=2/3, nb=2/3, nc=1/3, nd=-3
    const plane = Plane.fromEquation(2, 2, 1, -9);
    expect(plane.normal.magnitude()).toBeCloseTo(1);
    expect(plane.normal.x).toBeCloseTo(2 / 3);
    expect(plane.normal.y).toBeCloseTo(2 / 3);
    expect(plane.normal.z).toBeCloseTo(1 / 3);
    expect(plane.d).toBeCloseTo(-3);

    // Point (2, 2, 1): 2(2) + 2(2) + 1(1) - 9 = 0 -> distance should be 0
    expect(plane.distanceToPoint({ x: 2, y: 2, z: 1 })).toBeCloseTo(0);

    expect(() => Plane.fromEquation(0, 0, 0, 5)).toThrow('cannot be zero');
  });

  it('calculates distance to point and orthogonal projection onto plane', () => {
    // Plane z = 0
    const plane = new Plane({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    const pt = { x: 3, y: 4, z: 5 };

    expect(plane.distanceToPoint(pt)).toBeCloseTo(5);
    expect(plane.containsPoint(pt)).toBe(false);

    const proj = plane.projectPoint(pt);
    expect(proj.x).toBeCloseTo(3);
    expect(proj.y).toBeCloseTo(4);
    expect(proj.z).toBeCloseTo(0);
    expect(plane.containsPoint(proj.coords)).toBe(true);
  });

  it('computes plane parallelism, perpendicularity, and dihedral angle', () => {
    // Oxy plane (z = 0)
    const pOxy = new Plane({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    // Parallel plane (z = 10)
    const pParallel = new Plane({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 1 });
    // Perpendicular plane Oxz (y = 0)
    const pOxz = new Plane({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });

    expect(pOxy.isParallel(pParallel)).toBe(true);
    expect(pOxy.isPerpendicular(pOxz)).toBe(true);
    expect(pOxy.angleTo(pOxz)).toBeCloseTo(Math.PI / 2);
    expect(pOxy.angleTo(pParallel)).toBeCloseTo(0);
  });
});

describe('3D Primitives Serialization & Factory Integration', () => {
  it('roundtrips Point3D through toJSON and createPrimitiveFromJSON', () => {
    const pt = new Point3D(1.5, -2.5, 3.5, 'pt_3d');
    const json = pt.toJSON();

    expect(json.dimension).toBe(3);
    expect(json.definition.kind).toBe('point3d');

    const restored = createPrimitiveFromJSON(json);
    expect(restored).toBeInstanceOf(Point3D);
    expect((restored as Point3D).x).toBe(1.5);
    expect((restored as Point3D).y).toBe(-2.5);
    expect((restored as Point3D).z).toBe(3.5);
  });

  it('roundtrips Vector3D through toJSON and createPrimitiveFromJSON', () => {
    const v = new Vector3D(4, 5, 6, 'vec_3d');
    const json = v.toJSON();

    const restored = createPrimitiveFromJSON(json);
    expect(restored).toBeInstanceOf(Vector3D);
    expect((restored as Vector3D).x).toBe(4);
    expect((restored as Vector3D).y).toBe(5);
    expect((restored as Vector3D).z).toBe(6);
  });

  it('roundtrips Segment3D through toJSON and createPrimitiveFromJSON', () => {
    const seg = new Segment3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 }, 'seg_3d');
    const json = seg.toJSON();

    const restored = createPrimitiveFromJSON(json);
    expect(restored).toBeInstanceOf(Segment3D);
    expect((restored as Segment3D).p1).toEqual({ x: 0, y: 0, z: 0 });
    expect((restored as Segment3D).p2).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('roundtrips Line3D through toJSON and createPrimitiveFromJSON', () => {
    const line = new Line3D({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 1 }, 'line_3d');
    const json = line.toJSON();

    const restored = createPrimitiveFromJSON(json);
    expect(restored).toBeInstanceOf(Line3D);
    expect((restored as Line3D).point).toEqual({ x: 1, y: 1, z: 1 });
    expect((restored as Line3D).direction.z).toBeCloseTo(1);
  });

  it('roundtrips Plane through toJSON and createPrimitiveFromJSON', () => {
    const plane = Plane.fromThreePoints(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      'plane_3d'
    );
    const json = plane.toJSON();

    const restored = createPrimitiveFromJSON(json);
    expect(restored).toBeInstanceOf(Plane);
    expect((restored as Plane).containsPoint({ x: 0.5, y: 0.5, z: 0 })).toBe(true);
    expect((restored as Plane).containsPoint({ x: 0.5, y: 0.5, z: 1 })).toBe(false);
  });
});
