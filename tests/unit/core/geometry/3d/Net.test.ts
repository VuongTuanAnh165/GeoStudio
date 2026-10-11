import { describe, it, expect } from 'vitest';
import { computeSolidNet } from '../../../../../core/geometry/3d/Net';
import { Cube, Cuboid, Tetrahedron, Pyramid, Prism } from '../../../../../core/geometry/3d/Solids';

describe('3D Net (Hình khai triển)', () => {
  it('computes 6 faces for Cube net at foldRatio = 0 (completely flat)', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    const net = computeSolidNet(cube, 0);

    expect(net.solidKind).toBe('cube');
    expect(net.foldRatio).toBe(0);
    expect(net.faces.length).toBe(6);

    // When flat (foldRatio = 0), all vertices should lie in plane z = 0
    for (const face of net.faces) {
      expect(face.vertices.length).toBe(4);
      for (const v of face.vertices) {
        expect(v.z).toBeCloseTo(0);
      }
    }
  });

  it('computes Cube net at foldRatio = 1 (folded 3D box)', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2);
    const net = computeSolidNet(cube, 1);

    expect(net.foldRatio).toBe(1);
    expect(net.faces.length).toBe(6);

    // Top face should be at z = 2
    const topFace = net.faces.find(f => f.name === 'top');
    expect(topFace).toBeDefined();
    for (const v of topFace!.vertices) {
      expect(v.z).toBeCloseTo(2);
    }
  });

  it('computes Cuboid net', () => {
    const cuboid = new Cuboid({ x: 0, y: 0, z: 0 }, 2, 3, 4);
    const netFlat = computeSolidNet(cuboid, 0);
    expect(netFlat.solidKind).toBe('cuboid');
    expect(netFlat.faces.length).toBe(6);
    for (const face of netFlat.faces) {
      for (const v of face.vertices) {
        expect(v.z).toBeCloseTo(0);
      }
    }

    const netFolded = computeSolidNet(cuboid, 1);
    const topFace = netFolded.faces.find(f => f.name === 'top');
    expect(topFace).toBeDefined();
    for (const v of topFace!.vertices) {
      expect(v.z).toBeCloseTo(4); // height is 4
    }
  });

  it('computes Tetrahedron net with 4 triangular faces', () => {
    const tet = new Tetrahedron(
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1.732, z: 0 },
      { x: 1, y: 0.577, z: 1.633 }
    );
    const net = computeSolidNet(tet, 0);
    expect(net.solidKind).toBe('tetrahedron');
    expect(net.faces.length).toBe(4);
    for (const face of net.faces) {
      expect(face.vertices.length).toBe(3);
    }
  });

  it('computes Pyramid net with base and triangular lateral faces', () => {
    const base = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 0, y: 2, z: 0 }
    ];
    const pyr = new Pyramid({ x: 1, y: 1, z: 3 }, base);
    const net = computeSolidNet(pyr, 0);
    expect(net.solidKind).toBe('pyramid');
    expect(net.faces.length).toBe(5); // 1 base + 4 lateral
  });

  it('computes Prism net', () => {
    const base = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1.5, z: 0 }
    ];
    const top = [
      { x: 0, y: 0, z: 3 },
      { x: 2, y: 0, z: 3 },
      { x: 1, y: 1.5, z: 3 }
    ];
    const prism = new Prism(base, top);
    const net = computeSolidNet(prism, 0);
    expect(net.solidKind).toBe('prism');
    expect(net.faces.length).toBe(5); // 2 bases + 3 sides
  });
});
