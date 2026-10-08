import type { GeometryObject } from '../../types/geometry';
import type { GeometryCommand, GeometryState } from '../../types/commands';

export interface ConstructionDefinition {
  id: string; // e.g. 'midpoint', 'perpendicular'
  name: string;
  icon: string;
  description: string;
  
  /**
   * Evaluates whether this construction can be performed on the given set of selected objects.
   * e.g., Midpoint requires exactly 1 Segment or exactly 2 Points.
   */
  match: (objects: GeometryObject[]) => boolean;
  
  /**
   * Generates the command to create the geometry object(s) resulting from this construction.
   * generateId is a helper to get unique IDs if needed.
   */
  createCommand: (objects: GeometryObject[], generateId: (prefix: string) => string) => GeometryCommand;
}

export class ConstructionRegistry {
  private static instance: ConstructionRegistry;
  private constructions: Map<string, ConstructionDefinition> = new Map();

  private constructor() {}

  public static getInstance(): ConstructionRegistry {
    if (!ConstructionRegistry.instance) {
      ConstructionRegistry.instance = new ConstructionRegistry();
    }
    return ConstructionRegistry.instance;
  }

  public register(definition: ConstructionDefinition): void {
    if (this.constructions.has(definition.id)) {
      console.warn(`Construction with ID ${definition.id} is already registered.`);
      return;
    }
    this.constructions.set(definition.id, definition);
  }

  public getConstruction(id: string): ConstructionDefinition | undefined {
    return this.constructions.get(id);
  }

  public getAvailable(selectedObjects: GeometryObject[]): ConstructionDefinition[] {
    const available: ConstructionDefinition[] = [];
    for (const construction of this.constructions.values()) {
      if (construction.match(selectedObjects)) {
        available.push(construction);
      }
    }
    return available;
  }
  
  public getAll(): ConstructionDefinition[] {
    return Array.from(this.constructions.values());
  }
}
