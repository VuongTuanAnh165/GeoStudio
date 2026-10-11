import { describe, it, expect } from 'vitest';
import {
  distancePointToLine3D,
  distancePointToLine3DCoords,
  distancePointToPlane,
  distancePointToPlaneCoords,
  distanceLineToLine3D,
  distanceLineToLine3DCoords,
  angleLineToLine3D,
  angleLineToLine3DCoords,
  angleLineToPlane,
  angleLineToPlaneCoords,
  anglePlaneToPlane,
  anglePlaneToPlaneCoords,
  dihedralAngle,
  volume,
  surfaceArea,
  lateralArea,
  sphereVolume,
  cylinderVolume,
  coneVolume,
  frustumVolume,
  cubeVolume,
  cuboidVolume,
  pyramidVolume,
  prismVolume,
  sphereSurfaceArea,
  cylinderSurfaceArea,
  cylinderLateralArea,
  coneSurfaceArea,
  coneLateralArea,
  frustumSurfaceArea,
  frustumLateralArea,
  cubeSurfaceArea,
  cubeLateralArea,
  cuboidSurfaceArea,
  cuboidLateralArea
} from '../../../../../core/geometry/3d/Measurements3D';
import {
  Point3D, Line3D, Plane, Vector3D
} from '../../../../../core/geometry/primitives/3d';
import {
  Cube, Cuboid, Tetrahedron, Pyramid, Prism, PyramidalFrustum, Sphere, Cylinder, Cone, Frustum
} from '../../../../../core/geometry/3d/Solids';

describe('3D Measurements - Distance Point-Line (3D)', () => {
  it('calculates distance from point to 3D line', () => {
    // Line along x-axis through origin
    const line = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    const p1 = { x: 5, y: 3, z: 4 }; // dx=0, dy=3, dz=4 -> dist=5
    expect(distancePointToLine3D(p1, line)).toBeCloseTo(5);
    expect(distancePointToLine3DCoords(p1, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBeCloseTo(5);
  });

  it('returns 0 when point lies exactly on the 3D line', () => {
    const line = Line3D.fromTwoPoints({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });
    const onLine = line.pointAt(2.5);
    expect(distancePointToLine3D(onLine, line)).toBeCloseTo(0);
  });

  it('handles degenerate line direction safely', () => {
    const p = { x: 3, y: 4, z: 0 };
    const linePoint = { x: 0, y: 0, z: 0 };
    const dist = distancePointToLine3DCoords(p, linePoint, { x: 0, y: 0, z: 0 });
    expect(dist).toBeCloseTo(5);
  });
});

describe('3D Measurements - Distance Point-Plane', () => {
  it('calculates distance from point to plane', () => {
    // Plane z = 0 (xy-plane)
    const plane = Plane.fromEquation(0, 0, 1, 0);
    const pt = { x: 10, y: 20, z: 7 };
    expect(distancePointToPlane(pt, plane)).toBeCloseTo(7);
    expect(distancePointToPlaneCoords(pt, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 })).toBeCloseTo(7);
  });

  it('returns 0 when point is on plane', () => {
    const plane = Plane.fromThreePoints(
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 }
    );
    expect(distancePointToPlane({ x: 1, y: 0, z: 0 }, plane)).toBeCloseTo(0);
    expect(distancePointToPlane({ x: 1 / 3, y: 1 / 3, z: 1 / 3 }, plane)).toBeCloseTo(0);
  });

  it('calculates distance to tilted plane correctly: x + y + z - 3 = 0 to origin is sqrt(3)', () => {
    const plane = Plane.fromEquation(1, 1, 1, -3);
    expect(distancePointToPlane({ x: 0, y: 0, z: 0 }, plane)).toBeCloseTo(Math.sqrt(3));
  });

  it('throws error for zero normal vector', () => {
    expect(() => distancePointToPlaneCoords({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })).toThrow();
  });
});

describe('3D Measurements - Distance Line-Line (Skew & Parallel Lines)', () => {
  it('calculates distance between skew lines (hai đường thẳng chéo nhau)', () => {
    // Line 1: along x-axis at z = 0 (y=0, z=0)
    const l1 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    // Line 2: along y-axis at z = 5 (x=0, z=5)
    const l2 = new Line3D({ x: 0, y: 0, z: 5 }, { x: 0, y: 1, z: 0 });

    expect(distanceLineToLine3D(l1, l2)).toBeCloseTo(5);
    expect(distanceLineToLine3DCoords(l1.point, l1.direction, l2.point, l2.direction)).toBeCloseTo(5);
  });

  it('calculates distance between intersecting lines (cắt nhau -> dist = 0)', () => {
    const l1 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    const l2 = new Line3D({ x: 2, y: 0, z: 0 }, { x: 0, y: 1, z: 1 });
    expect(distanceLineToLine3D(l1, l2)).toBeCloseTo(0);
  });

  it('calculates distance between parallel lines (song song)', () => {
    // Line 1 along x-axis at y=0, z=0
    const l1 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    // Line 2 along x-axis at y=3, z=4
    const l2 = new Line3D({ x: 0, y: 3, z: 4 }, { x: 2, y: 0, z: 0 });

    // Distance = sqrt(3^2 + 4^2) = 5
    expect(distanceLineToLine3D(l1, l2)).toBeCloseTo(5);
    expect(distanceLineToLine3DCoords(l1.point, l1.direction, l2.point, l2.direction)).toBeCloseTo(5);
  });

  it('calculates distance between identical / coincident lines (trùng nhau -> 0)', () => {
    const l1 = new Line3D({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 1 });
    const l2 = new Line3D({ x: 1, y: 1, z: 5 }, { x: 0, y: 0, z: 2 });
    expect(distanceLineToLine3D(l1, l2)).toBeCloseTo(0);
  });
});

describe('3D Measurements - Angle Line-Line (3D)', () => {
  it('calculates angle between perpendicular lines (90 deg / pi/2)', () => {
    const l1 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    const l2 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(angleLineToLine3D(l1, l2)).toBeCloseTo(Math.PI / 2);
    expect(angleLineToLine3DCoords(l1.direction, l2.direction)).toBeCloseTo(Math.PI / 2);
  });

  it('calculates angle between parallel lines (0 rad)', () => {
    const l1 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    const l2 = new Line3D({ x: 0, y: 5, z: 5 }, { x: -3, y: 0, z: 0 }); // opposite direction
    expect(angleLineToLine3D(l1, l2)).toBeCloseTo(0); // Geometric line angle is acute in [0, pi/2]
  });

  it('calculates 45 deg angle (pi/4) between lines', () => {
    const l1 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    const l2 = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 0 });
    expect(angleLineToLine3D(l1, l2)).toBeCloseTo(Math.PI / 4);
  });

  it('returns 0 for zero direction vector', () => {
    expect(angleLineToLine3DCoords({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBe(0);
  });
});

describe('3D Measurements - Angle Line-Plane', () => {
  it('calculates angle between line and plane perpendicular to each other (pi/2)', () => {
    // Line along z-axis, Plane is xy-plane (normal = (0, 0, 1))
    const line = new Line3D({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    const plane = Plane.fromEquation(0, 0, 1, 0);
    expect(angleLineToPlane(line, plane)).toBeCloseTo(Math.PI / 2);
    expect(angleLineToPlaneCoords(line.direction, plane.normal)).toBeCloseTo(Math.PI / 2);
  });

  it('calculates angle when line is parallel to plane (0 rad)', () => {
    // Line along x-axis, Plane is xy-plane
    const line = new Line3D({ x: 0, y: 0, z: 5 }, { x: 1, y: 0, z: 0 });
    const plane = Plane.fromEquation(0, 0, 1, 0);
    expect(angleLineToPlane(line, plane)).toBeCloseTo(0);
  });

  it('calculates angle between line at 45 deg to plane (pi/4)', () => {
    // Line vector (1, 0, 1), Plane xy-plane (normal (0, 0, 1))
    const line = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 1 });
    const plane = Plane.fromEquation(0, 0, 1, 0);
    expect(angleLineToPlane(line, plane)).toBeCloseTo(Math.PI / 4);
  });

  it('returns 0 for degenerate zero vectors', () => {
    expect(angleLineToPlaneCoords({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 })).toBe(0);
  });
});

describe('3D Measurements - Angle Plane-Plane (Dihedral Angle)', () => {
  it('calculates angle between perpendicular planes (pi/2)', () => {
    const p1 = Plane.fromEquation(1, 0, 0, 0); // yz-plane (normal x)
    const p2 = Plane.fromEquation(0, 1, 0, 0); // xz-plane (normal y)
    expect(anglePlaneToPlane(p1, p2)).toBeCloseTo(Math.PI / 2);
    expect(anglePlaneToPlaneCoords(p1.normal, p2.normal)).toBeCloseTo(Math.PI / 2);
  });

  it('calculates angle between parallel planes (0 rad)', () => {
    const p1 = Plane.fromEquation(0, 0, 1, -5); // z = 5
    const p2 = Plane.fromEquation(0, 0, -2, 10); // z = 5 (opposite normal)
    expect(anglePlaneToPlane(p1, p2)).toBeCloseTo(0);
  });

  it('calculates dihedral angle between two half-planes sharing an edge', () => {
    // Edge along z-axis from (0,0,0) to (0,0,1)
    // Face A on xz-plane with point (1, 0, 0)
    // Face B on yz-plane with point (0, 1, 0)
    const edgeP1 = { x: 0, y: 0, z: 0 };
    const edgeP2 = { x: 0, y: 0, z: 1 };
    const faceA = { x: 1, y: 0, z: 0 };
    const faceB = { x: 0, y: 1, z: 0 };

    expect(dihedralAngle(edgeP1, edgeP2, faceA, faceB)).toBeCloseTo(Math.PI / 2);
  });

  it('calculates dihedral angle of regular tetrahedron (~70.53 deg / arccos(1/3))', () => {
    const regTet = Tetrahedron.regular({ x: 0, y: 0, z: 0 }, 2);
    const verts = regTet.vertices;
    // Edge between vert 0 and vert 1, faces with vert 2 and vert 3
    const angle = dihedralAngle(verts[0]!.coords, verts[1]!.coords, verts[2]!.coords, verts[3]!.coords);
    expect(angle).toBeCloseTo(Math.acos(1 / 3), 4);
  });
});

describe('3D Measurements - Volume', () => {
  it('calculates volume with polymorphic volume() function for all solids', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 3);
    expect(volume(cube)).toBeCloseTo(27);

    const cuboid = new Cuboid({ x: 0, y: 0, z: 0 }, 2, 3, 4);
    expect(volume(cuboid)).toBeCloseTo(24);

    const sphere = new Sphere({ x: 0, y: 0, z: 0 }, 3);
    expect(volume(sphere)).toBeCloseTo(36 * Math.PI);

    const cylinder = new Cylinder({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 5 }, 2);
    expect(volume(cylinder)).toBeCloseTo(20 * Math.PI);

    const cone = new Cone({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 6 }, 3);
    expect(volume(cone)).toBeCloseTo(18 * Math.PI);

    const frustum = new Frustum({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 3 }, 4, 1);
    // V = 1/3 * pi * 3 * (16 + 4 + 1) = 21 * pi
    expect(volume(frustum)).toBeCloseTo(21 * Math.PI);

    const tet = new Tetrahedron(
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 0, y: 0, z: 4 }
    );
    expect(volume(tet)).toBeCloseTo(4);

    const pyr = new Pyramid({ x: 1, y: 1, z: 3 }, [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 0, y: 2, z: 0 }
    ]);
    expect(volume(pyr)).toBeCloseTo(4);
  });

  it('calculates volume from plain GeometryObject definitions', () => {
    const cubeObj = {
      id: 'c1',
      type: 'solid',
      dimension: 3 as const,
      definition: { kind: 'cube', size: 4 }
    };
    expect(volume(cubeObj)).toBeCloseTo(64);

    const sphereObj = {
      id: 's1',
      type: 'solid',
      dimension: 3 as const,
      definition: { kind: 'sphere', radius: 3 }
    };
    expect(volume(sphereObj)).toBeCloseTo(36 * Math.PI);
  });

  it('tests coordinate volume helpers', () => {
    expect(sphereVolume(3)).toBeCloseTo(36 * Math.PI);
    expect(sphereVolume(-1)).toBe(0);

    expect(cylinderVolume(2, 5)).toBeCloseTo(20 * Math.PI);
    expect(coneVolume(3, 4)).toBeCloseTo(12 * Math.PI);
    expect(frustumVolume(5, 2, 4)).toBeCloseTo(52 * Math.PI);
    expect(cubeVolume(5)).toBe(125);
    expect(cuboidVolume(2, 3, 5)).toBe(30);

    const base = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 0, y: 2, z: 0 }
    ];
    expect(pyramidVolume({ x: 1, y: 1, z: 6 }, base)).toBeCloseTo(8);
    expect(prismVolume(base, 5)).toBeCloseTo(20);
    expect(prismVolume(base, { x: 0, y: 0, z: 5 })).toBeCloseTo(20);
  });
});

describe('3D Measurements - Surface Area & Lateral Area', () => {
  it('calculates surfaceArea and lateralArea for solids', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    expect(surfaceArea(cube)).toBeCloseTo(24);
    expect(lateralArea(cube)).toBeCloseTo(16);

    const cuboid = new Cuboid({ x: 0, y: 0, z: 0 }, 2, 3, 4);
    expect(surfaceArea(cuboid)).toBeCloseTo(52);
    expect(lateralArea(cuboid)).toBeCloseTo(40);

    const sphere = new Sphere({ x: 0, y: 0, z: 0 }, 3);
    expect(surfaceArea(sphere)).toBeCloseTo(36 * Math.PI);
    expect(lateralArea(sphere)).toBeCloseTo(36 * Math.PI);

    const cyl = new Cylinder({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 5 }, 2);
    expect(lateralArea(cyl)).toBeCloseTo(20 * Math.PI);
    expect(surfaceArea(cyl)).toBeCloseTo(28 * Math.PI);

    const cone = new Cone({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, 3);
    expect(lateralArea(cone)).toBeCloseTo(15 * Math.PI); // slant = 5
    expect(surfaceArea(cone)).toBeCloseTo(24 * Math.PI);

    const frust = new Frustum({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, 5, 2);
    expect(lateralArea(frust)).toBeCloseTo(35 * Math.PI);
    expect(surfaceArea(frust)).toBeCloseTo(64 * Math.PI);
  });

  it('calculates surfaceArea and lateralArea from plain GeometryObject definitions', () => {
    const cylObj = {
      id: 'c1',
      type: 'solid',
      dimension: 3 as const,
      definition: {
        kind: 'cylinder',
        radius: 2,
        bottomCenter: { x: 0, y: 0, z: 0 },
        topCenter: { x: 0, y: 0, z: 5 }
      }
    };
    expect(lateralArea(cylObj)).toBeCloseTo(20 * Math.PI);
    expect(surfaceArea(cylObj)).toBeCloseTo(28 * Math.PI);
  });

  it('tests coordinate area helpers', () => {
    expect(sphereSurfaceArea(3)).toBeCloseTo(36 * Math.PI);
    expect(cylinderLateralArea(2, 5)).toBeCloseTo(20 * Math.PI);
    expect(cylinderSurfaceArea(2, 5)).toBeCloseTo(28 * Math.PI);
    expect(coneLateralArea(3, 4)).toBeCloseTo(15 * Math.PI);
    expect(coneSurfaceArea(3, 4)).toBeCloseTo(24 * Math.PI);
    expect(frustumLateralArea(5, 2, 4)).toBeCloseTo(35 * Math.PI);
    expect(frustumSurfaceArea(5, 2, 4)).toBeCloseTo(64 * Math.PI);
    expect(cubeSurfaceArea(3)).toBe(54);
    expect(cubeLateralArea(3)).toBe(36);
    expect(cuboidSurfaceArea(2, 3, 4)).toBe(52);
    expect(cuboidLateralArea(2, 3, 4)).toBe(40);
  });
});
