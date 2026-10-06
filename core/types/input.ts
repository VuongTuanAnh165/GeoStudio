export interface InputIntent {
  type: 'pointer' | 'select' | 'drag' | 'zoom' | 'pan' | 'cancel';
  position: { x: number; y: number };
  source: 'mouse' | 'touch' | 'stylus' | 'gesture' | 'keyboard';
  modifiers: { shift: boolean; ctrl: boolean; alt: boolean };
  pressure?: number; // cho stylus
  timestamp: number;
}

export type GestureState =
  | 'IDLE'
  | 'HOVER'
  | 'PINCH_START'
  | 'PINCH_HOLD'
  | 'DRAGGING'
  | 'PINCH_RELEASE'
  | 'DRAW_START'
  | 'DRAWING'
  | 'DRAW_END';

export type GestureEvent = unknown;

export interface GestureStateMachine {
  currentState: GestureState;
  transition(event: GestureEvent): GestureState;

  // Debounce / threshold configuration
  config: {
    pinchThreshold: number; // khoảng cách ngón để trigger pinch
    pinchHoldDuration: number; // ms giữ pinch trước khi thành HOLD
    dragThreshold: number; // pixel di chuyển để thành DRAG
    releaseDebounce: number; // ms debounce khi release
    swipeVelocityMin: number; // tốc độ tối thiểu cho swipe
    doublePinchWindow: number; // ms cửa sổ double pinch
  };
}

export type MediaPipeConfig = Record<string, unknown>;
export type HandLandmarks = Record<string, unknown>;
// Use DOM ImageBitmap for web workers if available, otherwise any
export type FrameBitmap = globalThis.ImageBitmap | unknown;

// Worker Communication Protocol
export type WorkerMessage =
  | { type: 'init'; config: MediaPipeConfig }
  | { type: 'process_frame'; frame: FrameBitmap; timestamp: number }
  | { type: 'update_config'; config: Partial<MediaPipeConfig> }
  | { type: 'destroy' };

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'landmarks'; data: HandLandmarks[]; timestamp: number; latencyMs: number }
  | { type: 'error'; message: string }
  | { type: 'performance'; fps: number; avgLatency: number };
