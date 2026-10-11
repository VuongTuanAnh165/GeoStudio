import { describe, it, expect, beforeEach } from 'vitest';
import { CommandEngine } from '../../../../core/commands/CommandEngine';
import { CreateSliderCommand } from '../../../../core/commands/primitives';
import { UpdateSliderValueCommand, LinkObjectToSliderCommand } from '../../../../core/commands/mutations';
import { ConstructionGraph } from '../../../../core/geometry/graph/ConstructionGraph';
import { Circle, Point, Slider } from '../../../../core/geometry/primitives';
import type { GeometryState } from '../../../../core/types/commands';

describe('Slider Commands & ConstructionGraph integration', () => {
  let engine: CommandEngine;

  beforeEach(() => {
    const initialState: GeometryState = {
      document: {
        version: '1.0',
        schemaVersion: 1,
        metadata: { id: 'test', title: 'Test', createdAt: '', updatedAt: '' },
        settings: { theme: 'light', gridVisible: true, axisVisible: true, snapEnabled: true, dimension: 2 },
        viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        objects: [],
        constraints: []
      },
      selection: []
    };
    engine = new CommandEngine(initialState);
  });

  it('should execute and undo CreateSliderCommand', () => {
    const cmd = new CreateSliderCommand('r', 1, 10, 3, 0.5, undefined, undefined, 'slider_r');
    const result = engine.execute(cmd);
    expect(result.valid).toBe(true);

    const sliderObj = engine.currentState.document.objects.find(o => o.id === 'slider_r');
    expect(sliderObj).toBeDefined();
    expect(sliderObj?.type).toBe('slider');
    expect((sliderObj?.definition as any).value).toBe(3);

    // Undo
    engine.undo();
    expect(engine.currentState.document.objects.find(o => o.id === 'slider_r')).toBeUndefined();

    // Redo
    engine.redo();
    expect(engine.currentState.document.objects.find(o => o.id === 'slider_r')).toBeDefined();
  });

  it('should execute and undo UpdateSliderValueCommand', () => {
    const createCmd = new CreateSliderCommand('a', 0, 10, 2, 0.1, undefined, undefined, 's1');
    engine.execute(createCmd);

    const updateCmd = new UpdateSliderValueCommand('s1', 7.5);
    const result = engine.execute(updateCmd);
    expect(result.valid).toBe(true);

    let obj = engine.currentState.document.objects.find(o => o.id === 's1');
    expect((obj?.definition as any).value).toBe(7.5);

    // Undo
    engine.undo();
    obj = engine.currentState.document.objects.find(o => o.id === 's1');
    expect((obj?.definition as any).value).toBe(2);
  });

  it('should link circle to slider and propagate recalculation in ConstructionGraph', () => {
    const slider = new Slider('r', 1, 10, 4, 0.1, undefined, undefined, 'slider1');
    const center = new Point(0, 0, 'center1');
    const circle = new Circle({ x: 0, y: 0 }, 2, 'circle1');
    // Set circle parents: center and slider
    circle.parents = ['center1', 'slider1'];

    const graph = new ConstructionGraph();
    graph.addNode(center);
    graph.addNode(slider);
    graph.addNode(circle);

    // Initially, evaluator should have set circle radius to slider value (4)
    expect((circle.definition as any).radius).toBe(4);

    // Update slider value
    slider.setValue(8.5);
    // Mark slider dirty in graph
    graph.markDirty('slider1');

    // Circle should automatically be recalculated with new radius = 8.5
    expect((circle.definition as any).radius).toBe(8.5);
  });

  it('should link object to slider via LinkObjectToSliderCommand', () => {
    // Add circle and slider to engine
    const sldCmd = new CreateSliderCommand('s', 1, 5, 3, 0.1, undefined, undefined, 's_id');
    engine.execute(sldCmd);

    const circ = new Circle({ x: 0, y: 0 }, 1, 'c_id');
    circ.parents = ['center_id'];
    engine.currentState.document.objects.push(circ.toJSON());

    const linkCmd = new LinkObjectToSliderCommand('c_id', 's_id', ['center_id']);
    engine.execute(linkCmd);

    const updatedCirc = engine.currentState.document.objects.find(o => o.id === 'c_id');
    expect(updatedCirc?.parents).toEqual(['center_id', 's_id']);

    // Undo
    engine.undo();
    const undoneCirc = engine.currentState.document.objects.find(o => o.id === 'c_id');
    expect(undoneCirc?.parents).toEqual(['center_id']);
  });
});
