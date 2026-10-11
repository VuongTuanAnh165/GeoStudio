import type { GeometryCommand, GeometryState, ValidationResult } from '../types/commands';
import type { GeometryObject, Coords2D } from '../types/geometry';
import { Point, Segment, Line, Ray, Circle, Polygon, Slider } from '../geometry/primitives/2d';
import { NameGenerator } from '../geometry/naming/NameGenerator';

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

  abstract createPrimitive(state: GeometryState): GeometryObject;

  execute(state: GeometryState): GeometryState {
    const primitive = this.createPrimitive(state);
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

  override createPrimitive(state: GeometryState): GeometryObject {
    const point = new Point(this.x, this.y, this.objectId);
    const label = NameGenerator.getNextPointName(state);
    point.metadata.label = label;
    point.style.showLabel = true;
    return point.toJSON();
  }
}

export class CreateSegmentCommand extends BaseCreateCommand {
  override type = 'CREATE_SEGMENT';
  
  constructor(public p1: Coords2D, public p2: Coords2D, public objectId?: string) {
    super();
    this.args = { p1, p2, objectId };
  }

  override createPrimitive(state: GeometryState): GeometryObject {
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

  override createPrimitive(state: GeometryState): GeometryObject {
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

  override createPrimitive(state: GeometryState): GeometryObject {
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

  override createPrimitive(state: GeometryState): GeometryObject {
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

  override createPrimitive(state: GeometryState): GeometryObject {
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

export class PasteObjectsCommand implements GeometryCommand {
  id: string;
  type = 'PASTE_OBJECTS';
  args: Record<string, unknown> = {};
  timestamp: number;
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script' = 'keyboard';
  undoable = true;

  constructor(public objects: GeometryObject[]) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.args = { objectCount: objects.length };
  }

  execute(state: GeometryState): GeometryState {
    // Add objects
    return {
      ...state,
      document: {
        ...state.document,
        objects: [...state.document.objects, ...this.objects]
      },
      selection: this.objects.map(o => o.id)
    };
  }

  undo(state: GeometryState): GeometryState {
    const idsToRemove = new Set(this.objects.map(o => o.id));
    return {
      ...state,
      document: {
        ...state.document,
        objects: state.document.objects.filter(obj => !idsToRemove.has(obj.id))
      },
      selection: []
    };
  }

  validate(_state: GeometryState): ValidationResult {
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
      objects: this.objects
    };
  }
}

export class CreateSliderCommand extends BaseCreateCommand {
  override type = 'CREATE_SLIDER';

  constructor(
    public name?: string,
    public min: number = 0,
    public max: number = 10,
    public value: number = 5,
    public step: number = 0.1,
    public p1: Coords2D = { x: -8, y: 8 },
    public p2: Coords2D = { x: -3, y: 8 },
    public objectId?: string
  ) {
    super();
    this.args = { name, min, max, value, step, p1, p2, objectId };
  }

  override createPrimitive(state: GeometryState): GeometryObject {
    const sliderName = this.name || NameGenerator.getNextSliderName(state);
    const slider = new Slider(sliderName, this.min, this.max, this.value, this.step, this.p1, this.p2, this.objectId);
    slider.metadata.label = sliderName;
    slider.style.showLabel = true;
    return slider.toJSON();
  }
}

