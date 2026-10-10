import { ref, onUnmounted, watch } from 'vue';
import { useGestureStore } from '../stores/gesture';
import { useGeometryStore } from '../stores/geometry';
import { useEventBusStore } from '../stores/eventBus';
import { MediaPipeManager } from '../../core/gesture/MediaPipeManager';
import { GestureFeatureExtractor } from '../../core/gesture/GestureFeatureExtractor';
import { GestureStateMachine } from '../../core/gesture/GestureStateMachine';
import { ContextualGestureMapper } from '../../core/gesture/ContextualGestureMapper';
import { GestureDOMBridge } from '../../core/gesture/GestureDOMBridge';
import { CursorFilter } from '../../core/gesture/CursorFilter';
import type { HandDetection } from '../../core/types/input';

export function useGestureEngine() {
  const gestureStore = useGestureStore();
  const geometryStore = useGeometryStore();
  const eventBusStore = useEventBusStore();

  let mediaPipeManager: MediaPipeManager | null = null;
  const extractor = new GestureFeatureExtractor();
  const stateMachine = new GestureStateMachine({
    pinchThreshold: gestureStore.calibration.pinchThreshold
  });
  const mapper = new ContextualGestureMapper(eventBusStore.bus);
  const domBridge = new GestureDOMBridge();
  const cursorFilter = new CursorFilter();

  let lastLeftPanPos: { x: number, y: number } | null = null;
  let lastRightZoomPos: { y: number } | null = null;

  // Double-pinch detection for one-handed tool dock
  let lastPinchReleaseTime = 0;
  const DOUBLE_PINCH_WINDOW = 400; // ms

  const startEngine = async (video: HTMLVideoElement) => {
    if (mediaPipeManager) {
      mediaPipeManager.destroy();
    }

    // Use absolute URL or relative to public directory for WASM and task files
    // Nuxt serves public/ directory at root
    mediaPipeManager = new MediaPipeManager({
      wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
      modelAssetPath: '/models/hand_landmarker.task',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      runningMode: 'VIDEO'
    });

    mediaPipeManager.onReady = () => {
      console.log('MediaPipe Worker is ready');
      mediaPipeManager?.start();
    };

    mediaPipeManager.onLandmarks = (detections: HandDetection[], timestamp: number, latencyMs: number) => {
      gestureStore.lastDetections = detections;
      processGestures(detections, timestamp);
    };

    mediaPipeManager.onPerformance = (metrics: any) => {
      gestureStore.updateMetrics(metrics.fps, metrics.avgLatencyMs);
    };

    mediaPipeManager.onError = (message: string, code?: string) => {
      console.error(`MediaPipe Error [${code}]:`, message);
    };

    await mediaPipeManager.init(video);
  };

  const stopEngine = () => {
    if (mediaPipeManager) {
      mediaPipeManager.stop();
      mediaPipeManager.destroy();
      mediaPipeManager = null;
    }
    gestureStore.updateState('IDLE', 0, 0);
    gestureStore.lastDetections = [];
  };

  const processGestures = (detections: HandDetection[], timestamp: number) => {
    // 1. Extract features
    if (detections.length === 0) {
      gestureStore.updateState('IDLE', 0, 0, 'IDLE');
      cursorFilter.reset();
      return;
    }

    let rightDetection = detections[0];
    let leftDetection = detections.length > 1 ? detections[1] : null;

    // Typically, MediaPipe's 'Left' in selfie mode refers to the user's Right hand (mirror effect).
    // Let's rely on X coordinate as a fallback if handedness is confused.
    // The hand on the LEFT side of the image (x < 0.5) is the user's RIGHT hand in a mirrored view.
    if (detections.length === 2) {
      const d0x = detections[0]!.landmarks[0]!.x;
      const d1x = detections[1]!.landmarks[0]!.x;
      if (d0x < d1x) {
        rightDetection = detections[0]; // Left side of camera = User's Right hand
        leftDetection = detections[1];
      } else {
        rightDetection = detections[1];
        leftDetection = detections[0];
      }
    }

    const rightFeatures = rightDetection ? extractor.extract(rightDetection, timestamp) : null;
    const leftFeatures = leftDetection ? extractor.extract(leftDetection, timestamp) : null;

    // 2. State Machine Transition
    const rightState = rightFeatures ? stateMachine.transition({ features: rightFeatures, timestamp }) : 'IDLE';
    let leftState: any = 'IDLE';
    
    if (leftFeatures) {
      const fingers = leftFeatures.fingers;
      const fingersUpCount = [fingers.thumb, fingers.index, fingers.middle, fingers.ring, fingers.pinky]
        .filter(f => f.isExtended).length;
      
      leftState = fingersUpCount >= 4 ? 'OPEN_PALM' : (fingersUpCount === 0 ? 'FIST' : 'IDLE');
      // Tool switching is handled by SpatialToolDock — no finger counting here
    }

    // 3. Contextual Mapping & Dispatching
    const activeTool = geometryStore.activeToolType || '*';
    const padding = gestureStore.calibration.workspacePadding;
    
    // Pinch Lock Mechanism
    if (rightState === 'PINCH_START' && gestureStore.currentState !== 'PINCH_START') {
      cursorFilter.lock(150); // Lock for 150ms to absorb click jitter
    }

    // Double-pinch detection (one-handed tool dock access)
    if (rightState === 'PINCH_RELEASE' && gestureStore.currentState !== 'PINCH_RELEASE') {
      const now = Date.now();
      if (now - lastPinchReleaseTime < DOUBLE_PINCH_WINDOW) {
        gestureStore.isToolDockVisible = !gestureStore.isToolDockVisible;
        lastPinchReleaseTime = 0; // Reset to avoid triple-trigger
      } else {
        lastPinchReleaseTime = now;
      }
    }

    // Process intent for right hand
    const intent = rightFeatures ? mapper.process(rightState, rightFeatures, activeTool, timestamp, padding) : null;
    
    // Update store for HUD & Virtual Cursor
    const confidence = rightDetection ? (rightDetection.handedness.score || 0) : 0;
    const rawPinchDistance = rightFeatures?.pinchDistance || 0;
    gestureStore.updateState(rightState, confidence, rawPinchDistance, leftState);
    
    // Compute exact screen coordinates for RIGHT hand
    if (rightFeatures) {
      // MIRROR FIX: 1 - x
      let px = 1.0 - rightFeatures.pointerPosition.x;
      let py = rightFeatures.pointerPosition.y;
      const { x: pxPad, y: pyPad } = padding;
      px = Math.max(0, Math.min(1, (px - pxPad) / (1 - 2 * pxPad)));
      py = Math.max(0, Math.min(1, (py - pyPad) / (1 - 2 * pyPad)));
      
      const targetX = px * window.innerWidth;
      const targetY = py * window.innerHeight;
      
      // Smooth the cursor
      const smoothed = cursorFilter.update(targetX, targetY);
      
      // Bimanual Pan & Zoom
      if (leftState === 'FIST') {
        // 1. Pan with left hand movement
        if (leftFeatures) {
          const lpx = (1.0 - leftFeatures.pointerPosition.x) * window.innerWidth;
          const lpy = leftFeatures.pointerPosition.y * window.innerHeight;
          if (lastLeftPanPos) {
            const dx = lpx - lastLeftPanPos.x;
            const dy = lpy - lastLeftPanPos.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              window.dispatchEvent(new CustomEvent('geostudio:pan', { detail: { dx, dy } }));
            }
          }
          lastLeftPanPos = { x: lpx, y: lpy };
        }

        // 2. Zoom with right hand Pinch & Drag
        if (rightState === 'DRAGGING' || rightState === 'PINCH_HOLD') {
          if (lastRightZoomPos) {
            const dy = smoothed.y - lastRightZoomPos.y;
            if (Math.abs(dy) > 10) { // Threshold for zooming
              if (dy < 0) {
                window.dispatchEvent(new CustomEvent('geostudio:zoom-in'));
              } else {
                window.dispatchEvent(new CustomEvent('geostudio:zoom-out'));
              }
              lastRightZoomPos = { y: smoothed.y };
            }
          } else {
            lastRightZoomPos = { y: smoothed.y };
          }
        } else {
          lastRightZoomPos = null;
        }
        
        // Reset dom bridge to prevent stuck drags
        domBridge.reset();
        gestureStore.cursorX = smoothed.x;
        gestureStore.cursorY = smoothed.y;
      } else {
        lastLeftPanPos = null;
        lastRightZoomPos = null;
        
        // Normal tool interaction
        const snapped = domBridge.process(rightState, smoothed.x, smoothed.y);
        gestureStore.cursorX = snapped.x;
        gestureStore.cursorY = snapped.y;
      }
    }
    
    // Compute screen coordinates for LEFT hand (for Hand Menu)
    if (leftFeatures) {
      let px = 1.0 - leftFeatures.pointerPosition.x;
      let py = leftFeatures.pointerPosition.y;
      gestureStore.leftCursorX = px * window.innerWidth;
      gestureStore.leftCursorY = py * window.innerHeight;
      
      // Spatial Zone: Bottom 25% of screen
      gestureStore.isToolDockVisible = py > 0.75;
    } else {
      gestureStore.isToolDockVisible = false;
    }
    
    if (intent) {
      gestureStore.activeIntentType = intent.action;
    } else {
      gestureStore.activeIntentType = 'none';
    }
  };

  // Watch for calibration changes and update the state machine config
  watch(
    () => gestureStore.calibration.pinchThreshold,
    (newThreshold) => {
      stateMachine.updateConfig({ pinchThreshold: newThreshold });
    }
  );

  onUnmounted(() => {
    stopEngine();
  });

  return {
    startEngine,
    stopEngine
  };
}
