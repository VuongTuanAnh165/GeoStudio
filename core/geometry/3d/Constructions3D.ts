import type { Coords3D } from '../../types/geometry';
import { Point3D, Line3D, Plane, Vector3D } from '../primitives/3d';
import { PolyhedronSolid } from './Solids';
import { computeCrossSection, type CrossSectionResult } from './CrossSection';

// ========================================================
// 1. Section Plane (Mặt phẳng cắt)
// ========================================================

/**
 * Tạo mặt phẳng cắt đi qua 3 điểm không thẳng hàng trong không gian 3D.
 */
export function createSectionPlaneFromThreePoints(
  p1: Coords3D,
  p2: Coords3D,
  p3: Coords3D,
  id?: string
): Plane {
  return Plane.fromThreePoints(p1, p2, p3, id);
}

/**
 * Tạo mặt phẳng cắt đi qua 1 điểm và có vector pháp tuyến cho trước.
 */
export function createSectionPlaneFromPointAndNormal(
  point: Coords3D,
  normal: Coords3D | Vector3D,
  id?: string
): Plane {
  return Plane.fromPointAndNormal(point, normal, id);
}

// ========================================================
// 2. Cross Section (Thiết diện đa diện với mặt phẳng)
// ========================================================

/**
 * Tính toán thiết diện (đa giác mặt cắt) giữa một khối đa diện và một mặt phẳng.
 */
export function createCrossSection(
  solid: PolyhedronSolid,
  plane: Plane,
  tolerance = 1e-6
): CrossSectionResult | null {
  return computeCrossSection(solid, plane, tolerance);
}

// ========================================================
// 3. Perpendicular from Point to Plane
//    (Đường thẳng qua điểm vuông góc với mặt phẳng)
// ========================================================

/**
 * Dựng đường thẳng đi qua điểm point và vuông góc với mặt phẳng plane.
 * Vector chỉ phương của đường thẳng trùng với vector pháp tuyến của mặt phẳng.
 */
export function createPerpendicularFromPointToPlane(
  point: Coords3D,
  plane: Plane,
  id?: string
): Line3D {
  return new Line3D(point, plane.normal, id);
}

// ========================================================
// 4. Parallel Plane Through Point
//    (Mặt phẳng qua điểm song song với mặt phẳng cho trước)
// ========================================================

/**
 * Dựng mặt phẳng đi qua điểm point và song song với mặt phẳng plane.
 * Mặt phẳng mới có cùng vector pháp tuyến với mặt phẳng gốc.
 */
export function createParallelPlaneThroughPoint(
  point: Coords3D,
  plane: Plane,
  id?: string
): Plane {
  return new Plane(point, plane.normal, id);
}

// ========================================================
// 5. Intersection of 2 Planes -> Line
//    (Giao tuyến của hai mặt phẳng)
// ========================================================

/**
 * Tìm đường thẳng giao tuyến của hai mặt phẳng trong không gian 3D.
 * - Trả về null nếu hai mặt phẳng song song hoặc trùng nhau.
 * - Trả về Line3D với vector chỉ phương u = n1 x n2 và điểm p0 gần gốc toạ độ nhất.
 */
export function createPlaneIntersectionLine(
  plane1: Plane,
  plane2: Plane,
  id?: string,
  tolerance = 1e-8
): Line3D | null {
  const n1 = plane1.normal;
  const n2 = plane2.normal;
  const d1 = plane1.d;
  const d2 = plane2.d;

  const crossN = n1.cross(n2);
  const uMagSq = crossN.magnitudeSquared();

  // Hai mặt phẳng song song hoặc trùng nhau
  if (uMagSq <= tolerance * tolerance) {
    return null;
  }

  // Vector chỉ phương chuẩn hóa của giao tuyến
  const u = crossN.normalize();

  // Điểm P0 trên giao tuyến gần gốc toạ độ nhất:
  // P0 = ((-d1*n2 + d2*n1) x crossN) / ||crossN||^2
  const term = n2.scale(-d1).add(n1.scale(d2));
  const p0Vec = term.cross(crossN).scale(1 / uMagSq);

  const p0: Coords3D = { x: p0Vec.x, y: p0Vec.y, z: p0Vec.z };
  return new Line3D(p0, u, id);
}

// ========================================================
// 6. Projection of Point onto Plane
//    (Hình chiếu vuông góc của điểm lên mặt phẳng)
// ========================================================

/**
 * Tìm hình chiếu vuông góc của điểm point lên mặt phẳng plane:
 * H = P - (n . P + d) * n
 */
export function projectPointOntoPlane(
  point: Coords3D,
  plane: Plane,
  id?: string
): Point3D {
  const proj = plane.projectPoint(point);
  return new Point3D(proj.x, proj.y, proj.z, id);
}
