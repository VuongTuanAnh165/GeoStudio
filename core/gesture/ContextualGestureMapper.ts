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
    timestamp: number
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

    const position = { 
      x: features.pointerPosition.x, 
      y: features.pointerPosition.y 
    };
    
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
    const toolMapping = this.config[activeTool] || this.config['*'];
    // Fallback to '*' if the specific state isn't mapped for the tool
    const type = toolMapping[currentState] || this.config['*'][currentState] || 'pointer';

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
