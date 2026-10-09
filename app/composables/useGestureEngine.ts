import { ref, onUnmounted, watch } from 'vue';
import { useGestureStore } from '../stores/gesture';
import { useGeometryStore } from '../stores/geometry';
import { useEventBusStore } from '../stores/eventBus';
import { MediaPipeManager } from '../../core/gesture/MediaPipeManager';
import { GestureFeatureExtractor } from '../../core/gesture/GestureFeatureExtractor';
import { GestureStateMachine } from '../../core/gesture/GestureStateMachine';
import { ContextualGestureMapper } from '../../core/gesture/ContextualGestureMapper';
import { GestureDOMBridge } from '../../core/gesture/GestureDOMBridge';
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

  const startEngine = async (video: HTMLVideoElement) => {
    if (mediaPipeManager) {
      mediaPipeManager.destroy();
    }

    // Use absolute URL or relative to public directory for WASM and task files
    // Nuxt serves public/ directory at root
    mediaPipeManager = new MediaPipeManager({
      wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
      modelAssetPath: '/models/hand_landmarker.task',
      numHands: 1,
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
  };

  const processGestures = (detections: HandDetection[], timestamp: number) => {
    // 1. Extract features
    if (detections.length === 0) {
      gestureStore.updateState('IDLE', 0, 0);
      return;
    }

    const detection = detections[0]!;
    const features = extractor.extract(detection, timestamp);

    // 2. State Machine Transition
    const state = stateMachine.transition({ features, timestamp });

    // 3. Contextual Mapping & Dispatching
    const activeTool = geometryStore.activeToolType || '*';
    const padding = gestureStore.calibration.workspacePadding;
    
    // Process intent
    const intent = mapper.process(state, features, activeTool, timestamp, padding);
    
    // Update store for HUD & Virtual Cursor
    const confidence = detection.handedness.score || 0;
    const rawPinchDistance = features?.pinchDistance;
    gestureStore.updateState(state, confidence, rawPinchDistance);
    
    // Compute exact screen coordinates
    if (features) {
      let px = features.pointerPosition.x;
      let py = features.pointerPosition.y;
      const { x: pxPad, y: pyPad } = padding;
      px = Math.max(0, Math.min(1, (px - pxPad) / (1 - 2 * pxPad)));
      py = Math.max(0, Math.min(1, (py - pyPad) / (1 - 2 * pyPad)));
      
      gestureStore.cursorX = px * window.innerWidth;
      gestureStore.cursorY = py * window.innerHeight;
      
      // Dispatch DOM events! This replaces manual interaction.
      domBridge.process(state, gestureStore.cursorX, gestureStore.cursorY);
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
