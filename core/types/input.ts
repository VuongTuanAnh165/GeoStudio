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

/** 3D normalized landmark from MediaPipe (values 0..1 relative to image) */
export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/** Handedness classification result */
export interface HandednessResult {
  categoryName: 'Left' | 'Right';
  score: number;
  index: number;
  displayName: string;
}

/** A single hand detection result: 21 landmarks + handedness */
export interface HandDetection {
  landmarks: NormalizedLandmark[];   // 21 landmarks in normalized coords
  worldLandmarks: NormalizedLandmark[]; // 21 landmarks in world coords (meters)
  handedness: HandednessResult;
}

/** Configuration for the MediaPipe Hand Landmarker */
export interface MediaPipeConfig {
  /** URL to the WASM binary loader files directory */
  wasmLoaderPath: string;
  /** URL to the hand landmarker model .task file */
  modelAssetPath: string;
  /** Max number of hands to detect (1 or 2) */
  numHands: number;
  /** Minimum confidence for hand detection (0-1) */
  minHandDetectionConfidence: number;
  /** Minimum confidence for hand presence (0-1) */
  minHandPresenceConfidence: number;
  /** Minimum confidence for tracking (0-1) */
  minTrackingConfidence: number;
  /** Whether to run in VIDEO (true) or IMAGE (false) mode */
  runningMode: 'VIDEO' | 'IMAGE';
}

// Use DOM ImageBitmap for web workers
export type FrameBitmap = ImageBitmap;

// ── Worker Communication Protocol ──────────────────────────────────

export type WorkerMessage =
  | { type: 'init'; config: MediaPipeConfig }
  | { type: 'process_frame'; frame: FrameBitmap; timestamp: number }
  | { type: 'update_config'; config: Partial<MediaPipeConfig> }
  | { type: 'destroy' };

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'landmarks'; data: HandDetection[]; timestamp: number; latencyMs: number }
  | { type: 'error'; message: string; code?: string }
  | { type: 'performance'; fps: number; avgLatencyMs: number; framesProcessed: number };

// ── Hand Features ────────────────────────────────────────────────────

export interface FingerState {
  isExtended: boolean;
  tipDistanceToPalm: number;
}

export interface HandOrientation {
  pitch: number;
  yaw: number;
  roll: number;
  facingCamera: boolean;
}

export interface HandFeatures {
  handedness: 'Left' | 'Right';
  fingers: {
    thumb: FingerState;
    index: FingerState;
    middle: FingerState;
    ring: FingerState;
    pinky: FingerState;
  };
  pinchDistance: number; // Euclidean distance between thumb tip and index tip
  palmPosition: { x: number; y: number; z: number }; // centroid of palm landmarks
  palmVelocity: { x: number; y: number; z: number }; // delta per second
  orientation: HandOrientation;
}
