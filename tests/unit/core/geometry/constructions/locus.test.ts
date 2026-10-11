import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ConstructionRegistry } from '../../../../../core/geometry/constructions/ConstructionRegistry';
import { registerBuiltinConstructions } from '../../../../../core/geometry/constructions/builtins';
import { CreateConstructionCommand } from '../../../../../core/commands/constructions';
import { ConstructionGraph } from '../../../../../core/geometry/graph/ConstructionGraph';
import { CommandEngine } from '../../../../../core/commands/CommandEngine';
import { createCommandFromJSON } from '../../../../../core/commands/factory';
import { JSXGraphRenderer } from '../../../../../core/renderer/JSXGraphRenderer';
import type { GeometryObject } from '../../../../../core/types/geometry';

// Mock JSXGraph
vi.mock('jsxgraph', () => {
  return {
    default: {
      COORDS_BY_USER: 1,
      COORDS_BY_SCREEN: 2,
      Options: { precision: { hasPoint: 4 } },
      JSXGraph: {
        initBoard: vi.fn().mockReturnValue({
          create: vi.fn().mockImplementation((type, _args, attrs) => {
            return {
              id: attrs?.id,
              elType: type,
              hasPoint: vi.fn().mockReturnValue(false),
              setAttribute: vi.fn(),
              setPosition: vi.fn(),
              dataX: [],
              dataY: []
            };
          }),
          removeObject: vi.fn(),
          update: vi.fn(),
          clearTraces: vi.fn()
        }),
        freeBoard: vi.fn()
      }
    }
  };
});

describe('Phase 7 - Task 7.2: Locus (Quỹ tích) & Trace System', () => {
  beforeAll(() => {
    registerBuiltinConstructions();
  });

  describe('1. ConstructionRegistry & Matcher', () => {
    it('should register locus construction definition', () => {
      const registry = ConstructionRegistry.getInstance();
      const def = registry.getConstruction('locus');
      expect(def).toBeDefined();
      expect(def?.id).toBe('locus');
      expect(def?.name).toBe('Locus');
    });

    it('should match moving target point and driver point/glider', () => {
      const registry = ConstructionRegistry.getInstance();
      const locusDef = registry.getConstruction('locus')!;

      const p1: GeometryObject = {
        id: 'p1',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 0, y: 0 } },
        style: {},
        metadata: {}
      };
      const p2: GeometryObject = {
        id: 'p2',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 3, y: 4 } },
        style: {},
        metadata: {}
      };

      expect(locusDef.match([p1, p2])).toBe(true);
      expect(locusDef.match([p1])).toBe(false);
      expect(locusDef.match([p1, p2, p1])).toBe(false);
    });

    it('should match target point and slider', () => {
      const registry = ConstructionRegistry.getInstance();
      const locusDef = registry.getConstruction('locus')!;

      const pt: GeometryObject = {
        id: 'pt',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 1, y: 1 } },
        style: {},
        metadata: {}
      };
      const slider: GeometryObject = {
        id: 's1',
        type: 'slider',
        dimension: 2,
        definition: { kind: 'slider', value: 2, min: 0, max: 10 },
        style: {},
        metadata: {}
      };

      expect(locusDef.match([pt, slider])).toBe(true);
      expect(locusDef.match([slider, pt])).toBe(true);
    });

    it('should create CreateConstructionCommand with correct target and driver order', () => {
      const registry = ConstructionRegistry.getInstance();
      const locusDef = registry.getConstruction('locus')!;

      const pt: GeometryObject = {
        id: 'pt',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 1, y: 1 } },
        style: {},
        metadata: {}
      };
      const slider: GeometryObject = {
        id: 's1',
        type: 'slider',
        dimension: 2,
        definition: { kind: 'slider', value: 2 },
        style: {},
        metadata: {}
      };

      // Even if slider is passed first, command should order target as point and driver as slider
      const cmd = locusDef.createCommand([slider, pt], (p) => `${p}_123`);
      expect(cmd).toBeInstanceOf(CreateConstructionCommand);
      const consCmd = cmd as CreateConstructionCommand;
      expect(consCmd.objectType).toBe('locus');
      expect(consCmd.constructionKind).toBe('locus');
      expect(consCmd.parentIds).toEqual(['pt', 's1']);
      expect(consCmd.extraDef?.targetId).toBe('pt');
      expect(consCmd.extraDef?.driverId).toBe('s1');
    });
  });

  describe('2. Construction Evaluator Sampling', () => {
    it('should sample target coordinates when graph evaluates locus node', () => {
      const graph = new ConstructionGraph();

      const targetPt: GeometryObject = {
        id: 'target',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 0, y: 0 } },
        style: {},
        metadata: {}
      };

      const driverPt: GeometryObject = {
        id: 'driver',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 5, y: 5 } },
        style: {},
        metadata: {}
      };

      const locusObj: GeometryObject = {
        id: 'loc1',
        type: 'locus',
        dimension: 2,
        parents: ['target', 'driver'],
        definition: { kind: 'locus', targetId: 'target', driverId: 'driver', samples: [] },
        style: {},
        metadata: {}
      };

      graph.addNode(targetPt);
      graph.addNode(driverPt);
      graph.addNode(locusObj);

      // Recompute dirty
      graph.recalculate();

      const locDef = locusObj.definition as any;
      expect(locDef.samples).toBeDefined();
      expect(locDef.samples.length).toBe(1);
      expect(locDef.samples[0]).toEqual({ x: 0, y: 0 });

      // Move target point
      (targetPt.definition as any).coords = { x: 2, y: 3 };
      graph.markDirty('target');
      graph.recalculate();

      expect(locDef.samples.length).toBe(2);
      expect(locDef.samples[1]).toEqual({ x: 2, y: 3 });
    });
  });

  describe('3. Command Engine & Serialization', () => {
    it('should execute, undo, and redo CreateConstructionCommand for locus', () => {
      const p1: GeometryObject = {
        id: 'p1',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 0, y: 0 } },
        style: {},
        metadata: {}
      };
      const p2: GeometryObject = {
        id: 'p2',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 5, y: 5 } },
        style: {},
        metadata: {}
      };

      const engine = new CommandEngine({
        document: {
          version: '1.0',
          schemaVersion: 1,
          metadata: { id: 'test', title: 'Test', createdAt: '', updatedAt: '' },
          settings: { theme: 'light', gridVisible: true, axisVisible: true, snapEnabled: true, dimension: 2 },
          viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
          objects: [p1, p2]
        },
        selection: []
      });

      const cmd = new CreateConstructionCommand('locus', 'locus', ['p1', 'p2'], 'locus_1', {
        targetId: 'p1',
        driverId: 'p2'
      });

      const res = engine.execute(cmd);
      expect(res.valid).toBe(true);

      const created = engine.currentState.document.objects.find(o => o.id === 'locus_1');
      expect(created).toBeDefined();
      expect(created?.type).toBe('locus');
      expect(created?.parents).toEqual(['p1', 'p2']);

      // Undo
      expect(engine.undo()).toBe(true);
      expect(engine.currentState.document.objects.find(o => o.id === 'locus_1')).toBeUndefined();

      // Redo
      expect(engine.redo()).toBe(true);
      expect(engine.currentState.document.objects.find(o => o.id === 'locus_1')).toBeDefined();
    });

    it('should deserialize CREATE_CONSTRUCTION command via CommandFactory', () => {
      const serialized = {
        type: 'CREATE_CONSTRUCTION',
        args: {
          objectType: 'locus',
          constructionKind: 'locus',
          parentIds: ['p1', 'p2'],
          objectId: 'locus_abc',
          extraDef: { targetId: 'p1', driverId: 'p2' }
        }
      };

      const cmd = createCommandFromJSON(serialized);
      expect(cmd).toBeInstanceOf(CreateConstructionCommand);
      const consCmd = cmd as CreateConstructionCommand;
      expect(consCmd.objectType).toBe('locus');
      expect(consCmd.parentIds).toEqual(['p1', 'p2']);
    });
  });

  describe('4. Renderer Trace & Locus handling', () => {
    it('should pass trace: true to JSXGraph attributes when obj.style.trace is true', () => {
      const renderer = new JSXGraphRenderer();
      const div = document.createElement('div');
      div.id = 'jxgbox_test';
      document.body.appendChild(div);
      renderer.init('jxgbox_test');

      const tracedPoint: GeometryObject = {
        id: 'tp1',
        type: 'point',
        dimension: 2,
        definition: { kind: 'point', coords: { x: 2, y: 3 } },
        style: { trace: true },
        metadata: {}
      };

      renderer.renderObject(tracedPoint);
      const jxgEl = renderer.getRawObject('tp1');
      expect(jxgEl).toBeDefined();

      renderer.clear();
      document.body.removeChild(div);
    });

    it('should call board.clearTraces when renderer.clearTraces is executed', () => {
      const renderer = new JSXGraphRenderer();
      const div = document.createElement('div');
      div.id = 'jxgbox_test2';
      document.body.appendChild(div);
      renderer.init('jxgbox_test2');

      expect(() => renderer.clearTraces()).not.toThrow();

      renderer.clear();
      document.body.removeChild(div);
    });
  });
});
