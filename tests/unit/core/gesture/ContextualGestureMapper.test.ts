import { describe, it, expect, vi } from 'vitest';
import { ContextualGestureMapper } from '../../../../core/gesture/ContextualGestureMapper';
import type { EventBus } from '../../../../core/types/events';
import type { HandFeatures } from '../../../../core/types/input';

describe('ContextualGestureMapper', () => {
  const createMockFeatures = (): HandFeatures => ({
    handedness: 'Right',
    fingers: {
      thumb: { isExtended: false, tipDistanceToPalm: 0 },
      index: { isExtended: false, tipDistanceToPalm: 0 },
      middle: { isExtended: false, tipDistanceToPalm: 0 },
      ring: { isExtended: false, tipDistanceToPalm: 0 },
      pinky: { isExtended: false, tipDistanceToPalm: 0 },
    },
    pinchDistance: 1.0,
    palmPosition: { x: 0, y: 0, z: 0 },
    palmVelocity: { x: 0, y: 0, z: 0 },
    pointerPosition: { x: 0.5, y: 0.5, z: 0 },
    orientation: { pitch: 0, yaw: 0, roll: 0, facingCamera: true }
  });

  const mockEventBus: EventBus = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    once: vi.fn()
  };

  it('maps HOVER to pointer move intent', () => {
    const mapper = new ContextualGestureMapper(mockEventBus);
    const intent = mapper.process('HOVER', createMockFeatures(), 'point', 100);
    
    expect(intent).not.toBeNull();
    expect(intent?.type).toBe('pointer');
    expect(intent?.action).toBe('move');
    expect(intent?.position).toEqual({ x: 0.5, y: 0.5 });
    
    expect(mockEventBus.emit).toHaveBeenCalledWith({
      type: 'input:intent',
      payload: { intent }
    });
  });

  it('maps PINCH_START to pointer down intent', () => {
    const mapper = new ContextualGestureMapper(mockEventBus);
    // Initial state
    mapper.process('HOVER', createMockFeatures(), 'point', 100);
    
    // Transition to pinch
    const intent = mapper.process('PINCH_START', createMockFeatures(), 'point', 150);
    expect(intent?.type).toBe('pointer');
    expect(intent?.action).toBe('down');
  });

  it('maps PINCH_RELEASE to pointer up intent', () => {
    const mapper = new ContextualGestureMapper(mockEventBus);
    mapper.process('PINCH_START', createMockFeatures(), 'point', 100);
    
    const intent = mapper.process('PINCH_RELEASE', createMockFeatures(), 'point', 200);
    expect(intent?.type).toBe('pointer');
    expect(intent?.action).toBe('up');
  });

  it('uses contextual mapping for select tool (DRAGGING -> drag)', () => {
    const mapper = new ContextualGestureMapper(mockEventBus);
    mapper.process('PINCH_START', createMockFeatures(), 'select', 100);
    
    const intent = mapper.process('DRAGGING', createMockFeatures(), 'select', 200);
    expect(intent?.type).toBe('drag');
    expect(intent?.action).toBe('move');
  });

  it('uses contextual mapping for select tool (SWIPE -> pan)', () => {
    const mapper = new ContextualGestureMapper(mockEventBus);
    
    const intent = mapper.process('SWIPE', createMockFeatures(), 'select', 200);
    expect(intent?.type).toBe('pan');
  });

  it('emits pointer up when tracking is lost while pinching', () => {
    const mapper = new ContextualGestureMapper(mockEventBus);
    mapper.process('PINCH_START', createMockFeatures(), 'point', 100);
    
    const intent = mapper.process('IDLE', null, 'point', 200);
    expect(intent?.type).toBe('pointer');
    expect(intent?.action).toBe('up');
  });

  it('returns null if tracking lost while not pinching', () => {
    const mapper = new ContextualGestureMapper(mockEventBus);
    mapper.process('HOVER', createMockFeatures(), 'point', 100);
    
    const intent = mapper.process('IDLE', null, 'point', 200);
    expect(intent).toBeNull();
  });
});
