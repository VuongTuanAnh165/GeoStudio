import { describe, it, expect, beforeAll } from 'vitest';
import {
  createSectionPlaneFromThreePoints,
  createSectionPlaneFromPointAndNormal,
  createCrossSection,
  createPerpendicularFromPointToPlane,
  createParallelPlaneThroughPoint,
  createPlaneIntersectionLine,
  projectPointOntoPlane
} from '../../../../../core/geometry/3d/Constructions3D';
import { Plane, Line3D, Point3D, Vector3D } from '../../../../../core/geometry/primitives/3d';
import { Cube, Pyramid } from '../../../../../core/geometry/3d/Solids';
import { ConstructionRegistry } from '../../../../../core/geometry/constructions/ConstructionRegistry';
import { registerBuiltinConstructions } from '../../../../../core/geometry/constructions/builtins';
import type { GeometryObject } from '../../../../../core/types/geometry';

describe('3D Constructions - Geometry Core', () => {
  describe('1. Section plane (Mặt cắt)', () => {
    it('creates section plane from 3 non-collinear 3D points', () => {
      const p1 = { x: 1, y: 0, z: 0 };
      const p2 = { x: 0, y: 1, z: 0 };
      const p3 = { x: 0, y: 0, z: 1 };

      const plane = createSectionPlaneFromThreePoints(p1, p2, p3, 'sec_plane_1');
      expect(plane.id).toBe('sec_plane_1');
      expect(plane.containsPoint(p1)).toBe(true);
      expect(plane.containsPoint(p2)).toBe(true);
      expect(plane.containsPoint(p3)).toBe(true);
    });

    it('throws error when 3 points are collinear', () => {
      const p1 = { x: 0, y: 0, z: 0 };
      const p2 = { x: 1, y: 1, z: 1 };
      const p3 = { x: 2, y: 2, z: 2 };
      expect(() => createSectionPlaneFromThreePoints(p1, p2, p3)).toThrow();
    });

    it('creates section plane from point and normal vector', () => {
      const pt = { x: 2, y: 3, z: 4 };
      const normal = { x: 0, y: 0, z: 1 };

      const plane = createSectionPlaneFromPointAndNormal(pt, normal);
      expect(plane.containsPoint(pt)).toBe(true);
      expect(plane.normal.z).toBeCloseTo(1);
      // Equation should be z - 4 = 0
      expect(plane.d).toBeCloseTo(-4);
    });
  });

  describe('2. Cross section (Thiết diện)', () => {
    it('computes cross section of cube with plane', () => {
      const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
      const plane = Plane.fromEquation(0, 0, 1, -1); // z = 1

      const cs = createCrossSection(cube, plane);
      expect(cs).not.toBeNull();
      expect(cs!.vertices.length).toBe(4);
      expect(cs!.area).toBeCloseTo(4);
    });

    it('computes cross section of pyramid with mid-height horizontal plane', () => {
      const base = [
        { x: -2, y: -2, z: 0 },
        { x: 2, y: -2, z: 0 },
        { x: 2, y: 2, z: 0 },
        { x: -2, y: 2, z: 0 }
      ];
      const pyr = new Pyramid({ x: 0, y: 0, z: 4 }, base);
      const plane = Plane.fromEquation(0, 0, 1, -2); // z = 2

      const cs = createCrossSection(pyr, plane);
      expect(cs).not.toBeNull();
      expect(cs!.vertices.length).toBe(4);
      expect(cs!.area).toBeCloseTo(4); // 2x2 square
    });

    it('returns null if plane does not intersect solid', () => {
      const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
      const plane = Plane.fromEquation(0, 0, 1, -10); // z = 10
      expect(createCrossSection(cube, plane)).toBeNull();
    });
  });

  describe('3. Perpendicular from point to plane', () => {
    it('constructs a 3D line passing through point and perpendicular to plane', () => {
      const pt = { x: 1, y: 2, z: 5 };
      // Plane: x + y + z - 1 = 0 (normal: (1/sqrt(3), 1/sqrt(3), 1/sqrt(3)))
      const plane = Plane.fromEquation(1, 1, 1, -1);

      const perpLine = createPerpendicularFromPointToPlane(pt, plane, 'perp_line_1');
      expect(perpLine.id).toBe('perp_line_1');
      expect(perpLine.point).toEqual(pt);
      // Line direction is parallel to plane normal
      expect(perpLine.direction.isParallel(plane.normal)).toBe(true);

      // Point pt should lie on perpLine
      expect(perpLine.containsPoint(pt)).toBe(true);

      // The projection of pt onto plane should also lie on perpLine
      const proj = plane.projectPoint(pt);
      expect(perpLine.containsPoint(proj.coords)).toBe(true);
    });
  });

  describe('4. Parallel plane through point', () => {
    it('constructs a plane passing through point and parallel to given plane', () => {
      const pt = { x: 3, y: 4, z: 7 };
      // Plane: z = 0 (normal: (0, 0, 1), d: 0)
      const plane = Plane.fromEquation(0, 0, 1, 0);

      const parallelPlane = createParallelPlaneThroughPoint(pt, plane, 'par_plane_1');
      expect(parallelPlane.id).toBe('par_plane_1');
      expect(parallelPlane.containsPoint(pt)).toBe(true);
      expect(parallelPlane.isParallel(plane)).toBe(true);

      // Distance between planes equals distance from pt to original plane
      expect(parallelPlane.distanceToPoint({ x: 0, y: 0, z: 0 })).toBeCloseTo(7);
    });
  });

  describe('5. Intersection of 2 planes -> line', () => {
    it('computes intersection line of xy-plane (z=0) and yz-plane (x=0) as y-axis', () => {
      const p1 = Plane.fromEquation(0, 0, 1, 0); // z = 0
      const p2 = Plane.fromEquation(1, 0, 0, 0); // x = 0

      const line = createPlaneIntersectionLine(p1, p2, 'inter_line_1');
      expect(line).not.toBeNull();
      if (!line) return;

      expect(line.id).toBe('inter_line_1');
      // Intersection line direction is parallel to y-axis (0, 1, 0)
      expect(line.direction.isParallel(new Vector3D(0, 1, 0))).toBe(true);

      // Origin (0,0,0) lies on both planes and on the intersection line
      expect(line.containsPoint({ x: 0, y: 0, z: 0 })).toBe(true);
      // (0, 5, 0) also lies on the intersection line
      expect(line.containsPoint({ x: 0, y: 5, z: 0 })).toBe(true);
    });

    it('computes intersection line of tilted planes', () => {
      // Plane 1: x + y = 2
      const p1 = Plane.fromEquation(1, 1, 0, -2);
      // Plane 2: x - y = 0
      const p2 = Plane.fromEquation(1, -1, 0, 0);

      const line = createPlaneIntersectionLine(p1, p2);
      expect(line).not.toBeNull();
      if (!line) return;

      // The intersection of x+y=2 and x-y=0 is the line x=1, y=1 parallel to z-axis
      expect(line.direction.isParallel(new Vector3D(0, 0, 1))).toBe(true);
      expect(line.containsPoint({ x: 1, y: 1, z: 0 })).toBe(true);
      expect(line.containsPoint({ x: 1, y: 1, z: 10 })).toBe(true);
    });

    it('returns null for parallel planes', () => {
      const p1 = Plane.fromEquation(0, 0, 1, -2); // z = 2
      const p2 = Plane.fromEquation(0, 0, 1, -5); // z = 5
      expect(createPlaneIntersectionLine(p1, p2)).toBeNull();
    });

    it('returns null for identical/coincident planes', () => {
      const p1 = Plane.fromEquation(1, 2, 3, -4);
      const p2 = Plane.fromEquation(2, 4, 6, -8);
      expect(createPlaneIntersectionLine(p1, p2)).toBeNull();
    });
  });

  describe('6. Projection of point onto plane', () => {
    it('projects 3D point perpendicularly onto plane', () => {
      const pt = { x: 3, y: 4, z: 5 };
      // Plane z = 0 (xy-plane)
      const plane = Plane.fromEquation(0, 0, 1, 0);

      const proj = projectPointOntoPlane(pt, plane, 'proj_pt_1');
      expect(proj.id).toBe('proj_pt_1');
      expect(proj.x).toBeCloseTo(3);
      expect(proj.y).toBeCloseTo(4);
      expect(proj.z).toBeCloseTo(0);

      expect(plane.containsPoint(proj.coords)).toBe(true);
    });

    it('projects point onto tilted plane: x + y + z = 3 from origin (0,0,0)', () => {
      const pt = { x: 0, y: 0, z: 0 };
      const plane = Plane.fromEquation(1, 1, 1, -3);

      const proj = projectPointOntoPlane(pt, plane);
      expect(proj.x).toBeCloseTo(1);
      expect(proj.y).toBeCloseTo(1);
      expect(proj.z).toBeCloseTo(1);
      expect(plane.containsPoint(proj.coords)).toBe(true);
    });
  });
});

describe('3D Constructions - Registry Integration', () => {
  beforeAll(() => {
    registerBuiltinConstructions();
  });

  it('registers all 6 3D constructions into ConstructionRegistry', () => {
    const registry = ConstructionRegistry.getInstance();

    const ids = [
      'section_plane',
      'cross_section',
      'perpendicular_point_plane',
      'parallel_plane_point',
      'intersection_planes',
      'project_point_plane'
    ];

    for (const id of ids) {
      const def = registry.getConstruction(id);
      expect(def).toBeDefined();
      expect(def!.id).toBe(id);
    }
  });

  it('matches and creates command for section_plane with 3 points', () => {
    const registry = ConstructionRegistry.getInstance();
    const secDef = registry.getConstruction('section_plane')!;

    const pts: GeometryObject[] = [
      { id: 'p1', type: 'point', dimension: 3, definition: { kind: 'point3d' } },
      { id: 'p2', type: 'point', dimension: 3, definition: { kind: 'point3d' } },
      { id: 'p3', type: 'point', dimension: 3, definition: { kind: 'point3d' } }
    ];

    expect(secDef.match(pts)).toBe(true);
    const cmd = secDef.createCommand(pts, prefix => `${prefix}_123`);
    expect(cmd).toBeDefined();
    expect(cmd.args.objectType).toBe('plane');
    expect(cmd.args.constructionKind).toBe('section_plane');
  });

  it('matches and creates command for cross_section with 1 solid and 1 plane', () => {
    const registry = ConstructionRegistry.getInstance();
    const csDef = registry.getConstruction('cross_section')!;

    const objs: GeometryObject[] = [
      { id: 'solid1', type: 'solid', dimension: 3, definition: { kind: 'cube' } },
      { id: 'plane1', type: 'plane', dimension: 3, definition: { kind: 'plane' } }
    ];

    expect(csDef.match(objs)).toBe(true);
    const cmd = csDef.createCommand(objs, prefix => `${prefix}_123`);
    expect(cmd).toBeDefined();
    expect(cmd.args.objectType).toBe('polygon');
    expect(cmd.args.constructionKind).toBe('cross_section');
  });

  it('matches and creates command for perpendicular_point_plane', () => {
    const registry = ConstructionRegistry.getInstance();
    const perpDef = registry.getConstruction('perpendicular_point_plane')!;

    const objs: GeometryObject[] = [
      { id: 'p1', type: 'point', dimension: 3, definition: { kind: 'point3d' } },
      { id: 'plane1', type: 'plane', dimension: 3, definition: { kind: 'plane' } }
    ];

    expect(perpDef.match(objs)).toBe(true);
    const cmd = perpDef.createCommand(objs, prefix => `${prefix}_123`);
    expect(cmd.args.objectType).toBe('line');
    expect(cmd.args.constructionKind).toBe('perpendicular_point_plane');
  });

  it('matches and creates command for parallel_plane_point', () => {
    const registry = ConstructionRegistry.getInstance();
    const parDef = registry.getConstruction('parallel_plane_point')!;

    const objs: GeometryObject[] = [
      { id: 'p1', type: 'point', dimension: 3, definition: { kind: 'point3d' } },
      { id: 'plane1', type: 'plane', dimension: 3, definition: { kind: 'plane' } }
    ];

    expect(parDef.match(objs)).toBe(true);
    const cmd = parDef.createCommand(objs, prefix => `${prefix}_123`);
    expect(cmd.args.objectType).toBe('plane');
    expect(cmd.args.constructionKind).toBe('parallel_plane_point');
  });

  it('matches and creates command for intersection_planes', () => {
    const registry = ConstructionRegistry.getInstance();
    const interDef = registry.getConstruction('intersection_planes')!;

    const objs: GeometryObject[] = [
      { id: 'plane1', type: 'plane', dimension: 3, definition: { kind: 'plane' } },
      { id: 'plane2', type: 'plane', dimension: 3, definition: { kind: 'plane' } }
    ];

    expect(interDef.match(objs)).toBe(true);
    const cmd = interDef.createCommand(objs, prefix => `${prefix}_123`);
    expect(cmd.args.objectType).toBe('line');
    expect(cmd.args.constructionKind).toBe('intersection_planes');
  });

  it('matches and creates command for project_point_plane', () => {
    const registry = ConstructionRegistry.getInstance();
    const projDef = registry.getConstruction('project_point_plane')!;

    const objs: GeometryObject[] = [
      { id: 'p1', type: 'point', dimension: 3, definition: { kind: 'point3d' } },
      { id: 'plane1', type: 'plane', dimension: 3, definition: { kind: 'plane' } }
    ];

    expect(projDef.match(objs)).toBe(true);
    const cmd = projDef.createCommand(objs, prefix => `${prefix}_123`);
    expect(cmd.args.objectType).toBe('point');
    expect(cmd.args.constructionKind).toBe('project_point_plane');
  });
});
