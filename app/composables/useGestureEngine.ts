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

  // Left hand tool switching debouncer
  let leftHandFingerCountBuffer: number[] = [];
  const LEFT_HAND_BUFFER_SIZE = 15; // 0.5 seconds at 30fps

  const startEngine = async (video: HTMLVideoElement) => {
    if (mediaPipeManager) {
      mediaPipeManager.destroy();
    }

    // Use absolute URL for the model asset to prevent 404s inside Web Workers on Vercel
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    mediaPipeManager = new MediaPipeManager({
      wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
      modelAssetPath: `${origin}/models/hand_landmarker.task`,
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
      
      // Create a 4-bit mask for the 4 main fingers (ignoring jittery thumb)
      // Index=1, Middle=2, Ring=4, Pinky=8
      const bitmask = 
        (fingers.index.isExtended ? 1 : 0) |
        (fingers.middle.isExtended ? 2 : 0) |
        (fingers.ring.isExtended ? 4 : 0) |
        (fingers.pinky.isExtended ? 8 : 0);
      
      leftHandFingerCountBuffer.push(bitmask);
      if (leftHandFingerCountBuffer.length > LEFT_HAND_BUFFER_SIZE) {
        leftHandFingerCountBuffer.shift();
      }

      // Get the most frequent bitmask in the buffer (Mode) to debounce flickering
      const counts = new Array(16).fill(0);
      for (const mask of leftHandFingerCountBuffer) {
        counts[mask]++;
      }
      let stableMask = 0;
      let maxCount = 0;
      for (let i = 0; i < 16; i++) {
        if (counts[i] > maxCount) {
          maxCount = counts[i];
          stableMask = i;
        }
      }

      // 1. Navigation States
      if (stableMask === 0 && !fingers.thumb.isExtended) {
        leftState = 'FIST'; // Pan/Zoom
      } else if (stableMask === 15) {
        leftState = 'OPEN_PALM'; // Select/Move
        if (geometryStore.activeToolType !== 'select') geometryStore.activeToolType = 'select';
      } else {
        leftState = 'IDLE';
      }

      // 2. Specific Tool Selection (Bimanual Chording)
      // Only switch if we have a stable explicit gesture and not fist/palm
      if (leftState === 'IDLE' && stableMask > 0 && stableMask < 15) {
        let targetTool = '';
        switch (stableMask) {
          case 1: targetTool = 'point'; break;          // Index ☝️
          case 2: targetTool = 'segment'; break;        // Middle 🖕
          case 4: targetTool = 'circle'; break;         // Ring 💍
          case 8: targetTool = 'polygon'; break;        // Pinky 🤙
          case 3: targetTool = 'line'; break;           // Index + Middle ✌️
          case 6: targetTool = 'ray'; break;            // Middle + Ring 🖖
          case 12: targetTool = 'triangle'; break;      // Ring + Pinky
          case 9: targetTool = 'delete'; break;         // Index + Pinky 🤘
          case 7: targetTool = 'measure_angle'; break;  // Index + Middle + Ring
          case 14: targetTool = 'measure_distance'; break; // Middle + Ring + Pinky
          case 13: targetTool = 'text'; break;          // Index + Ring + Pinky
          default: break;
        }
        
        if (targetTool && geometryStore.activeToolType !== targetTool) {
          geometryStore.activeToolType = targetTool;
        }
      }
    } else {
      leftHandFingerCountBuffer = []; // reset if hand lost
    }

    // 3. Contextual Mapping & Dispatching
    const activeTool = geometryStore.activeToolType || '*';
    const padding = gestureStore.calibration.workspacePadding;
    
    // Pinch Lock Mechanism
    if (rightState === 'PINCH_START' && gestureStore.currentState !== 'PINCH_START') {
      cursorFilter.lock(150); // Lock for 150ms to absorb click down jitter
    } else if (rightState === 'PINCH_RELEASE' && gestureStore.currentState !== 'PINCH_RELEASE') {
      cursorFilter.lock(150); // Lock for 150ms to absorb click up jitter
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
