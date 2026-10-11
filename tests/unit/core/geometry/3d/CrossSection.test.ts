import { describe, it, expect } from 'vitest';
import { computeCrossSection } from '../../../../../core/geometry/3d/CrossSection';
import { Cube, Pyramid, Tetrahedron } from '../../../../../core/geometry/3d/Solids';
import { Plane } from '../../../../../core/geometry/primitives/3d';

describe('3D Cross-Section (Thiết diện)', () => {
  it('computes square cross-section for Cube cut by horizontal plane z = 1', () => {
    // Cube from (0,0,0) with size 2
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    // Plane z = 1 -> z - 1 = 0
    const plane = Plane.fromEquation(0, 0, 1, -1);

    const result = computeCrossSection(cube, plane);
    expect(result).not.toBeNull();
    if (!result) return;

    // 4 edges cut -> 4 vertices forming a square of side 2
    expect(result.vertices.length).toBe(4);
    expect(result.area).toBeCloseTo(4); // 2 x 2 = 4

    // Every vertex should have z = 1
    for (const v of result.vertices) {
      expect(v.z).toBeCloseTo(1);
    }
  });

  it('computes rectangular cross-section for Cube cut by vertical plane x = 1', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    const plane = Plane.fromEquation(1, 0, 0, -1);

    const result = computeCrossSection(cube, plane);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.vertices.length).toBe(4);
    expect(result.area).toBeCloseTo(4);
    for (const v of result.vertices) {
      expect(v.x).toBeCloseTo(1);
    }
  });

  it('computes triangular cross-section cutting 3 edges at a corner of Cube', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    // Plane x + y + z = 1 cuts at (1,0,0), (0,1,0), (0,0,1)
    const plane = Plane.fromEquation(1, 1, 1, -1);

    const result = computeCrossSection(cube, plane);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.vertices.length).toBe(3);
    // Equilateral triangle with side = sqrt(2) -> Area = (sqrt(2)^2 * sqrt(3)) / 4 = sqrt(3)/2 ≈ 0.866
    expect(result.area).toBeCloseTo(Math.sqrt(3) / 2, 2);
  });

  it('computes hexagonal cross-section when plane cuts through 6 edges of Cube', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    // Plane passing through center with normal (1, 1, 1): x + y + z = 3
    const plane = Plane.fromEquation(1, 1, 1, -3);

    const result = computeCrossSection(cube, plane);
    expect(result).not.toBeNull();
    if (!result) return;

    // Cuts 6 faces -> 6 vertices
    expect(result.vertices.length).toBe(6);
    expect(result.area).toBeGreaterThan(0);
  });

  it('returns null when plane does not intersect solid', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    // Plane far away: z = 10
    const plane = Plane.fromEquation(0, 0, 1, -10);

    const result = computeCrossSection(cube, plane);
    expect(result).toBeNull();
  });

  it('computes cross-section of regular pyramid by horizontal plane at mid-height', () => {
    // Base 4x4 at z=0, apex at (0, 0, 4)
    const base = [
      { x: -2, y: -2, z: 0 },
      { x: 2, y: -2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: -2, y: 2, z: 0 }
    ];
    const pyr = new Pyramid({ x: 0, y: 0, z: 4 }, base);
    // Plane at z = 2 (mid-height) -> square with half side (2x2) -> Area = 4
    const plane = Plane.fromEquation(0, 0, 1, -2);

    const result = computeCrossSection(pyr, plane);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.vertices.length).toBe(4);
    expect(result.area).toBeCloseTo(4);
  });

  it('computes cross-section of tetrahedron', () => {
    const tet = new Tetrahedron(
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 4, z: 0 },
      { x: 0, y: 0, z: 4 }
    );
    // Horizontal plane at z = 2
    const plane = Plane.fromEquation(0, 0, 1, -2);
    const result = computeCrossSection(tet, plane);
    expect(result).not.toBeNull();
    if (!result) return;

    // Should be a triangle
    expect(result.vertices.length).toBe(3);
    expect(result.area).toBeGreaterThan(0);
  });
});
