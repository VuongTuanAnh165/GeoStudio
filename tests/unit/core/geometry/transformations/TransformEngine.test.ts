import { describe, it, expect } from 'vitest';
import { TransformEngine } from '../../../../../core/geometry/transformations/TransformEngine';
import { ConstructionGraph } from '../../../../../core/geometry/graph/ConstructionGraph';
import { Point, Segment, Circle, Polygon, Slider } from '../../../../../core/geometry/primitives/2d';
import type { GeometryObject } from '../../../../../core/types/geometry';
import { CreateConstructionCommand } from '../../../../../core/commands/constructions';
import { CommandEngine } from '../../../../../core/commands/CommandEngine';
import type { GeometryState } from '../../../../../core/types/commands';

describe('TransformEngine - Pure Math Functions', () => {
  it('translates points correctly', () => {
    const p = { x: 2, y: 3 };
    const v = { x: -1, y: 4 };
    const res = TransformEngine.translatePoint(p, v);
    expect(res.x).toBeCloseTo(1);
    expect(res.y).toBeCloseTo(7);
  });

  it('rotates points around origin and arbitrary center', () => {
    const origin = { x: 0, y: 0 };
    const p = { x: 1, y: 0 };
    // Rotate 90 degrees (PI / 2)
    const r1 = TransformEngine.rotatePoint(p, origin, Math.PI / 2);
    expect(r1.x).toBeCloseTo(0);
    expect(r1.y).toBeCloseTo(1);

    // Rotate 180 degrees around (1, 1)
    const center = { x: 1, y: 1 };
    const p2 = { x: 3, y: 1 };
    const r2 = TransformEngine.rotatePoint(p2, center, Math.PI);
    expect(r2.x).toBeCloseTo(-1);
    expect(r2.y).toBeCloseTo(1);
  });

  it('reflects points across horizontal, vertical, and diagonal lines', () => {
    // Horizontal line: y = 2 -> (0, 2) to (5, 2)
    const h1 = { x: 0, y: 2 };
    const h2 = { x: 5, y: 2 };
    const p = { x: 3, y: 5 };
    const resH = TransformEngine.reflectPointAcrossLine(p, h1, h2);
    expect(resH.x).toBeCloseTo(3);
    expect(resH.y).toBeCloseTo(-1);

    // Diagonal line: y = x -> (0, 0) to (1, 1)
    const d1 = { x: 0, y: 0 };
    const d2 = { x: 1, y: 1 };
    const pDiag = { x: 4, y: 1 };
    const resD = TransformEngine.reflectPointAcrossLine(pDiag, d1, d2);
    expect(resD.x).toBeCloseTo(1);
    expect(resD.y).toBeCloseTo(4);
  });

  it('reflects points across a central point', () => {
    const center = { x: 2, y: 2 };
    const p = { x: 3, y: 4 };
    const res = TransformEngine.reflectPointAcrossPoint(p, center);
    expect(res.x).toBeCloseTo(1);
    expect(res.y).toBeCloseTo(0);
  });

  it('applies homothety (dilation) from center with positive and negative ratio', () => {
    const center = { x: 1, y: 1 };
    const p = { x: 3, y: 2 };

    // Ratio 2: (p - c)*2 + c = (2, 1)*2 + (1, 1) = (5, 3)
    const res2 = TransformEngine.homothetyPoint(p, center, 2);
    expect(res2.x).toBeCloseTo(5);
    expect(res2.y).toBeCloseTo(3);

    // Ratio -1: (p - c)*(-1) + c = (-2, -1) + (1, 1) = (-1, 0)
    const resNeg = TransformEngine.homothetyPoint(p, center, -1);
    expect(resNeg.x).toBeCloseTo(-1);
    expect(resNeg.y).toBeCloseTo(0);
  });
});

describe('TransformEngine - Definition Transformations', () => {
  it('transforms segment definitions', () => {
    const segDef = {
      kind: 'segment',
      p1: { x: 0, y: 0 },
      p2: { x: 4, y: 0 }
    };
    const translated = TransformEngine.transformDefinition('segment', segDef, p => ({ x: p.x + 2, y: p.y + 3 }));
    expect(translated.p1).toEqual({ x: 2, y: 3 });
    expect(translated.p2).toEqual({ x: 6, y: 3 });
  });

  it('transforms circle definitions and scales radius on homothety', () => {
    const circleDef = {
      kind: 'circle',
      center: { x: 0, y: 0 },
      radius: 5
    };

    // Translation preserves radius
    const translated = TransformEngine.transformDefinition('circle', circleDef, p => ({ x: p.x + 1, y: p.y + 1 }), 1);
    expect(translated.center).toEqual({ x: 1, y: 1 });
    expect(translated.radius).toBe(5);

    // Homothety with ratio 2.5 scales radius
    const scaled = TransformEngine.transformDefinition('circle', circleDef, p => ({ x: p.x * 2.5, y: p.y * 2.5 }), 2.5);
    expect(scaled.radius).toBe(12.5);
  });

  it('transforms polygon definitions', () => {
    const polyDef = {
      kind: 'polygon',
      points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 }]
    };
    const translated = TransformEngine.transformDefinition('polygon', polyDef, p => ({ x: p.x + 1, y: p.y - 1 }));
    expect(translated.points).toEqual([
      { x: 1, y: -1 },
      { x: 4, y: -1 },
      { x: 1, y: 3 }
    ]);
  });
});

describe('ConstructionGraph - Dynamic Image Objects Evaluation', () => {
  it('dynamically translates a point when parent point or vector changes', () => {
    const graph = new ConstructionGraph();

    const pA = new Point(1, 2, 'pt_A');
    const pVecStart = new Point(0, 0, 'pt_V1');
    const pVecEnd = new Point(3, 4, 'pt_V2');

    graph.addNode(pA);
    graph.addNode(pVecStart);
    graph.addNode(pVecEnd);

    // Image point A' defined by translating A along V1->V2
    const pAImg: GeometryObject = {
      id: 'pt_A_prime',
      type: 'point',
      dimension: 2,
      parents: ['pt_A', 'pt_V1', 'pt_V2'],
      children: [],
      definition: {
        kind: 'transform',
        transformType: 'translation',
        sourceId: 'pt_A'
      }
    };
    graph.addNode(pAImg);

    // Evaluate
    graph.recomputeDirty();
    const evaluatedCoords = (pAImg.definition as any).coords;
    expect(evaluatedCoords.x).toBeCloseTo(4); // 1 + 3
    expect(evaluatedCoords.y).toBeCloseTo(6); // 2 + 4

    // Now modify parent vector endpoint V2 from (3, 4) to (5, 1)
    pVecEnd.x = 5;
    pVecEnd.y = 1;
    graph.markDirty('pt_V2');
    graph.recomputeDirty();

    const updatedCoords = (pAImg.definition as any).coords;
    expect(updatedCoords.x).toBeCloseTo(6); // 1 + 5
    expect(updatedCoords.y).toBeCloseTo(3); // 2 + 1
  });

  it('dynamically rotates a point around center point when center moves', () => {
    const graph = new ConstructionGraph();

    const pA = new Point(2, 0, 'pt_A');
    const center = new Point(0, 0, 'pt_O');

    graph.addNode(pA);
    graph.addNode(center);

    const pRot: GeometryObject = {
      id: 'pt_A_rot',
      type: 'point',
      dimension: 2,
      parents: ['pt_A', 'pt_O'],
      children: [],
      definition: {
        kind: 'transform',
        transformType: 'rotation',
        sourceId: 'pt_A',
        angle: Math.PI / 2
      }
    };
    graph.addNode(pRot);

    graph.recomputeDirty();
    expect((pRot.definition as any).coords.x).toBeCloseTo(0);
    expect((pRot.definition as any).coords.y).toBeCloseTo(2);

    // Move source point to (0, 3)
    pA.x = 0;
    pA.y = 3;
    graph.markDirty('pt_A');
    graph.recomputeDirty();

    // Rotated 90 deg from (0, 3) around (0,0) is (-3, 0)
    expect((pRot.definition as any).coords.x).toBeCloseTo(-3);
    expect((pRot.definition as any).coords.y).toBeCloseTo(0);
  });

  it('dynamically updates rotation angle bound to a slider', () => {
    const graph = new ConstructionGraph();

    const pA = new Point(2, 0, 'pt_A');
    const center = new Point(0, 0, 'pt_O');
    const slider = new Slider('ang', 0, 360, 90, 1, { x: -5, y: 5 }, { x: -2, y: 5 }, 'slider_1');

    graph.addNode(pA);
    graph.addNode(center);
    graph.addNode(slider);

    const pRot: GeometryObject = {
      id: 'pt_A_rot',
      type: 'point',
      dimension: 2,
      parents: ['pt_A', 'pt_O', 'slider_1'],
      children: [],
      definition: {
        kind: 'transform',
        transformType: 'rotation',
        sourceId: 'pt_A',
        angleUnit: 'deg'
      }
    };
    graph.addNode(pRot);

    graph.recomputeDirty();
    // 90 degrees rotation
    expect((pRot.definition as any).coords.x).toBeCloseTo(0);
    expect((pRot.definition as any).coords.y).toBeCloseTo(2);

    // Slider moves to 180 degrees
    slider.setValue(180);
    graph.markDirty('slider_1');
    graph.recomputeDirty();

    // 180 degrees rotation of (2, 0) around (0, 0) is (-2, 0)
    expect((pRot.definition as any).coords.x).toBeCloseTo(-2);
    expect((pRot.definition as any).coords.y).toBeCloseTo(0);
  });

  it('dynamically reflects a circle across a line when mirror line moves', () => {
    const graph = new ConstructionGraph();

    const circ = new Circle({ x: 2, y: 5 }, 3, 'circ_1');
    const lineP1 = new Point(0, 0, 'line_p1');
    const lineP2 = new Point(10, 0, 'line_p2');
    const mirrorSeg = new Segment({ x: 0, y: 0 }, { x: 10, y: 0 }, 'mirror_seg');
    mirrorSeg.parents = ['line_p1', 'line_p2'];

    graph.addNode(circ);
    graph.addNode(lineP1);
    graph.addNode(lineP2);
    graph.addNode(mirrorSeg);

    const reflectedCirc: GeometryObject = {
      id: 'circ_reflected',
      type: 'circle',
      dimension: 2,
      parents: ['circ_1', 'mirror_seg'],
      children: [],
      definition: {
        kind: 'transform',
        transformType: 'reflection',
        sourceId: 'circ_1'
      }
    };
    graph.addNode(reflectedCirc);

    graph.recomputeDirty();
    // Across x-axis (y = 0): center (2, 5) -> (2, -5), radius 3 preserved
    expect((reflectedCirc.definition as any).center.x).toBeCloseTo(2);
    expect((reflectedCirc.definition as any).center.y).toBeCloseTo(-5);
    expect((reflectedCirc.definition as any).radius).toBeCloseTo(3);

    // Move mirror line to y = 2
    lineP1.y = 2;
    lineP2.y = 2;
    mirrorSeg.p1.y = 2;
    mirrorSeg.p2.y = 2;
    graph.markDirty('line_p1');
    graph.markDirty('line_p2');
    graph.markDirty('mirror_seg');
    graph.recomputeDirty();

    // Across y = 2: center (2, 5) -> (2, -1)
    expect((reflectedCirc.definition as any).center.x).toBeCloseTo(2);
    expect((reflectedCirc.definition as any).center.y).toBeCloseTo(-1);
    expect((reflectedCirc.definition as any).radius).toBeCloseTo(3);
  });

  it('dynamically scales a polygon with homothety bound to a slider', () => {
    const graph = new ConstructionGraph();

    const poly = new Polygon([
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 3 }
    ], 'poly_1');
    const center = new Point(0, 0, 'center_O');
    const slider = new Slider('k', 0.5, 5, 2, 0.5, { x: -5, y: 5 }, { x: -2, y: 5 }, 'slider_k');

    graph.addNode(poly);
    graph.addNode(center);
    graph.addNode(slider);

    const polyScaled: GeometryObject = {
      id: 'poly_scaled',
      type: 'polygon',
      dimension: 2,
      parents: ['poly_1', 'center_O', 'slider_k'],
      children: [],
      definition: {
        kind: 'transform',
        transformType: 'homothety',
        sourceId: 'poly_1'
      }
    };
    graph.addNode(polyScaled);

    graph.recomputeDirty();
    const pts2 = (polyScaled.definition as any).points as Array<{ x: number; y: number }>;
    expect(pts2[0]?.x).toBeCloseTo(2);
    expect(pts2[0]?.y).toBeCloseTo(2);
    expect(pts2[1]?.x).toBeCloseTo(6);
    expect(pts2[1]?.y).toBeCloseTo(2);
    expect(pts2[2]?.x).toBeCloseTo(4);
    expect(pts2[2]?.y).toBeCloseTo(6);

    // Adjust slider k from 2 to 3
    slider.setValue(3);
    graph.markDirty('slider_k');
    graph.recomputeDirty();

    const pts3 = (polyScaled.definition as any).points as Array<{ x: number; y: number }>;
    expect(pts3[0]?.x).toBeCloseTo(3);
    expect(pts3[0]?.y).toBeCloseTo(3);
    expect(pts3[1]?.x).toBeCloseTo(9);
    expect(pts3[1]?.y).toBeCloseTo(3);
    expect(pts3[2]?.x).toBeCloseTo(6);
    expect(pts3[2]?.y).toBeCloseTo(9);
  });
});

describe('CreateConstructionCommand for Transformations - Undo / Redo', () => {
  it('executes, generates prime label A prime, undos and redos correctly', () => {
    const initialState: GeometryState = {
      document: {
        version: '1.0',
        schemaVersion: 1,
        metadata: {
          id: 'test-doc',
          title: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        settings: {
          gridVisible: true,
          axisVisible: true,
          snapEnabled: true,
          dimension: 2,
          theme: 'light',
          animation: {
            enabled: true,
            duration: 300,
            easing: 'easeInOut',
            constructionFadeIn: true,
            transformTransition: true,
            deleteFadeOut: true
          }
        },
        viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        objects: [
          {
            id: 'pt_A',
            type: 'point',
            dimension: 2,
            definition: { kind: 'point', coords: { x: 2, y: 3 } },
            metadata: { label: 'A' }
          },
          {
            id: 'pt_B',
            type: 'point',
            dimension: 2,
            definition: { kind: 'point', coords: { x: 0, y: 0 } },
            metadata: { label: 'B' }
          }
        ],
        constraints: []
      },
      selection: []
    };

    const cmdEngine = new CommandEngine(initialState);
    const cmd = new CreateConstructionCommand('point', 'transform', ['pt_A', 'pt_B'], 'pt_A_prime', {
      transformType: 'rotation',
      angle: Math.PI / 2,
      sourceId: 'pt_A'
    });

    const execRes = cmdEngine.execute(cmd);
    expect(execRes.valid).toBe(true);

    const docObjs = cmdEngine.currentState.document.objects;
    const imgObj = docObjs.find(o => o.id === 'pt_A_prime');
    expect(imgObj).toBeDefined();
    expect(imgObj?.metadata?.label).toBe("A'");

    // Parent A should have pt_A_prime in children
    const parentA = docObjs.find(o => o.id === 'pt_A');
    expect(parentA?.children).toContain('pt_A_prime');

    // Undo
    const undoRes = cmdEngine.undo();
    expect(undoRes).toBe(true);
    expect(cmdEngine.currentState.document.objects.find(o => o.id === 'pt_A_prime')).toBeUndefined();
    expect(cmdEngine.currentState.document.objects.find(o => o.id === 'pt_A')?.children).not.toContain('pt_A_prime');

    // Redo
    const redoRes = cmdEngine.redo();
    expect(redoRes).toBe(true);
    expect(cmdEngine.currentState.document.objects.find(o => o.id === 'pt_A_prime')).toBeDefined();
  });
});
