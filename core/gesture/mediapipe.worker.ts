/**
 * MediaPipe Hand Landmarker Web Worker
 *
 * Runs the MediaPipe Hand Landmarker model in a dedicated Web Worker thread
 * to avoid blocking the main UI thread. Communicates via the structured
 * WorkerMessage / WorkerResponse protocol defined in core/types/input.ts.
 *
 * Architecture:
 *   Main thread  ──WorkerMessage──>  Worker (this file)
 *   Main thread  <──WorkerResponse──  Worker (this file)
 */

import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

import type {
  MediaPipeConfig,
  WorkerMessage,
  WorkerResponse,
  HandDetection,
  NormalizedLandmark,
} from '../types/input';

// ── State ────────────────────────────────────────────────────────────

let handLandmarker: HandLandmarker | null = null;
let isProcessing = false;

// Performance tracking
let framesProcessed = 0;
let totalLatencyMs = 0;
let lastPerfReportTime = 0;
const PERF_REPORT_INTERVAL_MS = 2000; // report every 2 s

// ── Helpers ──────────────────────────────────────────────────────────

function post(msg: WorkerResponse): void {
  self.postMessage(msg);
}

function postError(message: string, code?: string): void {
  post({ type: 'error', message, code });
}

/**
 * Map the raw MediaPipe result into our serialisable HandDetection[].
 * MediaPipe returns separate parallel arrays; we zip them per-hand.
 */
function toHandDetections(result: HandLandmarkerResult): HandDetection[] {
  const detections: HandDetection[] = [];
  const count = result.landmarks?.length ?? 0;

  for (let i = 0; i < count; i++) {
    const landmarks: NormalizedLandmark[] = result.landmarks[i].map(lm => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? undefined,
    }));

    const worldLandmarks: NormalizedLandmark[] = (result.worldLandmarks?.[i] ?? []).map(lm => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? undefined,
    }));

    const rawH = result.handedness?.[i]?.[0];
    const handedness = rawH
      ? {
          categoryName: (rawH.categoryName === 'Left' ? 'Left' : 'Right') as 'Left' | 'Right',
          score: rawH.score ?? 0,
          index: rawH.index ?? i,
          displayName: rawH.displayName ?? rawH.categoryName ?? '',
        }
      : { categoryName: 'Right' as const, score: 0, index: i, displayName: 'Right' };

    detections.push({ landmarks, worldLandmarks, handedness });
  }

  return detections;
}

function maybeSendPerformanceReport(): void {
  const now = performance.now();
  if (now - lastPerfReportTime >= PERF_REPORT_INTERVAL_MS && framesProcessed > 0) {
    const elapsed = (now - lastPerfReportTime) / 1000;
    post({
      type: 'performance',
      fps: Math.round(framesProcessed / elapsed),
      avgLatencyMs: Math.round(totalLatencyMs / framesProcessed),
      framesProcessed,
    });
    // Reset counters
    framesProcessed = 0;
    totalLatencyMs = 0;
    lastPerfReportTime = now;
  }
}

// ── Message Handlers ─────────────────────────────────────────────────

async function handleInit(config: MediaPipeConfig): Promise<void> {
  try {
    // Resolve WASM binaries for the vision task
    const vision = await FilesetResolver.forVisionTasks(config.wasmLoaderPath);

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: config.modelAssetPath,
        delegate: 'GPU',
      },
      numHands: config.numHands,
      minHandDetectionConfidence: config.minHandDetectionConfidence,
      minHandPresenceConfidence: config.minHandPresenceConfidence,
      minTrackingConfidence: config.minTrackingConfidence,
      runningMode: config.runningMode,
    });

    lastPerfReportTime = performance.now();
    post({ type: 'ready' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    postError(`Failed to initialise HandLandmarker: ${message}`, 'INIT_FAILED');
  }
}

function handleProcessFrame(frame: ImageBitmap, timestamp: number): void {
  if (!handLandmarker) {
    postError('HandLandmarker not initialised. Call init first.', 'NOT_INITIALISED');
    return;
  }
  if (isProcessing) {
    // Drop frame – we are still processing the previous one
    return;
  }

  isProcessing = true;
  const startTime = performance.now();

  try {
    const result = handLandmarker.detectForVideo(frame, timestamp);
    const latencyMs = performance.now() - startTime;

    const data = toHandDetections(result);

    post({ type: 'landmarks', data, timestamp, latencyMs });

    // Track performance
    framesProcessed++;
    totalLatencyMs += latencyMs;
    maybeSendPerformanceReport();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    postError(`Frame processing error: ${message}`, 'PROCESS_FAILED');
  } finally {
    isProcessing = false;
    // Close the transferred ImageBitmap to free GPU/CPU memory
    frame.close();
  }
}

async function handleUpdateConfig(config: Partial<MediaPipeConfig>): Promise<void> {
  if (!handLandmarker) {
    postError('HandLandmarker not initialised.', 'NOT_INITIALISED');
    return;
  }

  try {
    const opts: Record<string, unknown> = {};
    if (config.numHands !== undefined) opts.numHands = config.numHands;
    if (config.minHandDetectionConfidence !== undefined) opts.minHandDetectionConfidence = config.minHandDetectionConfidence;
    if (config.minHandPresenceConfidence !== undefined) opts.minHandPresenceConfidence = config.minHandPresenceConfidence;
    if (config.minTrackingConfidence !== undefined) opts.minTrackingConfidence = config.minTrackingConfidence;
    if (config.runningMode !== undefined) opts.runningMode = config.runningMode;

    await handLandmarker.setOptions(opts);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    postError(`Failed to update config: ${message}`, 'CONFIG_UPDATE_FAILED');
  }
}

function handleDestroy(): void {
  if (handLandmarker) {
    handLandmarker.close();
    handLandmarker = null;
  }
  framesProcessed = 0;
  totalLatencyMs = 0;
}

// ── Event Listener ───────────────────────────────────────────────────

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'init':
      handleInit(msg.config);
      break;
    case 'process_frame':
      handleProcessFrame(msg.frame as ImageBitmap, msg.timestamp);
      break;
    case 'update_config':
      handleUpdateConfig(msg.config);
      break;
    case 'destroy':
      handleDestroy();
      break;
    default:
      postError(`Unknown message type: ${(msg as { type: string }).type}`, 'UNKNOWN_MESSAGE');
  }
});
