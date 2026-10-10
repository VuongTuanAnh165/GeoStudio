import type {
  GestureState,
  GestureEvent,
  GestureStateMachineConfig,
  GestureStateMachine as IGestureStateMachine
} from '../types/input';

const DEFAULT_CONFIG: GestureStateMachineConfig = {
  pinchThreshold: 0.05,
  pinchHoldDuration: 300,
  pinchHoldLongDuration: 500, // 500ms
  dragThreshold: 0.02,
  releaseDebounce: 100,
  swipeVelocityMin: 2.5,
};

export class GestureStateMachine implements IGestureStateMachine {
  public currentState: GestureState = 'IDLE';
  public config: GestureStateMachineConfig;

  // State Tracking
  private pinchStartTime = 0;
  private pinchStartPos = { x: 0, y: 0, z: 0 };
  
  private releaseStartTime = 0;
  private isReleasing = false;

  constructor(config?: Partial<GestureStateMachineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public updateConfig(newConfig: Partial<GestureStateMachineConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public transition(event: GestureEvent): GestureState {
    const { features, timestamp } = event;

    // Tracking lost
    if (!features) {
      this.resetTracking();
      this.currentState = 'IDLE';
      return this.currentState;
    }

    const isPinched = features.pinchDistance <= this.config.pinchThreshold;
    const velocityMagnitude = Math.sqrt(
      features.palmVelocity.x ** 2 +
      features.palmVelocity.y ** 2 +
      features.palmVelocity.z ** 2
    );
    const isSwiping = velocityMagnitude >= this.config.swipeVelocityMin && !isPinched;

    switch (this.currentState) {
      case 'IDLE':
      case 'HOVER': {
        if (isPinched) {
          this.currentState = 'PINCH_START';
          this.pinchStartTime = timestamp;
          this.pinchStartPos = { ...features.palmPosition };
          this.isReleasing = false;
        } else if (isSwiping) {
          this.currentState = 'SWIPE';
        } else {
          this.currentState = 'HOVER';
        }
        break;
      }

      case 'PINCH_START': {
        if (!isPinched) {
          this.currentState = 'HOVER';
        } else {
          const distMoved = this.distance(features.palmPosition, this.pinchStartPos);
          if (distMoved >= this.config.dragThreshold) {
            this.currentState = 'DRAGGING';
          } else if (timestamp - this.pinchStartTime >= this.config.pinchHoldDuration) {
            this.currentState = 'PINCH_HOLD';
          }
        }
        break;
      }

      case 'PINCH_HOLD': {
        if (!isPinched) {
          if (!this.isReleasing) {
            this.isReleasing = true;
            this.releaseStartTime = timestamp;
          } else if (timestamp - this.releaseStartTime >= this.config.releaseDebounce) {
            this.currentState = 'PINCH_RELEASE';
            this.isReleasing = false;
          }
        } else {
          this.isReleasing = false;
          const distMoved = this.distance(features.palmPosition, this.pinchStartPos);
          if (distMoved >= this.config.dragThreshold) {
            this.currentState = 'DRAGGING';
          } else if (timestamp - this.pinchStartTime >= this.config.pinchHoldLongDuration) {
            this.currentState = 'PINCH_HOLD_LONG';
          }
        }
        break;
      }

      case 'PINCH_HOLD_LONG': {
        if (!isPinched) {
          if (!this.isReleasing) {
            this.isReleasing = true;
            this.releaseStartTime = timestamp;
          } else if (timestamp - this.releaseStartTime >= this.config.releaseDebounce) {
            this.currentState = 'PINCH_RELEASE';
            this.isReleasing = false;
          }
        } else {
          this.isReleasing = false;
          const distMoved = this.distance(features.palmPosition, this.pinchStartPos);
          if (distMoved >= this.config.dragThreshold) {
            this.currentState = 'DRAGGING';
          }
        }
        break;
      }

      case 'DRAGGING': {
        if (!isPinched) {
          if (!this.isReleasing) {
            this.isReleasing = true;
            this.releaseStartTime = timestamp;
          } else if (timestamp - this.releaseStartTime >= this.config.releaseDebounce) {
            this.currentState = 'PINCH_RELEASE';
            this.isReleasing = false;
          }
        } else {
          this.isReleasing = false;
        }
        break;
      }

      case 'PINCH_RELEASE': {
        // Automatically transition out of PINCH_RELEASE on the very next frame
        if (isPinched) {
          this.currentState = 'PINCH_START';
          this.pinchStartTime = timestamp;
          this.pinchStartPos = { ...features.palmPosition };
        } else if (isSwiping) {
          this.currentState = 'SWIPE';
        } else {
          this.currentState = 'HOVER';
        }
        break;
      }

      case 'SWIPE': {
        if (isPinched) {
          this.currentState = 'PINCH_START';
          this.pinchStartTime = timestamp;
          this.pinchStartPos = { ...features.palmPosition };
        } else if (!isSwiping) {
          this.currentState = 'HOVER';
        }
        break;
      }
    }

    return this.currentState;
  }

  public reset(): void {
    this.resetTracking();
    this.currentState = 'IDLE';
  }

  private resetTracking(): void {
    this.pinchStartTime = 0;
    this.pinchStartPos = { x: 0, y: 0, z: 0 };
    this.releaseStartTime = 0;
    this.isReleasing = false;
  }

  private distance(p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
  }
}
