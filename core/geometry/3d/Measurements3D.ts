import type { Coords3D, GeometryObject } from '../../types/geometry';
import { Vector3D, Line3D, Plane } from '../primitives/3d';
import { BaseSolid, tetrahedronVolume, polygonArea3D, Cube, Cuboid, Tetrahedron, Pyramid, Prism, PyramidalFrustum, Sphere, Cylinder, Cone, Frustum } from './Solids';

// ==========================================
// 1. Distance Point - Line (3D)
// ==========================================

/**
 * Tính khoảng cách từ một điểm 3D đến một đường thẳng 3D từ toạ độ thuần túy:
 * d = ||(P - P0) x u|| / ||u||
 */
export function distancePointToLine3DCoords(
  point: Coords3D,
  linePoint: Coords3D,
  lineDirection: Coords3D
): number {
  const dir = lineDirection instanceof Vector3D
    ? lineDirection
    : new Vector3D(lineDirection.x, lineDirection.y, lineDirection.z);
  const mag = dir.magnitude();
  if (mag <= 1e-15 || !isFinite(mag)) {
    // Đường thẳng suy biến thành điểm -> khoảng cách Euclidean tới linePoint
    return Math.hypot(point.x - linePoint.x, point.y - linePoint.y, point.z - linePoint.z);
  }

  const v = Vector3D.fromTwoPoints(linePoint, point);
  const cross = v.cross(dir);
  return cross.magnitude() / mag;
}

/**
 * Tính khoảng cách từ điểm 3D tới đối tượng Line3D
 */
export function distancePointToLine3D(point: Coords3D, line: Line3D): number {
  return line.distanceToPoint(point);
}

// ==========================================
// 2. Distance Point - Plane
// ==========================================

/**
 * Tính khoảng cách từ một điểm đến mặt phẳng từ toạ độ điểm trên mặt phẳng và vector pháp tuyến:
 * d = |(P - P0) . n| / ||n||
 */
export function distancePointToPlaneCoords(
  point: Coords3D,
  planePoint: Coords3D,
  planeNormal: Coords3D
): number {
  const normal = planeNormal instanceof Vector3D
    ? planeNormal
    : new Vector3D(planeNormal.x, planeNormal.y, planeNormal.z);
  const mag = normal.magnitude();
  if (mag <= 1e-15 || !isFinite(mag)) {
    throw new Error('Plane normal vector cannot be zero');
  }

  const v = Vector3D.fromTwoPoints(planePoint, point);
  return Math.abs(v.dot(normal)) / mag;
}

/**
 * Tính khoảng cách từ điểm tới đối tượng Plane:
 * d = |ax + by + cz + d|
 */
export function distancePointToPlane(point: Coords3D, plane: Plane): number {
  return plane.distanceToPoint(point);
}

// ==========================================
// 3. Distance Line - Line (Skew / Parallel Lines in 3D)
// ==========================================

/**
 * Tính khoảng cách giữa hai đường thẳng trong không gian 3D:
 * - Nếu hai đường thẳng song song/trùng nhau: d = khoảng cách từ P1 tới L2
 * - Nếu hai đường thẳng chéo nhau (skew lines) hoặc cắt nhau:
 *     d = |(P2 - P1) . (u1 x u2)| / ||u1 x u2||
 */
export function distanceLineToLine3DCoords(
  p1: Coords3D,
  dir1: Coords3D,
  p2: Coords3D,
  dir2: Coords3D,
  tolerance = 1e-8
): number {
  const u1 = dir1 instanceof Vector3D ? dir1 : new Vector3D(dir1.x, dir1.y, dir1.z);
  const u2 = dir2 instanceof Vector3D ? dir2 : new Vector3D(dir2.x, dir2.y, dir2.z);

  const cross = u1.cross(u2);
  const crossMag = cross.magnitude();

  // Kiểm tra hai đường thẳng có song song hoặc trùng nhau không
  if (crossMag <= tolerance) {
    return distancePointToLine3DCoords(p1, p2, u2);
  }

  // Hai đường thẳng chéo nhau hoặc cắt nhau
  const p1p2 = Vector3D.fromTwoPoints(p1, p2);
  return Math.abs(p1p2.dot(cross)) / crossMag;
}

/**
 * Tính khoảng cách giữa hai đối tượng Line3D
 */
export function distanceLineToLine3D(l1: Line3D, l2: Line3D, tolerance = 1e-8): number {
  return distanceLineToLine3DCoords(l1.point, l1.direction, l2.point, l2.direction, tolerance);
}

// ==========================================
// 4. Angle Line - Line (3D)
// ==========================================

/**
 * Tính góc giữa hai đường thẳng trong không gian 3D (0 <= phi <= pi/2 hay 0° đến 90°):
 * cos(phi) = |u1 . u2| / (||u1|| * ||u2||)
 */
export function angleLineToLine3DCoords(dir1: Coords3D, dir2: Coords3D): number {
  const u1 = dir1 instanceof Vector3D ? dir1 : new Vector3D(dir1.x, dir1.y, dir1.z);
  const u2 = dir2 instanceof Vector3D ? dir2 : new Vector3D(dir2.x, dir2.y, dir2.z);

  const denom = u1.magnitude() * u2.magnitude();
  if (denom <= 1e-15 || !isFinite(denom)) {
    return 0;
  }

  const cosTheta = Math.abs(u1.dot(u2)) / denom;
  const clamped = Math.max(0, Math.min(1, cosTheta));
  return Math.acos(clamped);
}

/**
 * Tính góc giữa hai đối tượng Line3D
 */
export function angleLineToLine3D(l1: Line3D, l2: Line3D): number {
  return angleLineToLine3DCoords(l1.direction, l2.direction);
}

// ==========================================
// 5. Angle Line - Plane
// ==========================================

/**
 * Tính góc giữa một đường thẳng và một mặt phẳng trong không gian 3D (0 <= theta <= pi/2):
 * sin(theta) = |u . n| / (||u|| * ||n||)
 */
export function angleLineToPlaneCoords(lineDir: Coords3D, planeNormal: Coords3D): number {
  const u = lineDir instanceof Vector3D ? lineDir : new Vector3D(lineDir.x, lineDir.y, lineDir.z);
  const n = planeNormal instanceof Vector3D ? planeNormal : new Vector3D(planeNormal.x, planeNormal.y, planeNormal.z);

  const denom = u.magnitude() * n.magnitude();
  if (denom <= 1e-15 || !isFinite(denom)) {
    return 0;
  }

  const sinTheta = Math.abs(u.dot(n)) / denom;
  const clamped = Math.max(0, Math.min(1, sinTheta));
  return Math.asin(clamped);
}

/**
 * Tính góc giữa đối tượng Line3D và đối tượng Plane
 */
export function angleLineToPlane(line: Line3D, plane: Plane): number {
  return angleLineToPlaneCoords(line.direction, plane.normal);
}

// ==========================================
// 6. Angle Plane - Plane (Dihedral Angle)
// ==========================================

/**
 * Tính góc giữa hai mặt phẳng trong không gian 3D (0 <= phi <= pi/2):
 * cos(phi) = |n1 . n2| / (||n1|| * ||n2||)
 */
export function anglePlaneToPlaneCoords(normal1: Coords3D, normal2: Coords3D): number {
  const n1 = normal1 instanceof Vector3D ? normal1 : new Vector3D(normal1.x, normal1.y, normal1.z);
  const n2 = normal2 instanceof Vector3D ? normal2 : new Vector3D(normal2.x, normal2.y, normal2.z);

  const denom = n1.magnitude() * n2.magnitude();
  if (denom <= 1e-15 || !isFinite(denom)) {
    return 0;
  }

  const cosPhi = Math.abs(n1.dot(n2)) / denom;
  const clamped = Math.max(0, Math.min(1, cosPhi));
  return Math.acos(clamped);
}

/**
 * Tính góc giữa hai đối tượng Plane
 */
export function anglePlaneToPlane(p1: Plane, p2: Plane): number {
  return anglePlaneToPlaneCoords(p1.normal, p2.normal);
}

/**
 * Tính góc nhị diện (Dihedral Angle) giữa hai nửa mặt phẳng có chung cạnh edgeP1-edgeP2:
 * N1 = (edgeP2 - edgeP1) x (facePointA - edgeP1)
 * N2 = (edgeP2 - edgeP1) x (facePointB - edgeP1)
 * angle = arccos( (N1 . N2) / (||N1|| * ||N2||) ) trong khoảng [0, pi]
 */
export function dihedralAngle(
  edgeP1: Coords3D,
  edgeP2: Coords3D,
  facePointA: Coords3D,
  facePointB: Coords3D
): number {
  const edge = Vector3D.fromTwoPoints(edgeP1, edgeP2);
  const vA = Vector3D.fromTwoPoints(edgeP1, facePointA);
  const vB = Vector3D.fromTwoPoints(edgeP1, facePointB);

  const n1 = edge.cross(vA);
  const n2 = edge.cross(vB);

  const denom = n1.magnitude() * n2.magnitude();
  if (denom <= 1e-15 || !isFinite(denom)) {
    return 0;
  }

  const cosTheta = n1.dot(n2) / denom;
  const clamped = Math.max(-1, Math.min(1, cosTheta));
  return Math.acos(clamped);
}

// ==========================================
// 7. Volume Measurements
// ==========================================

export function sphereVolume(radius: number): number {
  if (radius <= 0) return 0;
  return (4 / 3) * Math.PI * Math.pow(radius, 3);
}

export function cylinderVolume(radius: number, height: number): number {
  if (radius <= 0 || height <= 0) return 0;
  return Math.PI * Math.pow(radius, 2) * height;
}

export function coneVolume(radius: number, height: number): number {
  if (radius <= 0 || height <= 0) return 0;
  return (1 / 3) * Math.PI * Math.pow(radius, 2) * height;
}

export function frustumVolume(bottomRadius: number, topRadius: number, height: number): number {
  if (height <= 0 || (bottomRadius <= 0 && topRadius <= 0)) return 0;
  return (1 / 3) * Math.PI * height * (bottomRadius * bottomRadius + bottomRadius * topRadius + topRadius * topRadius);
}

export function cubeVolume(size: number): number {
  if (size <= 0) return 0;
  return Math.pow(size, 3);
}

export function cuboidVolume(width: number, depth: number, height: number): number {
  if (width <= 0 || depth <= 0 || height <= 0) return 0;
  return width * depth * height;
}

export function pyramidVolume(apex: Coords3D, baseVertices: Coords3D[]): number {
  const n = baseVertices.length;
  if (n < 3) return 0;
  let totalVol = 0;
  const p0 = baseVertices[0]!;
  for (let i = 1; i < n - 1; i++) {
    const p1 = baseVertices[i]!;
    const p2 = baseVertices[i + 1]!;
    totalVol += tetrahedronVolume(apex, p0, p1, p2);
  }
  return totalVol;
}

export function prismVolume(baseVertices: Coords3D[], extrusionOrTop: number | Coords3D | Coords3D[]): number {
  const baseArea = polygonArea3D(baseVertices);
  if (baseArea <= 0) return 0;

  if (typeof extrusionOrTop === 'number') {
    return baseArea * Math.abs(extrusionOrTop);
  }
  if (Array.isArray(extrusionOrTop)) {
    // Top vertices
    const prism = new Prism(baseVertices, extrusionOrTop);
    return prism.volume();
  }
  // Vector extrusion
  const extrusionVec = extrusionOrTop instanceof Vector3D
    ? extrusionOrTop
    : new Vector3D(extrusionOrTop.x, extrusionOrTop.y, extrusionOrTop.z);
  return baseArea * extrusionVec.magnitude();
}

/**
 * Hàm đo thể tích tổng quát cho mọi đối tượng hình học 3D (Solid primitive hoặc GeometryObject)
 */
export function volume(target: BaseSolid | GeometryObject): number {
  if (target instanceof BaseSolid) {
    return target.volume();
  }

  // Nếu là plain GeometryObject definition
  const def = (target.definition || {}) as Record<string, unknown>;
  switch (def.kind) {
    case 'cube':
      return cubeVolume(def.size as number);
    case 'cuboid':
      return cuboidVolume(def.width as number, def.depth as number, def.height as number);
    case 'sphere':
      return sphereVolume(def.radius as number);
    case 'cylinder': {
      const b = def.bottomCenter as Coords3D;
      const t = def.topCenter as Coords3D;
      const h = Math.hypot(t.x - b.x, t.y - b.y, t.z - b.z);
      return cylinderVolume(def.radius as number, h);
    }
    case 'cone': {
      const b = def.baseCenter as Coords3D;
      const a = def.apex as Coords3D;
      const h = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      return coneVolume(def.radius as number, h);
    }
    case 'frustum': {
      const b = def.bottomCenter as Coords3D;
      const t = def.topCenter as Coords3D;
      const h = Math.hypot(t.x - b.x, t.y - b.y, t.z - b.z);
      return frustumVolume(def.bottomRadius as number, def.topRadius as number, h);
    }
    case 'tetrahedron':
      return tetrahedronVolume(def.a as Coords3D, def.b as Coords3D, def.c as Coords3D, def.d as Coords3D);
    case 'pyramid':
      return pyramidVolume(def.apex as Coords3D, def.baseVertices as Coords3D[]);
    case 'prism':
      return new Prism(def.baseVertices as Coords3D[], def.topVertices as Coords3D[]).volume();
    case 'pyramidal_frustum':
      return new PyramidalFrustum(def.bottomVertices as Coords3D[], def.topVertices as Coords3D[]).volume();
    default:
      throw new Error(`Cannot measure volume of object with kind: ${String(def.kind)}`);
  }
}

// ==========================================
// 8. Surface Area & Lateral Area Measurements
// ==========================================

export function sphereSurfaceArea(radius: number): number {
  if (radius <= 0) return 0;
  return 4 * Math.PI * Math.pow(radius, 2);
}

export function cylinderLateralArea(radius: number, height: number): number {
  if (radius <= 0 || height <= 0) return 0;
  return 2 * Math.PI * radius * height;
}

export function cylinderSurfaceArea(radius: number, height: number): number {
  if (radius <= 0 || height <= 0) return 0;
  return cylinderLateralArea(radius, height) + 2 * Math.PI * Math.pow(radius, 2);
}

export function coneLateralArea(radius: number, height: number): number {
  if (radius <= 0 || height <= 0) return 0;
  const slant = Math.hypot(radius, height);
  return Math.PI * radius * slant;
}

export function coneSurfaceArea(radius: number, height: number): number {
  if (radius <= 0 || height <= 0) return 0;
  return coneLateralArea(radius, height) + Math.PI * Math.pow(radius, 2);
}

export function frustumLateralArea(bottomRadius: number, topRadius: number, height: number): number {
  if (height <= 0 || (bottomRadius <= 0 && topRadius <= 0)) return 0;
  const slant = Math.hypot(height, bottomRadius - topRadius);
  return Math.PI * (bottomRadius + topRadius) * slant;
}

export function frustumSurfaceArea(bottomRadius: number, topRadius: number, height: number): number {
  if (height <= 0 || (bottomRadius <= 0 && topRadius <= 0)) return 0;
  const lat = frustumLateralArea(bottomRadius, topRadius, height);
  return lat + Math.PI * (bottomRadius * bottomRadius + topRadius * topRadius);
}

export function cubeSurfaceArea(size: number): number {
  if (size <= 0) return 0;
  return 6 * Math.pow(size, 2);
}

export function cubeLateralArea(size: number): number {
  if (size <= 0) return 0;
  return 4 * Math.pow(size, 2);
}

export function cuboidSurfaceArea(width: number, depth: number, height: number): number {
  if (width <= 0 || depth <= 0 || height <= 0) return 0;
  return 2 * (width * depth + depth * height + height * width);
}

export function cuboidLateralArea(width: number, depth: number, height: number): number {
  if (width <= 0 || depth <= 0 || height <= 0) return 0;
  return 2 * height * (width + depth);
}

/**
 * Hàm đo diện tích toàn phần (Surface Area) tổng quát cho đối tượng 3D
 */
export function surfaceArea(target: BaseSolid | GeometryObject): number {
  if (target instanceof BaseSolid) {
    return target.surfaceArea();
  }

  const def = (target.definition || {}) as Record<string, unknown>;
  switch (def.kind) {
    case 'cube':
      return cubeSurfaceArea(def.size as number);
    case 'cuboid':
      return cuboidSurfaceArea(def.width as number, def.depth as number, def.height as number);
    case 'sphere':
      return sphereSurfaceArea(def.radius as number);
    case 'cylinder': {
      const b = def.bottomCenter as Coords3D;
      const t = def.topCenter as Coords3D;
      const h = Math.hypot(t.x - b.x, t.y - b.y, t.z - b.z);
      return cylinderSurfaceArea(def.radius as number, h);
    }
    case 'cone': {
      const b = def.baseCenter as Coords3D;
      const a = def.apex as Coords3D;
      const h = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      return coneSurfaceArea(def.radius as number, h);
    }
    case 'frustum': {
      const b = def.bottomCenter as Coords3D;
      const t = def.topCenter as Coords3D;
      const h = Math.hypot(t.x - b.x, t.y - b.y, t.z - b.z);
      return frustumSurfaceArea(def.bottomRadius as number, def.topRadius as number, h);
    }
    case 'tetrahedron':
      return new Tetrahedron(def.a as Coords3D, def.b as Coords3D, def.c as Coords3D, def.d as Coords3D).surfaceArea();
    case 'pyramid':
      return new Pyramid(def.apex as Coords3D, def.baseVertices as Coords3D[]).surfaceArea();
    case 'prism':
      return new Prism(def.baseVertices as Coords3D[], def.topVertices as Coords3D[]).surfaceArea();
    case 'pyramidal_frustum':
      return new PyramidalFrustum(def.bottomVertices as Coords3D[], def.topVertices as Coords3D[]).surfaceArea();
    default:
      throw new Error(`Cannot measure surface area of object with kind: ${String(def.kind)}`);
  }
}

/**
 * Hàm đo diện tích xung quanh (Lateral Area) tổng quát cho đối tượng 3D
 */
export function lateralArea(target: BaseSolid | GeometryObject): number {
  if (target instanceof BaseSolid) {
    return target.lateralArea();
  }

  const def = (target.definition || {}) as Record<string, unknown>;
  switch (def.kind) {
    case 'cube':
      return cubeLateralArea(def.size as number);
    case 'cuboid':
      return cuboidLateralArea(def.width as number, def.depth as number, def.height as number);
    case 'sphere':
      return sphereSurfaceArea(def.radius as number);
    case 'cylinder': {
      const b = def.bottomCenter as Coords3D;
      const t = def.topCenter as Coords3D;
      const h = Math.hypot(t.x - b.x, t.y - b.y, t.z - b.z);
      return cylinderLateralArea(def.radius as number, h);
    }
    case 'cone': {
      const b = def.baseCenter as Coords3D;
      const a = def.apex as Coords3D;
      const h = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      return coneLateralArea(def.radius as number, h);
    }
    case 'frustum': {
      const b = def.bottomCenter as Coords3D;
      const t = def.topCenter as Coords3D;
      const h = Math.hypot(t.x - b.x, t.y - b.y, t.z - b.z);
      return frustumLateralArea(def.bottomRadius as number, def.topRadius as number, h);
    }
    case 'tetrahedron':
      return new Tetrahedron(def.a as Coords3D, def.b as Coords3D, def.c as Coords3D, def.d as Coords3D).lateralArea();
    case 'pyramid':
      return new Pyramid(def.apex as Coords3D, def.baseVertices as Coords3D[]).lateralArea();
    case 'prism':
      return new Prism(def.baseVertices as Coords3D[], def.topVertices as Coords3D[]).lateralArea();
    case 'pyramidal_frustum':
      return new PyramidalFrustum(def.bottomVertices as Coords3D[], def.topVertices as Coords3D[]).lateralArea();
    default:
      throw new Error(`Cannot measure lateral area of object with kind: ${String(def.kind)}`);
  }
}
