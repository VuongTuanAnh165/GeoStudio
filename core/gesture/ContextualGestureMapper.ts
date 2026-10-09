import type { GestureState, HandFeatures, InputIntent } from '../types/input';
import type { EventBus } from '../types/events';

export type GestureMappingAction = 'pointer' | 'select' | 'drag' | 'zoom' | 'pan' | 'cancel' | 'swipe';

export interface GestureMappingConfig {
  [toolId: string]: {
    [state in GestureState]?: GestureMappingAction;
  };
}

const DEFAULT_MAPPING: GestureMappingConfig = {
  // Default fallback mappings if the active tool isn't explicitly defined
  '*': {
    'IDLE': 'cancel',
    'HOVER': 'pointer',
    'PINCH_START': 'pointer',
    'PINCH_HOLD': 'pointer',
    'DRAGGING': 'pointer',
    'PINCH_RELEASE': 'pointer',
    'SWIPE': 'swipe'
  },
  'select': {
    'DRAGGING': 'drag',
    'SWIPE': 'pan'
  }
};

export class ContextualGestureMapper {
  private lastIsPinching = false;
  private config: GestureMappingConfig;

  constructor(
    private eventBus: EventBus, 
    config?: GestureMappingConfig
  ) {
    this.config = config || DEFAULT_MAPPING;
  }

  public process(
    currentState: GestureState,
    features: HandFeatures | null,
    activeTool: string,
    timestamp: number,
    workspacePadding?: { x: number; y: number }
  ): InputIntent | null {
    if (!features) {
      if (this.lastIsPinching) {
        // Emit a pointer up to release any drags if tracking is lost while pinching
        this.lastIsPinching = false;
        const intent = this.createIntent('pointer', 'up', { x: 0, y: 0 }, timestamp);
        this.emit(intent);
        return intent;
      }
      return null;
    }

    let px = features.pointerPosition.x;
    let py = features.pointerPosition.y;
    
    // Apply calibration padding to map camera active area to full canvas [0..1]
    if (workspacePadding) {
      const { x: pxPad, y: pyPad } = workspacePadding;
      px = Math.max(0, Math.min(1, (px - pxPad) / (1 - 2 * pxPad)));
      py = Math.max(0, Math.min(1, (py - pyPad) / (1 - 2 * pyPad)));
    }

    const position = { x: px, y: py };
    
    let action: InputIntent['action'] = 'none';
    const isPinchingNow = ['PINCH_START', 'PINCH_HOLD', 'DRAGGING'].includes(currentState);

    // Determine the action phase
    if (currentState === 'SWIPE') {
      action = 'none';
    } else if (isPinchingNow && !this.lastIsPinching) {
      action = 'down';
    } else if (!isPinchingNow && this.lastIsPinching) {
      action = 'up';
    } else {
      action = 'move';
    }

    // Determine semantic type based on mapping table
    const toolMapping = this.config[activeTool] || this.config['*'] || {};
    // Fallback to '*' if the specific state isn't mapped for the tool
    const type = toolMapping[currentState] || (this.config['*'] && this.config['*'][currentState]) || 'pointer';

    const intent = this.createIntent(type, action, position, timestamp);
    
    this.lastIsPinching = isPinchingNow;

    this.emit(intent);
    return intent;
  }

  private createIntent(
    type: InputIntent['type'],
    action: InputIntent['action'],
    position: { x: number; y: number },
    timestamp: number
  ): InputIntent {
    return {
      type,
      action,
      position,
      source: 'gesture',
      modifiers: { shift: false, ctrl: false, alt: false },
      timestamp
    };
  }

  private emit(intent: InputIntent): void {
    this.eventBus.emit({
      type: 'input:intent',
      payload: { intent }
    });
  }
}
