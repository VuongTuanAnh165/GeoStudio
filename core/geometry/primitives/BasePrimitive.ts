import type { GeometryObject, GeometryObjectType, GeometryObjectDefinition } from '../../types/geometry';

export abstract class BasePrimitive implements GeometryObject {
  public id: string;
  public abstract type: GeometryObjectType;
  public dimension: 2 | 3 = 2;
  public parents: string[] = [];
  public constraints: unknown[] = [];
  public style: Record<string, unknown> = {};
  public metadata: Record<string, unknown> = {};

  constructor(id?: string) {
    this.id = id ?? crypto.randomUUID();
  }

  abstract get definition(): GeometryObjectDefinition;

  // Chuyển đổi thành plain object để lưu trữ hoặc ném vào Pinia/Redux state
  toJSON(): GeometryObject {
    return {
      id: this.id,
      type: this.type,
      dimension: this.dimension,
      parents: this.parents,
      definition: this.definition,
      constraints: this.constraints,
      style: this.style,
      metadata: this.metadata,
    };
  }

  abstract toString(): string;
}
