import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCanvas } from '../../../../app/composables/useCanvas';
import { useGeometryStore } from '../../../../app/stores/geometry';
import { CreatePointCommand } from '../../../../core/commands';

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
            return { id: attrs.id, elType: type, hasPoint: vi.fn(), setAttribute: vi.fn(), setPosition: vi.fn() };
          }),
          removeObject: vi.fn(),
          update: vi.fn(),
          on: vi.fn(),
          off: vi.fn()
        }),
        freeBoard: vi.fn()
      }
    }
  };
});

describe('useCanvas composable', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    setActivePinia(createPinia());
    container = document.createElement('div');
    container.id = 'jxgbox';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should sync store changes to renderer automatically', async () => {
    const { init, renderer } = useCanvas();
    const store = useGeometryStore();
    
    init('jxgbox');
    expect(renderer.getRenderedIds().length).toBe(0);

    // Add a point via store
    store.executeCommand(new CreatePointCommand(1, 1, 'pt1'));
    
    // In Vue setup, watch requires a tick to resolve. 
    // Wait for watchers:
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(renderer.getRenderedIds()).toContain('pt1');
    expect(renderer.getRenderedIds().length).toBe(1);
    
    // Undo
    store.undo();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(renderer.getRenderedIds().length).toBe(0);
  });
});
