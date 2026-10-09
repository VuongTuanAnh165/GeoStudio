import { describe, it, expect, beforeEach } from 'vitest';
import { GestureStateMachine } from '../../../../core/gesture/GestureStateMachine';
import type { HandFeatures } from '../../../../core/types/input';

describe('GestureStateMachine', () => {
  let sm: GestureStateMachine;

  const createMockFeatures = (overrides: Partial<HandFeatures> = {}): HandFeatures => ({
    handedness: 'Right',
    fingers: {
      thumb: { isExtended: false, tipDistanceToPalm: 0 },
      index: { isExtended: false, tipDistanceToPalm: 0 },
      middle: { isExtended: false, tipDistanceToPalm: 0 },
      ring: { isExtended: false, tipDistanceToPalm: 0 },
      pinky: { isExtended: false, tipDistanceToPalm: 0 },
    },
    pinchDistance: 1.0, // not pinched by default
    palmPosition: { x: 0, y: 0, z: 0 },
    palmVelocity: { x: 0, y: 0, z: 0 },
    orientation: { pitch: 0, yaw: 0, roll: 0, facingCamera: true },
    ...overrides
  });

  beforeEach(() => {
    // Config: pinchThreshold=0.05, pinchHoldDuration=300, releaseDebounce=100, dragThreshold=0.02
    sm = new GestureStateMachine();
  });

  it('starts in IDLE state', () => {
    expect(sm.currentState).toBe('IDLE');
  });

  it('transitions to HOVER when tracking starts', () => {
    const state = sm.transition({ features: createMockFeatures(), timestamp: 0 });
    expect(state).toBe('HOVER');
  });

  it('transitions to PINCH_START when pinched', () => {
    sm.transition({ features: createMockFeatures(), timestamp: 0 });
    const state = sm.transition({ 
      features: createMockFeatures({ pinchDistance: 0.01 }), 
      timestamp: 10 
    });
    expect(state).toBe('PINCH_START');
  });

  it('transitions back to HOVER if pinch released quickly', () => {
    sm.transition({ features: createMockFeatures({ pinchDistance: 0.01 }), timestamp: 0 });
    expect(sm.currentState).toBe('PINCH_START');

    const state = sm.transition({ features: createMockFeatures({ pinchDistance: 1.0 }), timestamp: 50 });
    expect(state).toBe('HOVER');
  });

  it('transitions to PINCH_HOLD if pinch is held', () => {
    sm.transition({ features: createMockFeatures({ pinchDistance: 0.01 }), timestamp: 0 });
    
    // Maintain pinch for longer than hold duration
    const state = sm.transition({ features: createMockFeatures({ pinchDistance: 0.01 }), timestamp: 350 });
    expect(state).toBe('PINCH_HOLD');
  });

  it('transitions to DRAGGING if moved while pinched', () => {
    sm.transition({ 
      features: createMockFeatures({ pinchDistance: 0.01, palmPosition: { x: 0, y: 0, z: 0 } }), 
      timestamp: 0 
    });
    
    // Move more than dragThreshold (0.02)
    const state = sm.transition({ 
      features: createMockFeatures({ pinchDistance: 0.01, palmPosition: { x: 0.05, y: 0, z: 0 } }), 
      timestamp: 50 
    });
    expect(state).toBe('DRAGGING');
  });

  it('uses release debounce before triggering PINCH_RELEASE', () => {
    sm.transition({ features: createMockFeatures({ pinchDistance: 0.01 }), timestamp: 0 });
    sm.transition({ features: createMockFeatures({ pinchDistance: 0.01 }), timestamp: 350 });
    expect(sm.currentState).toBe('PINCH_HOLD');

    // Release begins
    let state = sm.transition({ features: createMockFeatures({ pinchDistance: 1.0 }), timestamp: 400 });
    expect(state).toBe('PINCH_HOLD'); // Still holding due to debounce

    // Wait for debounce (100ms)
    state = sm.transition({ features: createMockFeatures({ pinchDistance: 1.0 }), timestamp: 550 });
    expect(state).toBe('PINCH_RELEASE');

    // Next frame goes to HOVER
    state = sm.transition({ features: createMockFeatures({ pinchDistance: 1.0 }), timestamp: 560 });
    expect(state).toBe('HOVER');
  });

  it('transitions to SWIPE if velocity is high and not pinched', () => {
    const state = sm.transition({ 
      features: createMockFeatures({ palmVelocity: { x: 3.0, y: 0, z: 0 } }), 
      timestamp: 0 
    });
    expect(state).toBe('SWIPE');
  });

  it('resets to IDLE if features are lost', () => {
    sm.transition({ features: createMockFeatures(), timestamp: 0 });
    expect(sm.currentState).toBe('HOVER');

    const state = sm.transition({ features: null, timestamp: 10 });
    expect(state).toBe('IDLE');
  });
});
