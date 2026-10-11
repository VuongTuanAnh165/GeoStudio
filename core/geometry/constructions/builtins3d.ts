import { ConstructionRegistry } from './ConstructionRegistry';
import { CreateConstructionCommand } from '../../commands/constructions';
import type { GeometryObject } from '../../types/geometry';

export const registerBuiltin3DConstructions = () => {
  const registry = ConstructionRegistry.getInstance();

  // 1. Section plane (Mặt cắt qua 3 điểm hoặc 1 điểm + 1 pháp tuyến)
  registry.register({
    id: 'section_plane',
    name: 'Section Plane',
    icon: 'lucide:box-select',
    description: 'Select three 3D points, or one point and one plane/vector',
    match: (objects: GeometryObject[]) => {
      // 3 điểm
      if (objects.length === 3 && objects.every(o => o.type === 'point' || o.type === 'point3d')) {
        return true;
      }
      // 1 điểm + 1 mặt phẳng / vector
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point' || o.type === 'point3d');
        const hasPlaneOrVec = objects.some(o => o.type === 'plane' || o.type === 'vector' || o.type === 'vector3d');
        return hasPoint && hasPlaneOrVec;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const parentIds = objects.map(o => o.id);
      return new CreateConstructionCommand('plane', 'section_plane', parentIds, generateId('plane'), {
        dimension: 3
      });
    }
  });

  // 2. Cross section (Thiết diện đa diện với mặt phẳng)
  registry.register({
    id: 'cross_section',
    name: 'Cross Section',
    icon: 'lucide:scissors',
    description: 'Select one 3D solid and one cutting plane',
    match: (objects: GeometryObject[]) => {
      if (objects.length === 2) {
        const hasSolid = objects.some(o => o.type === 'solid');
        const hasPlane = objects.some(o => o.type === 'plane');
        return hasSolid && hasPlane;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const solidObj = objects.find(o => o.type === 'solid')!;
      const planeObj = objects.find(o => o.type === 'plane')!;
      return new CreateConstructionCommand('polygon', 'cross_section', [solidObj.id, planeObj.id], generateId('poly'), {
        dimension: 3,
        solidId: solidObj.id,
        planeId: planeObj.id
      });
    }
  });

  // 3. Perpendicular from point to plane
  registry.register({
    id: 'perpendicular_point_plane',
    name: 'Perpendicular Point to Plane',
    icon: 'lucide:ruler',
    description: 'Select one point and one plane to construct perpendicular line',
    match: (objects: GeometryObject[]) => {
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point' || o.type === 'point3d');
        const hasPlane = objects.some(o => o.type === 'plane');
        return hasPoint && hasPlane;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const pointObj = objects.find(o => o.type === 'point' || o.type === 'point3d')!;
      const planeObj = objects.find(o => o.type === 'plane')!;
      return new CreateConstructionCommand('line', 'perpendicular_point_plane', [pointObj.id, planeObj.id], generateId('line'), {
        dimension: 3,
        pointId: pointObj.id,
        planeId: planeObj.id
      });
    }
  });

  // 4. Parallel plane through point
  registry.register({
    id: 'parallel_plane_point',
    name: 'Parallel Plane Through Point',
    icon: 'lucide:equal',
    description: 'Select one point and one plane to construct parallel plane',
    match: (objects: GeometryObject[]) => {
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point' || o.type === 'point3d');
        const hasPlane = objects.some(o => o.type === 'plane');
        return hasPoint && hasPlane;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const pointObj = objects.find(o => o.type === 'point' || o.type === 'point3d')!;
      const planeObj = objects.find(o => o.type === 'plane')!;
      return new CreateConstructionCommand('plane', 'parallel_plane_point', [pointObj.id, planeObj.id], generateId('plane'), {
        dimension: 3,
        pointId: pointObj.id,
        planeId: planeObj.id
      });
    }
  });

  // 5. Intersection of 2 planes -> line
  registry.register({
    id: 'intersection_planes',
    name: 'Intersection of Two Planes',
    icon: 'lucide:shrink',
    description: 'Select two planes to find their intersection line',
    match: (objects: GeometryObject[]) => {
      return objects.length === 2 && objects.every(o => o.type === 'plane');
    },
    createCommand: (objects, generateId) => {
      const parentIds = objects.map(o => o.id);
      return new CreateConstructionCommand('line', 'intersection_planes', parentIds, generateId('line'), {
        dimension: 3
      });
    }
  });

  // 6. Projection of point onto plane
  registry.register({
    id: 'project_point_plane',
    name: 'Project Point Onto Plane',
    icon: 'lucide:disc',
    description: 'Select one point and one plane to construct projected point',
    match: (objects: GeometryObject[]) => {
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point' || o.type === 'point3d');
        const hasPlane = objects.some(o => o.type === 'plane');
        return hasPoint && hasPlane;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const pointObj = objects.find(o => o.type === 'point' || o.type === 'point3d')!;
      const planeObj = objects.find(o => o.type === 'plane')!;
      return new CreateConstructionCommand('point', 'project_point_plane', [pointObj.id, planeObj.id], generateId('pt'), {
        dimension: 3,
        pointId: pointObj.id,
        planeId: planeObj.id
      });
    }
  });
};
