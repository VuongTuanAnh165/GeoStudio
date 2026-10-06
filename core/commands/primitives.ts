import type { GeometryCommand, GeometryState, ValidationResult } from '../types/commands';
import type { GeometryObject, Coords2D } from '../types/geometry';
import { Point, Segment, Line, Ray, Circle, Polygon } from '../geometry/primitives/2d';

export abstract class BaseCreateCommand implements GeometryCommand {
  id: string;
  type = 'CREATE_PRIMITIVE';
  args: Record<string, unknown> = {};
  timestamp: number;
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script' = 'mouse';
  undoable = true;

  protected createdObjectId: string | null = null;

  constructor() {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
  }

  abstract createPrimitive(): GeometryObject;

  execute(state: GeometryState): GeometryState {
    const primitive = this.createPrimitive();
    this.createdObjectId = primitive.id;
    
    // Immutable update
    return {
      ...state,
      document: {
        ...state.document,
        objects: [...state.document.objects, primitive]
      },
      selection: [primitive.id] // optionally select the newly created object
    };
  }

  undo(state: GeometryState): GeometryState {
    if (!this.createdObjectId) return state;

    return {
      ...state,
      document: {
        ...state.document,
        objects: state.document.objects.filter(obj => obj.id !== this.createdObjectId)
      },
      selection: state.selection.filter(id => id !== this.createdObjectId)
    };
  }

  validate(_state: GeometryState): ValidationResult {
    // Basic validation: Check if we are creating something valid. Specific commands can override.
    return { valid: true };
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      args: this.args,
      timestamp: this.timestamp,
      source: this.source,
      undoable: this.undoable,
      createdObjectId: this.createdObjectId
    };
  }
}

export class CreatePointCommand extends BaseCreateCommand {
  override type = 'CREATE_POINT';
  
  constructor(public x: number, public y: number, public objectId?: string) {
    super();
    this.args = { x, y, objectId };
  }

  override createPrimitive(): GeometryObject {
    const point = new Point(this.x, this.y, this.objectId);
    return point.toJSON();
  }
}

export class CreateSegmentCommand extends BaseCreateCommand {
  override type = 'CREATE_SEGMENT';
  
  constructor(public p1: Coords2D, public p2: Coords2D, public objectId?: string) {
    super();
    this.args = { p1, p2, objectId };
  }

  override createPrimitive(): GeometryObject {
    const segment = new Segment(this.p1, this.p2, this.objectId);
    return segment.toJSON();
  }
}

export class CreateLineCommand extends BaseCreateCommand {
  override type = 'CREATE_LINE';
  
  constructor(public point: Coords2D, public direction: Coords2D, public objectId?: string) {
    super();
    this.args = { point, direction, objectId };
  }

  override createPrimitive(): GeometryObject {
    const line = new Line(this.point, this.direction, this.objectId);
    return line.toJSON();
  }
}

export class CreateRayCommand extends BaseCreateCommand {
  override type = 'CREATE_RAY';
  
  constructor(public origin: Coords2D, public direction: Coords2D, public objectId?: string) {
    super();
    this.args = { origin, direction, objectId };
  }

  override createPrimitive(): GeometryObject {
    const ray = new Ray(this.origin, this.direction, this.objectId);
    return ray.toJSON();
  }
}

export class CreateCircleCommand extends BaseCreateCommand {
  override type = 'CREATE_CIRCLE';
  
  constructor(public center: Coords2D, public radius: number, public objectId?: string) {
    super();
    this.args = { center, radius, objectId };
  }

  override createPrimitive(): GeometryObject {
    const circle = new Circle(this.center, this.radius, this.objectId);
    return circle.toJSON();
  }
}

export class CreatePolygonCommand extends BaseCreateCommand {
  override type = 'CREATE_POLYGON';
  
  constructor(public points: Coords2D[], public objectId?: string) {
    super();
    this.args = { points, objectId };
  }

  override createPrimitive(): GeometryObject {
    const polygon = new Polygon(this.points, this.objectId);
    return polygon.toJSON();
  }

  override validate(state: GeometryState): ValidationResult {
    if (this.points.length < 3) {
      return { valid: false, error: 'Polygon must have at least 3 points' };
    }
    return super.validate(state);
  }
}

export class CreateTriangleCommand extends BaseCreateCommand {
  override type = 'CREATE_TRIANGLE';
  
  constructor(public p1: Coords2D, public p2: Coords2D, public p3: Coords2D, public objectId?: string) {
    super();
    this.args = { p1, p2, p3, objectId };
  }

  override createPrimitive(): GeometryObject {
    const polygon = new Polygon([this.p1, this.p2, this.p3], this.objectId);
    return polygon.toJSON();
  }
}

