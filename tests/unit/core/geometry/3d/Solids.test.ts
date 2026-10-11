import { describe, it, expect } from 'vitest';
import {
  Cube, Cuboid, Tetrahedron, Pyramid, Prism, PyramidalFrustum,
  Sphere, Cylinder, Cone, Frustum,
  polygonArea3D, triangleArea3D, tetrahedronVolume, isPointInsideTetrahedron
} from '../../../../../core/geometry/3d/Solids';
import { createPrimitiveFromJSON } from '../../../../../core/geometry/primitives';

describe('3D Geometric Helper Functions', () => {
  it('calculates polygonArea3D accurately on 3D planes', () => {
    // 3x4 rectangle in xy-plane
    const rectXY = [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 0, y: 4, z: 0 }
    ];
    expect(polygonArea3D(rectXY)).toBeCloseTo(12);

    // Same rectangle tilted in 3D: rotated 45 deg around x-axis
    const s2 = Math.SQRT1_2;
    const rectTilted = [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 3, y: 4 * s2, z: 4 * s2 },
      { x: 0, y: 4 * s2, z: 4 * s2 }
    ];
    expect(polygonArea3D(rectTilted)).toBeCloseTo(12);

    // Empty or < 3 points
    expect(polygonArea3D([])).toBe(0);
    expect(polygonArea3D([{ x: 0, y: 0, z: 0 }])).toBe(0);
  });

  it('calculates triangleArea3D and tetrahedronVolume', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 4, y: 0, z: 0 };
    const c = { x: 0, y: 3, z: 0 };
    const d = { x: 0, y: 0, z: 6 };

    // Right triangle area = 0.5 * 4 * 3 = 6
    expect(triangleArea3D(a, b, c)).toBeCloseTo(6);

    // Tetrahedron volume = 1/6 * (base * height) = 1/6 * (4 * 3 * 6) = 12
    expect(tetrahedronVolume(a, b, c, d)).toBeCloseTo(12);
  });

  it('checks point containment in tetrahedron', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 3, y: 0, z: 0 };
    const c = { x: 0, y: 3, z: 0 };
    const d = { x: 0, y: 0, z: 3 };

    // Centroid is inside
    const centroid = { x: 0.75, y: 0.75, z: 0.75 };
    expect(isPointInsideTetrahedron(centroid, a, b, c, d)).toBe(true);

    // Point outside
    const outside = { x: 2, y: 2, z: 2 };
    expect(isPointInsideTetrahedron(outside, a, b, c, d)).toBe(false);

    // Point on boundary/vertex
    expect(isPointInsideTetrahedron(a, a, b, c, d)).toBe(true);
  });
});

describe('Cube (Hình lập phương)', () => {
  it('constructs with origin and size, computes vertices, edges, faces, volume and areas', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2, 'cube-1');
    expect(cube.id).toBe('cube-1');
    expect(cube.type).toBe('solid');
    expect(cube.dimension).toBe(3);
    expect(cube.kind).toBe('cube');
    expect(cube.size).toBe(2);

    expect(cube.vertices.length).toBe(8);
    expect(cube.edges.length).toBe(12);
    expect(cube.faces.length).toBe(6);

    expect(cube.volume()).toBeCloseTo(8); // 2^3
    expect(cube.surfaceArea()).toBeCloseTo(24); // 6 * 2^2
    expect(cube.lateralArea()).toBeCloseTo(16); // 4 * 2^2

    // Segments
    const segs = cube.getSegments();
    expect(segs.length).toBe(12);
    expect(segs[0]!.length).toBeCloseTo(2);

    // Bounding Box
    const bb = cube.boundingBox();
    expect(bb.min).toEqual({ x: 0, y: 0, z: 0 });
    expect(bb.max).toEqual({ x: 2, y: 2, z: 2 });
  });

  it('checks point containment', () => {
    const cube = new Cube({ x: 1, y: 1, z: 1 }, 2);
    expect(cube.containsPoint({ x: 2, y: 2, z: 2 })).toBe(true); // Inside
    expect(cube.containsPoint({ x: 1, y: 1, z: 1 })).toBe(true); // Corner
    expect(cube.containsPoint({ x: 0.5, y: 2, z: 2 })).toBe(false); // Outside
    expect(cube.containsPoint({ x: 2, y: 3.5, z: 2 })).toBe(false);
  });

  it('supports factories and validates input', () => {
    expect(() => new Cube({ x: 0, y: 0, z: 0 }, 0)).toThrow('Cube size must be a positive number');
    expect(() => new Cube({ x: 0, y: 0, z: 0 }, -5)).toThrow('Cube size must be a positive number');

    const fromCenter = Cube.fromCenterAndSize({ x: 0, y: 0, z: 0 }, 4);
    expect(fromCenter.origin).toEqual({ x: -2, y: -2, z: -2 });
    expect(fromCenter.volume()).toBeCloseTo(64);

    const fromTwo = Cube.fromTwoPoints({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
    expect(fromTwo.size).toBeCloseTo(5);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const cube = new Cube({ x: 1, y: 2, z: 3 }, 5, 'c123');
    cube.style = { color: 'blue' };
    const json = cube.toJSON();

    expect(json.type).toBe('solid');
    expect(json.dimension).toBe(3);
    expect(json.definition.kind).toBe('cube');

    const reconstructed = createPrimitiveFromJSON(json) as Cube;
    expect(reconstructed).toBeInstanceOf(Cube);
    expect(reconstructed.id).toBe('c123');
    expect(reconstructed.origin).toEqual({ x: 1, y: 2, z: 3 });
    expect(reconstructed.size).toBe(5);
    expect(reconstructed.volume()).toBeCloseTo(125);
    expect(reconstructed.style.color).toBe('blue');
  });
});

describe('Cuboid (Hình hộp chữ nhật)', () => {
  it('constructs with origin and dimensions (width, depth, height)', () => {
    const cuboid = new Cuboid({ x: 0, y: 0, z: 0 }, 2, 3, 4, 'cuboid-1');
    expect(cuboid.id).toBe('cuboid-1');
    expect(cuboid.kind).toBe('cuboid');
    expect(cuboid.vertices.length).toBe(8);
    expect(cuboid.edges.length).toBe(12);
    expect(cuboid.faces.length).toBe(6);

    expect(cuboid.volume()).toBeCloseTo(24); // 2 * 3 * 4
    expect(cuboid.surfaceArea()).toBeCloseTo(52); // 2 * (6 + 12 + 8)
    expect(cuboid.lateralArea()).toBeCloseTo(40); // 2 * 4 * (2 + 3)

    expect(cuboid.containsPoint({ x: 1, y: 1.5, z: 2 })).toBe(true);
    expect(cuboid.containsPoint({ x: 2.5, y: 1.5, z: 2 })).toBe(false);

    const bb = cuboid.boundingBox();
    expect(bb.min).toEqual({ x: 0, y: 0, z: 0 });
    expect(bb.max).toEqual({ x: 2, y: 3, z: 4 });
  });

  it('supports factories and validates input', () => {
    expect(() => new Cuboid({ x: 0, y: 0, z: 0 }, -1, 2, 3)).toThrow();

    const fromCenter = Cuboid.fromCenterAndDimensions({ x: 5, y: 5, z: 5 }, 2, 4, 6);
    expect(fromCenter.origin).toEqual({ x: 4, y: 3, z: 2 });

    const fromCorners = Cuboid.fromTwoCorners({ x: 1, y: 2, z: 3 }, { x: 4, y: 6, z: 8 });
    expect(fromCorners.width).toBe(3);
    expect(fromCorners.depth).toBe(4);
    expect(fromCorners.height).toBe(5);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const cuboid = new Cuboid({ x: 1, y: 1, z: 1 }, 3, 4, 5);
    const json = cuboid.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Cuboid;
    expect(reconstructed).toBeInstanceOf(Cuboid);
    expect(reconstructed.volume()).toBeCloseTo(60);
  });
});

describe('Tetrahedron (Tứ diện)', () => {
  it('constructs with 4 non-coplanar points', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 2, y: 0, z: 0 };
    const c = { x: 0, y: 2, z: 0 };
    const d = { x: 0, y: 0, z: 3 };

    const tet = new Tetrahedron(a, b, c, d, 'tet-1');
    expect(tet.kind).toBe('tetrahedron');
    expect(tet.vertices.length).toBe(4);
    expect(tet.edges.length).toBe(6);
    expect(tet.faces.length).toBe(4);

    expect(tet.volume()).toBeCloseTo(2); // 1/6 * 2 * 2 * 3 = 2
    expect(tet.surfaceArea()).toBeGreaterThan(0);
    expect(tet.lateralArea()).toBeGreaterThan(0);

    expect(tet.containsPoint({ x: 0.2, y: 0.2, z: 0.2 })).toBe(true);
    expect(tet.containsPoint({ x: 5, y: 5, z: 5 })).toBe(false);
  });

  it('constructs regular tetrahedron', () => {
    const reg = Tetrahedron.regular({ x: 0, y: 0, z: 0 }, 6);
    expect(reg.vertices.length).toBe(4);
    // Edge length = 6 -> Volume = 6^3 / (6 * sqrt(2)) = 216 / (8.485) ≈ 25.4558
    const expectedVol = Math.pow(6, 3) / (6 * Math.SQRT2);
    expect(reg.volume()).toBeCloseTo(expectedVol, 2);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const tet = new Tetrahedron(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
      'tet-roundtrip'
    );
    const json = tet.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Tetrahedron;
    expect(reconstructed).toBeInstanceOf(Tetrahedron);
    expect(reconstructed.id).toBe('tet-roundtrip');
    expect(reconstructed.volume()).toBeCloseTo(1 / 6);
  });
});

describe('Pyramid (Hình chóp)', () => {
  it('constructs pyramid with polygonal base and apex', () => {
    const apex = { x: 1, y: 1, z: 3 };
    const base = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 0, y: 2, z: 0 }
    ];
    const pyr = new Pyramid(apex, base, 'pyr-1');
    expect(pyr.kind).toBe('pyramid');
    expect(pyr.vertices.length).toBe(5); // 4 base + 1 apex
    expect(pyr.edges.length).toBe(8); // 4 base + 4 lateral
    expect(pyr.faces.length).toBe(5); // 1 base + 4 lateral

    // Square base with side 2 -> Area = 4, height = 3 -> Volume = 1/3 * 4 * 3 = 4
    expect(pyr.volume()).toBeCloseTo(4);
    expect(pyr.lateralArea()).toBeGreaterThan(0);
    expect(pyr.surfaceArea()).toBeCloseTo(polygonArea3D(base) + pyr.lateralArea());

    expect(pyr.containsPoint({ x: 1, y: 1, z: 1 })).toBe(true);
    expect(pyr.containsPoint({ x: 1, y: 1, z: 4 })).toBe(false);
  });

  it('validates base has at least 3 vertices', () => {
    expect(() => new Pyramid({ x: 0, y: 0, z: 3 }, [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }])).toThrow();
  });

  it('constructs regular pyramid', () => {
    const reg = Pyramid.regular({ x: 0, y: 0, z: 0 }, 5, 4, 6);
    expect(reg.vertices.length).toBe(5);
    expect(reg.volume()).toBeGreaterThan(0);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const apex = { x: 0, y: 0, z: 5 };
    const base = [
      { x: -1, y: -1, z: 0 },
      { x: 1, y: -1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: -1, y: 1, z: 0 }
    ];
    const pyr = new Pyramid(apex, base);
    const json = pyr.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Pyramid;
    expect(reconstructed).toBeInstanceOf(Pyramid);
    expect(reconstructed.volume()).toBeCloseTo(pyr.volume());
  });
});

describe('Prism (Hình lăng trụ)', () => {
  it('constructs triangular prism with equal base and top vertices', () => {
    const base = [
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 3, z: 0 }
    ];
    const top = [
      { x: 0, y: 0, z: 5 },
      { x: 4, y: 0, z: 5 },
      { x: 0, y: 3, z: 5 }
    ];
    const prism = new Prism(base, top, 'prism-1');
    expect(prism.kind).toBe('prism');
    expect(prism.vertices.length).toBe(6);
    expect(prism.edges.length).toBe(9); // 3 bottom + 3 top + 3 vertical
    expect(prism.faces.length).toBe(5); // 2 triangular bases + 3 quadrilaterals

    // Base area = 6, height = 5 -> Volume = 30
    expect(prism.volume()).toBeCloseTo(30);
    expect(prism.lateralArea()).toBeCloseTo((4 + 3 + 5) * 5); // perimeter * height = 12 * 5 = 60
    expect(prism.surfaceArea()).toBeCloseTo(6 + 6 + 60); // 72

    expect(prism.containsPoint({ x: 1, y: 1, z: 2 })).toBe(true);
    expect(prism.containsPoint({ x: 3, y: 3, z: 2 })).toBe(false);
  });

  it('validates vertex counts', () => {
    expect(() => new Prism([{ x: 0, y: 0, z: 0 }], [{ x: 0, y: 0, z: 1 }])).toThrow();
    expect(() => new Prism(
      [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }],
      [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }]
    )).toThrow();
  });

  it('supports fromBaseAndVector and regular factory', () => {
    const base = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 2, z: 0 }
    ];
    const extruded = Prism.fromBaseAndVector(base, { x: 0, y: 0, z: 4 });
    expect(extruded.topVertices[0]!.z).toBe(4);
    expect(extruded.volume()).toBeCloseTo(8);

    const reg = Prism.regular({ x: 0, y: 0, z: 0 }, 3, 6, 5);
    expect(reg.vertices.length).toBe(12);
    expect(reg.volume()).toBeGreaterThan(0);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const prism = Prism.regular({ x: 0, y: 0, z: 0 }, 4, 3, 6);
    const json = prism.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Prism;
    expect(reconstructed).toBeInstanceOf(Prism);
    expect(reconstructed.volume()).toBeCloseTo(prism.volume());
  });
});

describe('PyramidalFrustum (Hình chóp cụt)', () => {
  it('constructs pyramidal frustum from two parallel polygons', () => {
    // Square frustum: bottom 4x4, top 2x2, height = 3
    const bottom = [
      { x: -2, y: -2, z: 0 },
      { x: 2, y: -2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: -2, y: 2, z: 0 }
    ];
    const top = [
      { x: -1, y: -1, z: 3 },
      { x: 1, y: -1, z: 3 },
      { x: 1, y: 1, z: 3 },
      { x: -1, y: 1, z: 3 }
    ];
    const frustum = new PyramidalFrustum(bottom, top, 'pyr-frust-1');
    expect(frustum.kind).toBe('pyramidal_frustum');
    expect(frustum.vertices.length).toBe(8);
    expect(frustum.edges.length).toBe(12);
    expect(frustum.faces.length).toBe(6);

    // V = 1/3 * h * (S1 + sqrt(S1*S2) + S2) = 1/3 * 3 * (16 + 8 + 4) = 28
    expect(frustum.volume()).toBeCloseTo(28);
    expect(frustum.surfaceArea()).toBeGreaterThan(20);
    expect(frustum.containsPoint({ x: 0, y: 0, z: 1.5 })).toBe(true);
    expect(frustum.containsPoint({ x: 3, y: 3, z: 1.5 })).toBe(false);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const bottom = [
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 4, z: 0 }
    ];
    const top = [
      { x: 0, y: 0, z: 2 },
      { x: 2, y: 0, z: 2 },
      { x: 0, y: 2, z: 2 }
    ];
    const pf = new PyramidalFrustum(bottom, top);
    const json = pf.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as PyramidalFrustum;
    expect(reconstructed).toBeInstanceOf(PyramidalFrustum);
    expect(reconstructed.volume()).toBeCloseTo(pf.volume());
  });
});

describe('Sphere (Hình cầu)', () => {
  it('constructs with center and radius, calculates V, S, distance, containment, bounding box', () => {
    const sphere = new Sphere({ x: 1, y: 2, z: 3 }, 3, 'sph-1');
    expect(sphere.kind).toBe('sphere');
    expect(sphere.radius).toBe(3);

    // V = 4/3 * pi * 3^3 = 36 * pi ≈ 113.097
    expect(sphere.volume()).toBeCloseTo(36 * Math.PI);
    // S = 4 * pi * 3^2 = 36 * pi ≈ 113.097
    expect(sphere.surfaceArea()).toBeCloseTo(36 * Math.PI);
    expect(sphere.lateralArea()).toBeCloseTo(36 * Math.PI);

    expect(sphere.containsPoint({ x: 1, y: 2, z: 3 })).toBe(true); // Center
    expect(sphere.containsPoint({ x: 4, y: 2, z: 3 })).toBe(true); // On boundary
    expect(sphere.containsPoint({ x: 5, y: 2, z: 3 })).toBe(false); // Outside

    expect(sphere.distanceToPoint({ x: 6, y: 2, z: 3 })).toBeCloseTo(2);

    const bb = sphere.boundingBox();
    expect(bb.min).toEqual({ x: -2, y: -1, z: 0 });
    expect(bb.max).toEqual({ x: 4, y: 5, z: 6 });
  });

  it('validates radius and provides diameter factory', () => {
    expect(() => new Sphere({ x: 0, y: 0, z: 0 }, 0)).toThrow();
    expect(() => new Sphere({ x: 0, y: 0, z: 0 }, -2)).toThrow();

    const fromDiam = Sphere.fromDiameter({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 10 });
    expect(fromDiam.center).toEqual({ x: 0, y: 0, z: 5 });
    expect(fromDiam.radius).toBe(5);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const sphere = new Sphere({ x: 0, y: 0, z: 0 }, 2.5);
    const json = sphere.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Sphere;
    expect(reconstructed).toBeInstanceOf(Sphere);
    expect(reconstructed.radius).toBe(2.5);
    expect(reconstructed.volume()).toBeCloseTo(sphere.volume());
  });
});

describe('Cylinder (Hình trụ)', () => {
  it('constructs with bottomCenter, topCenter, radius', () => {
    const cyl = new Cylinder({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 5 }, 2, 'cyl-1');
    expect(cyl.kind).toBe('cylinder');
    expect(cyl.height).toBe(5);
    expect(cyl.radius).toBe(2);

    // V = pi * r^2 * h = 20 * pi
    expect(cyl.volume()).toBeCloseTo(20 * Math.PI);
    // S_lat = 2 * pi * r * h = 20 * pi
    expect(cyl.lateralArea()).toBeCloseTo(20 * Math.PI);
    // S_tp = S_lat + 2 * pi * r^2 = 20 * pi + 8 * pi = 28 * pi
    expect(cyl.surfaceArea()).toBeCloseTo(28 * Math.PI);

    // Inside / Outside
    expect(cyl.containsPoint({ x: 1, y: 1, z: 2.5 })).toBe(true);
    expect(cyl.containsPoint({ x: 0, y: 2, z: 2.5 })).toBe(true); // On radius
    expect(cyl.containsPoint({ x: 2.5, y: 0, z: 2.5 })).toBe(false); // Outside radius
    expect(cyl.containsPoint({ x: 0, y: 0, z: 6 })).toBe(false); // Past top
  });

  it('validates coincident centers or negative radius', () => {
    expect(() => new Cylinder({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 2)).toThrow();
    expect(() => new Cylinder({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 5 }, -1)).toThrow();
  });

  it('supports fromCenterHeightRadius factory', () => {
    const cyl = Cylinder.fromCenterHeightRadius({ x: 0, y: 0, z: 0 }, 10, 3);
    expect(cyl.height).toBeCloseTo(10);
    expect(cyl.bottomCenter.z).toBeCloseTo(-5);
    expect(cyl.topCenter.z).toBeCloseTo(5);
  });

  it('serializes to JSON and roundtrips through factory', () => {
    const cyl = new Cylinder({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 9 }, 4);
    const json = cyl.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Cylinder;
    expect(reconstructed).toBeInstanceOf(Cylinder);
    expect(reconstructed.height).toBe(6);
    expect(reconstructed.volume()).toBeCloseTo(cyl.volume());
  });
});

describe('Cone (Hình nón)', () => {
  it('constructs with baseCenter, apex, radius', () => {
    const cone = new Cone({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, 3, 'cone-1');
    expect(cone.kind).toBe('cone');
    expect(cone.height).toBe(4);
    expect(cone.radius).toBe(3);
    expect(cone.slantHeight).toBeCloseTo(5); // 3-4-5 triangle

    // V = 1/3 * pi * r^2 * h = 1/3 * pi * 9 * 4 = 12 * pi
    expect(cone.volume()).toBeCloseTo(12 * Math.PI);
    // S_lat = pi * r * l = 15 * pi
    expect(cone.lateralArea()).toBeCloseTo(15 * Math.PI);
    // S_tp = S_lat + pi * r^2 = 15 * pi + 9 * pi = 24 * pi
    expect(cone.surfaceArea()).toBeCloseTo(24 * Math.PI);

    // Points
    expect(cone.containsPoint({ x: 0, y: 0, z: 2 })).toBe(true); // Axis point
    expect(cone.containsPoint({ x: 1, y: 0, z: 2 })).toBe(true); // Radius at z=2 is 1.5, x=1 is inside
    expect(cone.containsPoint({ x: 2, y: 0, z: 2 })).toBe(false); // x=2 > 1.5, outside
  });

  it('validates apex coincident with baseCenter', () => {
    expect(() => new Cone({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }, 2)).toThrow();
    expect(() => new Cone({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, -1)).toThrow();
  });

  it('supports fromCenterHeightRadius and roundtrips through factory', () => {
    const cone = Cone.fromCenterHeightRadius({ x: 0, y: 0, z: 0 }, 6, 2);
    expect(cone.height).toBeCloseTo(6);
    expect(cone.apex.z).toBeCloseTo(6);

    const json = cone.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Cone;
    expect(reconstructed).toBeInstanceOf(Cone);
    expect(reconstructed.volume()).toBeCloseTo(cone.volume());
  });
});

describe('Frustum (Hình nón cụt)', () => {
  it('constructs conical frustum with bottomCenter, topCenter, bottomRadius, topRadius', () => {
    const frustum = new Frustum({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, 5, 2, 'frust-1');
    expect(frustum.kind).toBe('frustum');
    expect(frustum.height).toBe(4);
    expect(frustum.bottomRadius).toBe(5);
    expect(frustum.topRadius).toBe(2);
    // Slant height: sqrt(4^2 + (5 - 2)^2) = sqrt(16 + 9) = 5
    expect(frustum.slantHeight).toBeCloseTo(5);

    // V = 1/3 * pi * h * (R1^2 + R1*R2 + R2^2) = 1/3 * pi * 4 * (25 + 10 + 4) = 52 * pi
    expect(frustum.volume()).toBeCloseTo(52 * Math.PI);

    // S_lat = pi * (R1 + R2) * l = pi * 7 * 5 = 35 * pi
    expect(frustum.lateralArea()).toBeCloseTo(35 * Math.PI);
    // S_tp = 35 * pi + pi * (25 + 4) = 64 * pi
    expect(frustum.surfaceArea()).toBeCloseTo(64 * Math.PI);

    // Containment
    // At z=2 (halfway), radius = 3.5
    expect(frustum.containsPoint({ x: 3, y: 0, z: 2 })).toBe(true);
    expect(frustum.containsPoint({ x: 4, y: 0, z: 2 })).toBe(false);
  });

  it('validates negative radii or coincident centers', () => {
    expect(() => new Frustum({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, -1, 2)).toThrow();
    expect(() => new Frustum({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, 0, 0)).toThrow();
    expect(() => new Frustum({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 5, 2)).toThrow();
  });

  it('supports fromCenterHeightRadii and roundtrips through factory', () => {
    const frust = Frustum.fromCenterHeightRadii({ x: 0, y: 0, z: 0 }, 6, 4, 1);
    expect(frust.height).toBeCloseTo(6);

    const json = frust.toJSON();
    const reconstructed = createPrimitiveFromJSON(json) as Frustum;
    expect(reconstructed).toBeInstanceOf(Frustum);
    expect(reconstructed.volume()).toBeCloseTo(frust.volume());
  });
});
