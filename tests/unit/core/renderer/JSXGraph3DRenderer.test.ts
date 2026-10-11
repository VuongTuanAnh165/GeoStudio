import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSXGraph3DRenderer } from '../../../../core/renderer/JSXGraph3DRenderer';
import { Point3D, Line3D, Segment3D, Plane } from '../../../../core/geometry/primitives/3d';
import { Cube, Sphere, Cylinder, Cone } from '../../../../core/geometry/3d/Solids';
import { Point, Segment, Line, Ray, Circle, Polygon, Vector } from '../../../../core/geometry/primitives/2d';

// Mock JSXGraph following the project's testing pattern in JSXGraphRenderer.test.ts
vi.mock('jsxgraph', () => {
  const mockView3D = {
    create: vi.fn().mockImplementation((type, coords, attrs) => ({
      elType: type,
      setAttribute: vi.fn(),
      coords,
      attrs
    })),
    az_slide: { Value: 0.8 },
    el_slide: { Value: 0.55 }
  };

  return {
    default: {
      OBJECT_TYPE_POLYGON: 3,
      JSXGraph: {
        initBoard: vi.fn().mockReturnValue({
          create: vi.fn().mockImplementation((type) => {
            if (type === 'view3d') return mockView3D;
            return {
              elType: type,
              setAttribute: vi.fn()
            };
          }),
          removeObject: vi.fn(),
          update: vi.fn(),
          zoomIn: vi.fn(),
          zoomOut: vi.fn()
        }),
        freeBoard: vi.fn()
      }
    }
  };
});

describe('JSXGraph3DRenderer', () => {
  let container: HTMLDivElement;
  let renderer: JSXGraph3DRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-jxg-3d';
    document.body.appendChild(container);

    renderer = new JSXGraph3DRenderer();
    renderer.init(container, {
      renderMode: 'solid',
      planeOpacity: 0.4,
      boxSize: 5
    });
  });

  afterEach(() => {
    renderer.destroy();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('initializes board and view3d successfully', () => {
    expect(renderer.board).not.toBeNull();
    expect(renderer.view).not.toBeNull();
    expect(renderer.renderMode).toBe('solid');
    expect(renderer.planeOpacity).toBe(0.4);
  });

  it('controls orbit camera angles, zoom and reset', () => {
    renderer.setCameraAngles(1.2, 0.4);
    expect(renderer.azimuth).toBeCloseTo(1.2);
    expect(renderer.elevation).toBeCloseTo(0.4);

    renderer.rotateCamera(0.1, -0.05);
    expect(renderer.azimuth).toBeCloseTo(1.3);
    expect(renderer.elevation).toBeCloseTo(0.35);

    renderer.resetCamera();
    expect(renderer.azimuth).toBeCloseTo(0.8);
    expect(renderer.elevation).toBeCloseTo(0.55);

    // Zoom
    renderer.zoomCamera(1);
    renderer.zoomCamera(-1);
  });

  it('toggles render mode and plane opacity', () => {
    renderer.setRenderMode('wireframe');
    expect(renderer.renderMode).toBe('wireframe');

    renderer.setRenderMode('solid');
    expect(renderer.renderMode).toBe('solid');

    renderer.setPlaneOpacity(0.8);
    expect(renderer.planeOpacity).toBe(0.8);
  });

  it('renders 3D primitives (Point3D, Segment3D, Line3D, Plane)', () => {
    const pt = new Point3D(1, 2, 3, 'pt1');
    renderer.renderObject(pt);

    const seg = new Segment3D({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 }, 'seg1');
    renderer.renderObject(seg);

    const line = new Line3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 'line1');
    renderer.renderObject(line);

    const plane = Plane.fromEquation(0, 0, 1, 0, 'plane1');
    renderer.renderObject(plane);

    renderer.removeObject('pt1');
    renderer.removeObject('seg1');
  });

  it('renders 3D solids (Cube, Sphere, Cylinder, Cone)', () => {
    const cube = new Cube({ x: -1, y: -1, z: -1 }, 2, 'cube1');
    renderer.renderObject(cube);

    const sphere = new Sphere({ x: 0, y: 0, z: 0 }, 2, 'sphere1');
    renderer.renderObject(sphere);

    const cylinder = new Cylinder({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, 1.5, 'cyl1');
    renderer.renderObject(cylinder);

    const cone = new Cone({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, 2, 'cone1');
    renderer.renderObject(cone);

    renderer.removeObject('cube1');
    renderer.clear();
  });

  it('renders and clears cross-section visualization', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2, 'cube_cs');
    const plane = Plane.fromEquation(0, 0, 1, -1, 'plane_cs'); // cuts horizontally at z=1

    const result = renderer.renderCrossSection(cube, plane);
    expect(result).not.toBeNull();
    expect(result!.vertices.length).toBe(4);

    renderer.clearCrossSection();
  });

  it('renders and clears net (hình khai triển)', () => {
    const cube = new Cube({ x: 0, y: 0, z: 0 }, 2, 'cube_net');
    const net = renderer.renderNet(cube, 0);

    expect(net.solidKind).toBe('cube');
    expect(net.faces.length).toBe(6);

    renderer.clearNet();
  });

  it('renders 2D primitives mapped to 3D plane (z=0)', () => {
    const pt2d = new Point(3, 4, 'p2d_1');
    renderer.renderObject(pt2d);

    const seg2d = new Segment({ x: 1, y: 2 }, { x: 5, y: 6 }, 'seg2d_1');
    renderer.renderObject(seg2d);

    const line2d = new Line({ x: 0, y: 0 }, { x: 1, y: 1 }, 'line2d_1');
    renderer.renderObject(line2d);

    const ray2d = new Ray({ x: 0, y: 0 }, { x: 1, y: 0 }, 'ray2d_1');
    renderer.renderObject(ray2d);

    const circle2d = new Circle({ x: 0, y: 0 }, 3, 'circle2d_1');
    renderer.renderObject(circle2d);

    const poly2d = new Polygon([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 2 }], 'poly2d_1');
    renderer.renderObject(poly2d);

    const vec2d = new Vector(3, 4, 'vec2d_1');
    renderer.renderObject(vec2d);

    // Verify all rendered elements are registered
    expect(renderer.view.create).toHaveBeenCalled();
  });

  it('resolves and renders constructed 2D objects from objectsMap', () => {
    const map = new Map<string, any>();
    map.set('p_a', {
      id: 'p_a',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: { x: 0, y: 0 } }
    });
    map.set('p_b', {
      id: 'p_b',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: { x: 4, y: 4 } }
    });

    const midObj: any = {
      id: 'p_mid',
      type: 'point',
      dimension: 2,
      parents: ['p_a', 'p_b'],
      definition: { kind: 'midpoint' }
    };
    renderer.renderObject(midObj, map);

    const segObj: any = {
      id: 'seg_ab',
      type: 'segment',
      dimension: 2,
      parents: ['p_a', 'p_b'],
      definition: { kind: 'segment' }
    };
    renderer.renderObject(segObj, map);

    expect(renderer.view.create).toHaveBeenCalled();
  });

  it('animates camera smoothly with duration', () => {
    const onComplete = vi.fn();
    renderer.animateCamera(0, 1.5, 0, onComplete);

    expect(renderer.azimuth).toBeCloseTo(0);
    expect(renderer.elevation).toBeCloseTo(1.5);
    expect(onComplete).toHaveBeenCalled();
  });

  it('batch renders multiple objects via renderObjects', () => {
    const p1 = new Point(1, 1, 'bp1');
    const p2 = new Point(2, 2, 'bp2');
    renderer.renderObjects([p1.toJSON(), p2.toJSON()]);

    expect(renderer.view.create).toHaveBeenCalled();
  });
});
