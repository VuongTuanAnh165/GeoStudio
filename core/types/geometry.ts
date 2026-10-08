export type Coords2D = { x: number; y: number };
export type Coords3D = { x: number; y: number; z: number };
export type Coords = Coords2D | Coords3D;

export type GeometryObjectType =
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'circle'
  | 'arc'
  | 'polygon'
  | 'vector'
  | 'plane'
  | 'solid'
  | string; // allow extension

export interface GeometryObjectDefinition {
  kind: string;
  [key: string]: unknown;
}

export interface GeometryConstraint {
  id: string;
  type: string;
  objectIds: string[];
  parameters?: Record<string, unknown>;
}

export interface GeometryObject {
  id: string;
  type: GeometryObjectType;
  dimension: 2 | 3;
  parents?: string[];
  children?: string[];
  definition: GeometryObjectDefinition;
  constraints?: string[]; // IDs of constraints applied to this object
  style?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ConstructionNode {
  id: string;
  object: GeometryObject;
  parents: string[]; // các node mà node này phụ thuộc
  children: string[]; // các node phụ thuộc node này
  computeOrder: number; // thứ tự tính toán (topological sort)
  isDirty: boolean; // cần tính lại?
  lastComputed: number; // timestamp
}

export const GEOMETRY_TOLERANCE = {
  POINT_COINCIDENCE: 1e-10, // hai điểm trùng nhau
  COLLINEARITY: 1e-8, // ba điểm thẳng hàng
  ANGLE_ZERO: 1e-8, // góc bằng 0
  LENGTH_ZERO: 1e-10, // độ dài bằng 0
  SNAP_DISTANCE: 5, // pixel — khoảng snap
  CONSTRAINT_TOLERANCE: 1e-6, // sai số constraint solver
  MAX_SOLVER_ITERATIONS: 100 // giới hạn vòng lặp solver
};
