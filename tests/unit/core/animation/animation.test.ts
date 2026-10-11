import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnimationSystem } from '../../../../core/animation/AnimationSystem';
import { EasingFunctions, DEFAULT_ANIMATION_CONFIG } from '../../../../core/types/animation';
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
              setPosition: vi.fn(),
              animate: vi.fn().mockImplementation((attrs, dur, opts) => {
                if (opts && typeof opts.callback === 'function') {
                  setTimeout(opts.callback, 0);
                }
              }),
              moveTo: vi.fn().mockImplementation((coords, dur, opts) => {
                if (opts && typeof opts.callback === 'function') {
                  setTimeout(opts.callback, 0);
                }
              })
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

describe('AnimationSystem', () => {
  let animSystem: AnimationSystem;

  beforeEach(() => {
    animSystem = new AnimationSystem();
  });

  describe('Easing Functions', () => {
    it('linear should return exact t', () => {
      expect(EasingFunctions.linear(0)).toBe(0);
      expect(EasingFunctions.linear(0.5)).toBe(0.5);
      expect(EasingFunctions.linear(1)).toBe(1);
    });

    it('easeIn should accelerate quad', () => {
      expect(EasingFunctions.easeIn(0)).toBe(0);
      expect(EasingFunctions.easeIn(0.5)).toBe(0.25);
      expect(EasingFunctions.easeIn(1)).toBe(1);
    });

    it('easeOut should decelerate quad', () => {
      expect(EasingFunctions.easeOut(0)).toBe(0);
      expect(EasingFunctions.easeOut(0.5)).toBe(0.75);
      expect(EasingFunctions.easeOut(1)).toBe(1);
    });

    it('easeInOut should be symmetric', () => {
      expect(EasingFunctions.easeInOut(0)).toBe(0);
      expect(EasingFunctions.easeInOut(0.5)).toBe(0.5);
      expect(EasingFunctions.easeInOut(1)).toBe(1);
    });
  });

  describe('Interpolations', () => {
    it('should interpolate numbers correctly', () => {
      expect(animSystem.interpolateNumber(0, 100, 0)).toBe(0);
      expect(animSystem.interpolateNumber(0, 100, 0.5, 'linear')).toBe(50);
      expect(animSystem.interpolateNumber(0, 100, 1)).toBe(100);
    });

    it('should interpolate 2D coordinates correctly', () => {
      const from = { x: 0, y: 10 };
      const to = { x: 10, y: 30 };
      const mid = animSystem.interpolateCoords(from, to, 0.5, 'linear');
      expect(mid.x).toBe(5);
      expect(mid.y).toBe(20);
    });

    it('should map easing to JSXGraph effect string', () => {
      expect(animSystem.getJSXGraphEffect('linear')).toBe('--');
      expect(animSystem.getJSXGraphEffect('easeIn')).toBe('>');
      expect(animSystem.getJSXGraphEffect('easeOut')).toBe('<');
      expect(animSystem.getJSXGraphEffect('easeInOut')).toBe('<>');
    });
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      expect(animSystem.getConfig()).toEqual(DEFAULT_ANIMATION_CONFIG);
      expect(animSystem.isEnabled()).toBe(true);
    });

    it('should update config partially', () => {
      animSystem.setConfig({ duration: 600, easing: 'easeOut' });
      const cfg = animSystem.getConfig();
      expect(cfg.duration).toBe(600);
      expect(cfg.easing).toBe('easeOut');
      expect(cfg.enabled).toBe(true);
    });

    it('should toggle enabled state', () => {
      animSystem.setConfig({ enabled: false });
      expect(animSystem.isEnabled()).toBe(false);
      expect(animSystem.shouldAnimateConstruction()).toBe(false);
      expect(animSystem.shouldAnimateTransform()).toBe(false);
      expect(animSystem.shouldAnimateDelete()).toBe(false);
    });
  });
});

describe('JSXGraphRenderer Animation Integration', () => {
  let renderer: JSXGraphRenderer;
  let container: HTMLDivElement;

  beforeEach(() => {
    renderer = new JSXGraphRenderer();
    container = document.createElement('div');
    container.id = 'jxgbox-anim';
    document.body.appendChild(container);
    renderer.init('jxgbox-anim');
  });

  afterEach(() => {
    renderer.clear();
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should accept animation configuration updates', () => {
    renderer.setAnimationConfig({ duration: 500, easing: 'easeOut', enabled: true });
    expect(renderer.getAnimationConfig().duration).toBe(500);
    expect(renderer.getAnimationConfig().easing).toBe('easeOut');
  });

  it('should trigger construction animation when rendering point', () => {
    const pt: GeometryObject = {
      id: 'p_anim',
      type: 'point',
      dimension: 2,
      definition: {
        kind: 'point',
        coords: { x: 3, y: 4 }
      },
      style: { size: 6, color: 'blue' }
    };

    renderer.renderObject(pt);
    const jxgObj = renderer.getRawObject('p_anim');
    expect(jxgObj).toBeDefined();
    expect(jxgObj.animate).toHaveBeenCalled();
  });

  it('should exclude deleting object from getRenderedIds and remove after fade-out', async () => {
    vi.useFakeTimers();

    const pt: GeometryObject = {
      id: 'p_del',
      type: 'point',
      dimension: 2,
      definition: {
        kind: 'point',
        coords: { x: 0, y: 0 }
      }
    };

    renderer.renderObject(pt);
    expect(renderer.getRenderedIds()).toContain('p_del');

    // Remove with animation
    renderer.removeObject('p_del', { animate: true });

    // While animating fade out, should immediately be considered removed from active IDs
    expect(renderer.getRenderedIds()).not.toContain('p_del');

    // Fast-forward past delete animation duration
    vi.advanceTimersByTime(500);

    // After timer, it should be completely removed from map
    expect(renderer.getRawObject('p_del')).toBeUndefined();

    vi.useRealTimers();
  });

  it('should immediately remove object if animate is false', () => {
    const pt: GeometryObject = {
      id: 'p_del_fast',
      type: 'point',
      dimension: 2,
      definition: {
        kind: 'point',
        coords: { x: 0, y: 0 }
      }
    };

    renderer.renderObject(pt);
    renderer.removeObject('p_del_fast', { animate: false });

    expect(renderer.getRenderedIds()).not.toContain('p_del_fast');
    expect(renderer.getRawObject('p_del_fast')).toBeUndefined();
  });

  it('should animate object move smoothly', async () => {
    const pt: GeometryObject = {
      id: 'p_move',
      type: 'point',
      dimension: 2,
      definition: {
        kind: 'point',
        coords: { x: 1, y: 1 }
      }
    };

    renderer.renderObject(pt);
    const jxgObj = renderer.getRawObject('p_move');

    await renderer.animateObjectMove('p_move', { x: 5, y: 10 }, 300);
    expect(jxgObj.moveTo).toHaveBeenCalledWith([5, 10], 300, expect.anything());
  });
});
