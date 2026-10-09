import type { GeometryCommand } from '../types/commands';
import { BatchCommand } from './CommandHistory';
import {
  CreatePointCommand,
  CreateSegmentCommand,
  CreateLineCommand,
  CreateRayCommand,
  CreateCircleCommand,
  CreatePolygonCommand,
  CreateTriangleCommand,
  PasteObjectsCommand
} from './primitives';
import {
  MovePointCommand,
  SetStyleCommand,
  ToggleVisibilityCommand,
  ShowLabelCommand,
  HideLabelCommand
} from './mutations';
import { DeleteObjectCommand } from './deletions';
import type { Coords2D, GeometryObject } from '../types/geometry';

export function createCommandFromJSON(json: Record<string, unknown>): GeometryCommand {
  const type = json.type as string;
  const args = (json.args || {}) as Record<string, unknown>;
  let cmd: GeometryCommand;

  switch (type) {
    case 'BATCH_COMMAND': {
      const subCmds = ((json.commands as Record<string, unknown>[]) || []).map(c => createCommandFromJSON(c));
      cmd = new BatchCommand(args.label as string, subCmds);
      break;
    }

    case 'CREATE_POINT':
      cmd = new CreatePointCommand(args.x as number, args.y as number, args.objectId as string);
      break;
    
    case 'CREATE_SEGMENT':
      cmd = new CreateSegmentCommand(args.p1 as Coords2D, args.p2 as Coords2D, args.objectId as string);
      break;
    
    case 'CREATE_LINE':
      cmd = new CreateLineCommand(args.point as Coords2D, args.direction as Coords2D, args.objectId as string);
      break;

    case 'CREATE_RAY':
      cmd = new CreateRayCommand(args.origin as Coords2D, args.direction as Coords2D, args.objectId as string);
      break;
    
    case 'CREATE_CIRCLE':
      cmd = new CreateCircleCommand(args.center as Coords2D, args.radius as number, args.objectId as string);
      break;

    case 'CREATE_POLYGON':
      cmd = new CreatePolygonCommand(args.points as Coords2D[], args.objectId as string);
      break;

    case 'CREATE_TRIANGLE':
      cmd = new CreateTriangleCommand(args.p1 as Coords2D, args.p2 as Coords2D, args.p3 as Coords2D, args.objectId as string);
      break;
    
    case 'MOVE_POINT':
      cmd = new MovePointCommand((args.objectId || json.objectId) as string, args.newX as number, args.newY as number);
      break;

    case 'SET_STYLE':
      cmd = new SetStyleCommand((args.objectId || json.objectId) as string, args.styleConfig as Record<string, unknown>);
      break;
    
    case 'TOGGLE_VISIBILITY':
      cmd = new ToggleVisibilityCommand((args.objectId || json.objectId) as string);
      break;

    case 'SHOW_LABEL':
      cmd = new ShowLabelCommand((args.objectId || json.objectId) as string, args.label as string | undefined);
      break;

    case 'HIDE_LABEL':
      cmd = new HideLabelCommand((args.objectId || json.objectId) as string);
      break;
    
    case 'DELETE_OBJECT':
      cmd = new DeleteObjectCommand((args.objectId || json.objectId) as string, args.cascade as boolean | undefined);
      break;

    case 'PASTE_OBJECTS':
      cmd = new PasteObjectsCommand(json.objects as GeometryObject[]);
      break;

    default:
      throw new Error(`Unknown command type: ${type}`);
  }

  // Restore core properties
  if (json.id) cmd.id = json.id as string;
  if (json.timestamp) cmd.timestamp = json.timestamp as number;
  if (json.source) cmd.source = json.source as GeometryCommand['source'];
  if (json.undoable !== undefined) cmd.undoable = json.undoable as boolean;

  // Restore mutation-specific previous state
  if (json.previousState !== undefined && 'previousStateMap' in cmd) {
    (cmd as unknown as { previousStateMap: Map<string, unknown> }).previousStateMap.set(json.objectId as string, json.previousState);
  }
  
  if (json.deletedObjects !== undefined && 'deletedObjects' in cmd) {
    (cmd as unknown as { deletedObjects: unknown[] }).deletedObjects = json.deletedObjects as unknown[];
  }

  return cmd;
}
