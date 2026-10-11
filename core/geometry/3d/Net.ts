import type { Coords3D } from '../../types/geometry';
import { Vector3D } from '../primitives/3d';
import { PolyhedronSolid, Cube, Cuboid, Tetrahedron, Pyramid, Prism } from './Solids';

export interface NetFace {
  name: string;
  vertices: Coords3D[];
}

export interface NetResult {
  solidKind: string;
  foldRatio: number;
  faces: NetFace[];
}

/**
 * Xoay một điểm quanh một trục đường thẳng (định nghĩa bởi p1 và p2) một góc angle (rad).
 * Sử dụng công thức quay Rodrigues.
 */
function rotatePointAroundAxis(point: Coords3D, axisP1: Coords3D, axisP2: Coords3D, angle: number): Coords3D {
  if (Math.abs(angle) <= 1e-10) {
    return { ...point };
  }

  const k = Vector3D.fromTwoPoints(axisP1, axisP2).normalize();
  const v = Vector3D.fromTwoPoints(axisP1, point);

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Rodrigues formula: v_rot = v*cos + (k x v)*sin + k*(k . v)*(1 - cos)
  const term1 = v.scale(cos);
  const term2 = k.cross(v).scale(sin);
  const term3 = k.scale(k.dot(v) * (1 - cos));

  const rotated = term1.add(term2).add(term3);
  return {
    x: axisP1.x + rotated.x,
    y: axisP1.y + rotated.y,
    z: axisP1.z + rotated.z
  };
}

/**
 * Tính toán hình khai triển (Net flattening) cho một khối đa diện với tỉ lệ gập (foldRatio in [0, 1]).
 * - foldRatio = 0: Trải phẳng hoàn toàn 2D trên mặt phẳng z = 0.
 * - foldRatio = 1: Gập lại thành khối 3D ban đầu.
 */
export function computeSolidNet(solid: PolyhedronSolid, foldRatio = 0): NetResult {
  const clampedRatio = Math.max(0, Math.min(1, foldRatio));

  if (solid instanceof Cube) {
    return computeCubeNet(solid.size, clampedRatio);
  }
  if (solid instanceof Cuboid) {
    return computeCuboidNet(solid.width, solid.depth, solid.height, clampedRatio);
  }
  if (solid instanceof Tetrahedron) {
    return computeTetrahedronNet(solid, clampedRatio);
  }
  if (solid instanceof Pyramid) {
    return computePyramidNet(solid, clampedRatio);
  }
  if (solid instanceof Prism) {
    return computePrismNet(solid, clampedRatio);
  }

  // Fallback tổng quát cho các đa diện khác
  return computeGenericPolyhedronNet(solid, clampedRatio);
}

// ----------------------------------------------------
// 1. Cube Net (Hình khai triển chữ thập của lập phương)
// ----------------------------------------------------
function computeCubeNet(s: number, t: number): NetResult {
  // Góc gập: 0 khi phẳng, pi/2 khi thành lập phương
  const foldAngle = (Math.PI / 2) * t;

  // Mặt đáy (Base) ở z = 0, cố định
  const base: Coords3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: s, y: 0, z: 0 },
    { x: s, y: s, z: 0 },
    { x: 0, y: s, z: 0 }
  ];

  // Mặt trước (Front) nối với cạnh y = 0
  const flatFront: Coords3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: s, y: 0, z: 0 },
    { x: s, y: -s, z: 0 },
    { x: 0, y: -s, z: 0 }
  ];
  const front = flatFront.map(p => rotatePointAroundAxis(p, { x: 0, y: 0, z: 0 }, { x: s, y: 0, z: 0 }, -foldAngle));

  // Mặt sau (Back) nối với cạnh y = s
  const flatBack: Coords3D[] = [
    { x: 0, y: s, z: 0 },
    { x: s, y: s, z: 0 },
    { x: s, y: 2 * s, z: 0 },
    { x: 0, y: 2 * s, z: 0 }
  ];
  const back = flatBack.map(p => rotatePointAroundAxis(p, { x: s, y: s, z: 0 }, { x: 0, y: s, z: 0 }, -foldAngle));

  // Mặt trái (Left) nối với cạnh x = 0
  const flatLeft: Coords3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: s, z: 0 },
    { x: -s, y: s, z: 0 },
    { x: -s, y: 0, z: 0 }
  ];
  const left = flatLeft.map(p => rotatePointAroundAxis(p, { x: 0, y: s, z: 0 }, { x: 0, y: 0, z: 0 }, -foldAngle));

  // Mặt phải (Right) nối với cạnh x = s
  const flatRight: Coords3D[] = [
    { x: s, y: 0, z: 0 },
    { x: s, y: s, z: 0 },
    { x: 2 * s, y: s, z: 0 },
    { x: 2 * s, y: 0, z: 0 }
  ];
  const right = flatRight.map(p => rotatePointAroundAxis(p, { x: s, y: 0, z: 0 }, { x: s, y: s, z: 0 }, -foldAngle));

  // Mặt nắp trên (Top) nối tiếp với mặt Back tại y = 2*s
  const flatTop: Coords3D[] = [
    { x: 0, y: 2 * s, z: 0 },
    { x: s, y: 2 * s, z: 0 },
    { x: s, y: 3 * s, z: 0 },
    { x: 0, y: 3 * s, z: 0 }
  ];
  // Top gấp quanh cạnh y = 2*s một góc foldAngle so với mặt Back,
  // đồng thời chịu chuyển động quay của mặt Back quanh cạnh y = s
  const topMid = flatTop.map(p => rotatePointAroundAxis(p, { x: s, y: 2 * s, z: 0 }, { x: 0, y: 2 * s, z: 0 }, -foldAngle));
  const top = topMid.map(p => rotatePointAroundAxis(p, { x: s, y: s, z: 0 }, { x: 0, y: s, z: 0 }, -foldAngle));

  return {
    solidKind: 'cube',
    foldRatio: t,
    faces: [
      { name: 'bottom', vertices: base },
      { name: 'front', vertices: front },
      { name: 'back', vertices: back },
      { name: 'left', vertices: left },
      { name: 'right', vertices: right },
      { name: 'top', vertices: top }
    ]
  };
}

// ----------------------------------------------------
// 2. Cuboid Net
// ----------------------------------------------------
function computeCuboidNet(w: number, d: number, h: number, t: number): NetResult {
  const foldAngle = (Math.PI / 2) * t;

  // Base w x d
  const base: Coords3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: w, y: 0, z: 0 },
    { x: w, y: d, z: 0 },
    { x: 0, y: d, z: 0 }
  ];

  // Front w x h
  const flatFront: Coords3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: w, y: 0, z: 0 },
    { x: w, y: -h, z: 0 },
    { x: 0, y: -h, z: 0 }
  ];
  const front = flatFront.map(p => rotatePointAroundAxis(p, { x: 0, y: 0, z: 0 }, { x: w, y: 0, z: 0 }, -foldAngle));

  // Back w x h
  const flatBack: Coords3D[] = [
    { x: 0, y: d, z: 0 },
    { x: w, y: d, z: 0 },
    { x: w, y: d + h, z: 0 },
    { x: 0, y: d + h, z: 0 }
  ];
  const back = flatBack.map(p => rotatePointAroundAxis(p, { x: w, y: d, z: 0 }, { x: 0, y: d, z: 0 }, -foldAngle));

  // Left d x h
  const flatLeft: Coords3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: d, z: 0 },
    { x: -h, y: d, z: 0 },
    { x: -h, y: 0, z: 0 }
  ];
  const left = flatLeft.map(p => rotatePointAroundAxis(p, { x: 0, y: d, z: 0 }, { x: 0, y: 0, z: 0 }, -foldAngle));

  // Right d x h
  const flatRight: Coords3D[] = [
    { x: w, y: 0, z: 0 },
    { x: w, y: d, z: 0 },
    { x: w + h, y: d, z: 0 },
    { x: w + h, y: 0, z: 0 }
  ];
  const right = flatRight.map(p => rotatePointAroundAxis(p, { x: w, y: 0, z: 0 }, { x: w, y: d, z: 0 }, -foldAngle));

  // Top w x d
  const flatTop: Coords3D[] = [
    { x: 0, y: d + h, z: 0 },
    { x: w, y: d + h, z: 0 },
    { x: w, y: 2 * d + h, z: 0 },
    { x: 0, y: 2 * d + h, z: 0 }
  ];
  const topMid = flatTop.map(p => rotatePointAroundAxis(p, { x: w, y: d + h, z: 0 }, { x: 0, y: d + h, z: 0 }, -foldAngle));
  const top = topMid.map(p => rotatePointAroundAxis(p, { x: w, y: d, z: 0 }, { x: 0, y: d, z: 0 }, -foldAngle));

  return {
    solidKind: 'cuboid',
    foldRatio: t,
    faces: [
      { name: 'bottom', vertices: base },
      { name: 'front', vertices: front },
      { name: 'back', vertices: back },
      { name: 'left', vertices: left },
      { name: 'right', vertices: right },
      { name: 'top', vertices: top }
    ]
  };
}

// ----------------------------------------------------
// 3. Tetrahedron Net
// ----------------------------------------------------
function computeTetrahedronNet(tet: Tetrahedron, t: number): NetResult {
  // Góc gập nhị diện chuẩn của tứ diện đều xấp xỉ 70.53 độ (1.23 rad)
  const dihedral = Math.acos(1 / 3);
  const foldAngle = dihedral * t;

  const a = tet.a;
  const b = tet.b;
  const c = tet.c;

  // Mặt đáy cố định ABC
  const base: Coords3D[] = [a, b, c];

  // 3 mặt bên xoay quanh 3 cạnh đáy [AB], [BC], [CA]
  const faceD_AB = [a, b, rotatePointAroundAxis(tet.d, a, b, (1 - t) * (Math.PI - dihedral))];
  const faceD_BC = [b, c, rotatePointAroundAxis(tet.d, b, c, (1 - t) * (Math.PI - dihedral))];
  const faceD_CA = [c, a, rotatePointAroundAxis(tet.d, c, a, (1 - t) * (Math.PI - dihedral))];

  return {
    solidKind: 'tetrahedron',
    foldRatio: t,
    faces: [
      { name: 'base', vertices: base },
      { name: 'face_ab', vertices: faceD_AB },
      { name: 'face_bc', vertices: faceD_BC },
      { name: 'face_ca', vertices: faceD_CA }
    ]
  };
}

// ----------------------------------------------------
// 4. Pyramid Net
// ----------------------------------------------------
function computePyramidNet(pyr: Pyramid, t: number): NetResult {
  const baseVerts = pyr.baseVertices;
  const apex = pyr.apex;
  const n = baseVerts.length;

  const faces: NetFace[] = [
    { name: 'base', vertices: baseVerts.map(v => ({ ...v })) }
  ];

  // Mỗi mặt bên là tam giác nối [Bi, Bi+1] với apex xoay quanh cạnh đáy
  for (let i = 0; i < n; i++) {
    const p1 = baseVerts[i]!;
    const p2 = baseVerts[(i + 1) % n]!;

    // Góc mở khi t = 0 là phẳng ra, khi t = 1 là góc gốc
    const unfoldedApex = rotatePointAroundAxis(apex, p1, p2, (1 - t) * (Math.PI * 0.4));
    faces.push({
      name: `lateral_${i}`,
      vertices: [p1, p2, unfoldedApex]
    });
  }

  return {
    solidKind: 'pyramid',
    foldRatio: t,
    faces
  };
}

// ----------------------------------------------------
// 5. Prism Net
// ----------------------------------------------------
function computePrismNet(prism: Prism, t: number): NetResult {
  const base = prism.baseVertices;
  const top = prism.topVertices;
  const n = base.length;

  const faces: NetFace[] = [
    { name: 'bottom', vertices: base.map(v => ({ ...v })) },
    {
      name: 'top',
      vertices: top.map(v => rotatePointAroundAxis(v, base[0]!, base[1]!, (1 - t) * (Math.PI * 0.5)))
    }
  ];

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const b1 = base[i]!;
    const b2 = base[next]!;
    const t2 = top[next]!;
    const t1 = top[i]!;

    const rotatedT2 = rotatePointAroundAxis(t2, b1, b2, (1 - t) * (Math.PI * 0.5));
    const rotatedT1 = rotatePointAroundAxis(t1, b1, b2, (1 - t) * (Math.PI * 0.5));

    faces.push({
      name: `side_${i}`,
      vertices: [b1, b2, rotatedT2, rotatedT1]
    });
  }

  return {
    solidKind: 'prism',
    foldRatio: t,
    faces
  };
}

// ----------------------------------------------------
// Fallback tổng quát cho đa diện
// ----------------------------------------------------
function computeGenericPolyhedronNet(solid: PolyhedronSolid, t: number): NetResult {
  const verts = solid.vertices.map(v => v.coords);
  const faces = solid.faces;

  const netFaces: NetFace[] = faces.map((f, idx) => ({
    name: `face_${idx}`,
    vertices: f.map(vi => verts[vi] || { x: 0, y: 0, z: 0 })
  }));

  return {
    solidKind: solid.kind,
    foldRatio: t,
    faces: netFaces
  };
}
