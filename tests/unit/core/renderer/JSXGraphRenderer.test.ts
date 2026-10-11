import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSXGraphRenderer } from '../../../../core/renderer/JSXGraphRenderer';
import type { GeometryObject } from '../../../../core/types/geometry';

// Mock JSXGraph
vi.mock('jsxgraph', () => {
  return {
    default: {
      COORDS_BY_USER: 1,
      COORDS_BY_SCREEN: 2,
      Options: {
        precision: {
          hasPoint: 4
        }
      },
      JSXGraph: {
        initBoard: vi.fn().mockReturnValue({
          create: vi.fn().mockImplementation((type, coords, attrs) => {
            return {
              id: attrs.id,
              elType: type,
              hasPoint: vi.fn().mockReturnValue(false),
              setAttribute: vi.fn(),
              setPosition: vi.fn()
            };
          }),
          removeObject: vi.fn(),
          update: vi.fn()
        }),
        freeBoard: vi.fn()
      }
    }
  };
});

describe('JSXGraphRenderer', () => {
  let renderer: JSXGraphRenderer;
  let container: HTMLDivElement;

  beforeEach(() => {
    renderer = new JSXGraphRenderer();
    container = document.createElement('div');
    container.id = 'jxgbox';
    document.body.appendChild(container);
  });

  afterEach(() => {
    renderer.clear();
    document.body.removeChild(container);
  });

  it('should initialize without crashing', () => {
    expect(() => renderer.init('jxgbox')).not.toThrow();
  });

  it('should render a point and track its id', () => {
    renderer.init('jxgbox');
    
    const pt: GeometryObject = {
      id: 'pt1',
      type: 'point',
      dimension: 2,
      definition: {
        kind: 'point',
        coords: { x: 1, y: 2 }
      },
      style: { color: 'red' }
    };

    renderer.renderObject(pt);
    
    const ids = renderer.getRenderedIds();
    expect(ids).toContain('pt1');
    expect(ids.length).toBe(1);
  });

  it('should update an existing object', () => {
    renderer.init('jxgbox');
    
    const pt: GeometryObject = {
      id: 'pt1',
      type: 'point',
      dimension: 2,
      definition: {
        kind: 'point',
        coords: { x: 1, y: 2 }
      }
    };

    renderer.renderObject(pt);
    
    // Update
    pt.definition = {
      kind: 'point',
      coords: { x: 5, y: 5 }
    };
    renderer.updateObject('pt1', pt);
    
    // We can't deeply test JSXGraph internals without mocking it, 
    // but we can ensure it doesn't throw and stays tracked.
    const ids = renderer.getRenderedIds();
    expect(ids).toContain('pt1');
  });

  it('should remove an object', () => {
    renderer.init('jxgbox');
    
    const pt: GeometryObject = {
      id: 'pt1',
      type: 'point',
      dimension: 2,
      definition: {
        kind: 'point',
        coords: { x: 1, y: 2 }
      }
    };

    renderer.renderObject(pt);
    renderer.removeObject('pt1');
    
    const ids = renderer.getRenderedIds();
    expect(ids).not.toContain('pt1');
    expect(ids.length).toBe(0);
  });
});
