import type { Coords3D } from '../../types/geometry';
import { Vector3D, Plane } from '../primitives/3d';
import { PolyhedronSolid, polygonArea3D } from './Solids';

export interface CrossSectionResult {
  vertices: Coords3D[];
  area: number;
  planeEquation: { a: number; b: number; c: number; d: number };
}

/**
 * Tính thiết diện giữa một khối đa diện (PolyhedronSolid) và một mặt phẳng (Plane).
 * Thuật toán:
 * 1. Tìm giao điểm của tất cả các cạnh khối đa diện với mặt phẳng.
 * 2. Loại bỏ các giao điểm trùng lặp.
 * 3. Nếu số điểm >= 3, sắp xếp các điểm theo góc cực quanh trọng tâm trên mặt phẳng thiết diện.
 * 4. Tính diện tích đa giác thiết diện.
 */
export function computeCrossSection(solid: PolyhedronSolid, plane: Plane, tolerance = 1e-6): CrossSectionResult | null {
  const vertices = solid.vertices;
  const edges = solid.edges;
  if (!vertices || vertices.length < 4 || !edges || edges.length < 4) {
    return null;
  }

  const normal = plane.normal;
  const d = plane.d;

  const intersectionPoints: Coords3D[] = [];

  for (const [i1, i2] of edges) {
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    if (!v1 || !v2) continue;

    const p1 = v1.coords;
    const p2 = v2.coords;

    // Khoảng cách có dấu từ 2 đỉnh tới mặt phẳng
    const dist1 = normal.x * p1.x + normal.y * p1.y + normal.z * p1.z + d;
    const dist2 = normal.x * p2.x + normal.y * p2.y + normal.z * p2.z + d;

    // Kiểm tra nếu một đỉnh nằm ngay trên mặt phẳng
    if (Math.abs(dist1) <= tolerance) {
      addUniquePoint(intersectionPoints, p1, tolerance);
    }
    if (Math.abs(dist2) <= tolerance) {
      addUniquePoint(intersectionPoints, p2, tolerance);
    }

    // Nếu 2 đỉnh nằm ở 2 phía của mặt phẳng -> cạnh cắt mặt phẳng
    if (dist1 * dist2 < -tolerance * tolerance) {
      const t = -dist1 / (dist2 - dist1);
      if (t >= -tolerance && t <= 1 + tolerance) {
        const pIntersect: Coords3D = {
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y),
          z: p1.z + t * (p2.z - p1.z)
        };
        addUniquePoint(intersectionPoints, pIntersect, tolerance);
      }
    }
  }

  if (intersectionPoints.length < 3) {
    return null; // Không đủ 3 điểm để tạo thành thiết diện đa giác
  }

  // Sắp xếp các điểm giao thành đa giác lồi khép kín quanh trọng tâm
  const sortedVertices = sortPolygonPoints3D(intersectionPoints, normal);
  const area = polygonArea3D(sortedVertices);

  return {
    vertices: sortedVertices,
    area,
    planeEquation: plane.equation
  };
}

/**
 * Thêm điểm vào danh sách nếu chưa tồn tại trong khoảng dung sai
 */
function addUniquePoint(list: Coords3D[], pt: Coords3D, tolerance: number): void {
  for (const item of list) {
    const dx = item.x - pt.x;
    const dy = item.y - pt.y;
    const dz = item.z - pt.z;
    if (Math.hypot(dx, dy, dz) <= tolerance) {
      return;
    }
  }
  list.push(pt);
}

/**
 * Sắp xếp các điểm 3D đồng phẳng theo góc cực quanh trọng tâm
 */
function sortPolygonPoints3D(points: Coords3D[], planeNormal: Vector3D): Coords3D[] {
  const n = points.length;
  if (n <= 3) return [...points];

  // Trọng tâm
  let cx = 0, cy = 0, cz = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
    cz += p.z;
  }
  const center: Coords3D = { x: cx / n, y: cy / n, z: cz / n };

  // Xây dựng hệ toạ độ cơ sở trực chuẩn (u, v) trên mặt phẳng cắt
  let refVec = new Vector3D(0, 0, 1);
  if (Math.abs(planeNormal.dot(refVec)) > 0.9) {
    refVec = new Vector3D(1, 0, 0);
  }
  const u = planeNormal.cross(refVec).normalize();
  const v = planeNormal.cross(u).normalize();

  // Tính góc cực và sắp xếp
  const withAngles = points.map(p => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    const dz = p.z - center.z;
    const projX = dx * u.x + dy * u.y + dz * u.z;
    const projY = dx * v.x + dy * v.y + dz * v.z;
    const angle = Math.atan2(projY, projX);
    return { p, angle };
  });

  withAngles.sort((a, b) => a.angle - b.angle);
  return withAngles.map(item => item.p);
}
