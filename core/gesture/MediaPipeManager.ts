/**
 * MediaPipeManager – Main-thread orchestrator for the Hand Landmarker Web Worker.
 *
 * Responsibilities:
 *   1. Spawn / destroy the Web Worker (or run inline fallback if Workers unavailable).
 *   2. Forward video frames to the worker via transferable ImageBitmaps.
 *   3. Expose an event-based API for consumers (onLandmarks, onError, onPerformance).
 *   4. Provide start / stop / destroy lifecycle management.
 *
 * Usage:
 *   const mgr = new MediaPipeManager();
 *   mgr.onLandmarks = (data, ts) => { ... };
 *   await mgr.init(videoElement);
 *   mgr.start();
 *   // later …
 *   mgr.stop();
 *   mgr.destroy();
 */

import type {
  MediaPipeConfig,
  WorkerMessage,
  WorkerResponse,
  HandDetection,
} from '../types/input';

// ── Default Configuration ────────────────────────────────────────────

const DEFAULT_CONFIG: MediaPipeConfig = {
  wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm',
  modelAssetPath: '/models/hand_landmarker.task',
  numHands: 1,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  runningMode: 'VIDEO',
};

// ── Types ────────────────────────────────────────────────────────────

export interface PerformanceMetrics {
  fps: number;
  avgLatencyMs: number;
  framesProcessed: number;
}

export type LandmarksCallback = (data: HandDetection[], timestamp: number, latencyMs: number) => void;
export type ErrorCallback = (message: string, code?: string) => void;
export type PerformanceCallback = (metrics: PerformanceMetrics) => void;
export type ReadyCallback = () => void;

// ── Manager Class ────────────────────────────────────────────────────

export class MediaPipeManager {
  private worker: Worker | null = null;
  private video: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private running = false;
  private ready = false;
  private destroyed = false;
  private config: MediaPipeConfig;
  private useWorker = true;

  // Fallback: inline HandLandmarker when Web Workers unavailable
  private inlineLandmarker: unknown = null;

  // ── Public Event Callbacks ───────────────────────────────────────

  onLandmarks: LandmarksCallback | null = null;
  onError: ErrorCallback | null = null;
  onPerformance: PerformanceCallback | null = null;
  onReady: ReadyCallback | null = null;

  constructor(config?: Partial<MediaPipeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Detect Web Worker support
    if (typeof Worker === 'undefined') {
      this.useWorker = false;
      console.warn('[MediaPipeManager] Web Workers not available — using main-thread fallback.');
    }
  }

  // ── Public API ───────────────────────────────────────────────────

  /**
   * Initialise the Hand Landmarker.
   * Must be called before start(). Resolves when the model is loaded.
   */
  async init(videoElement?: HTMLVideoElement): Promise<void> {
    if (this.destroyed) throw new Error('MediaPipeManager has been destroyed.');
    if (this.ready) return; // already initialised

    if (videoElement) {
      this.video = videoElement;
    }

    if (this.useWorker) {
      await this.initWorker();
    } else {
      await this.initInline();
    }
  }

  /**
   * Begin processing video frames in a requestAnimationFrame loop.
   * Requires a video element to be attached (via init or setVideoElement).
   */
  start(): void {
    if (this.destroyed) throw new Error('MediaPipeManager has been destroyed.');
    if (!this.ready) {
      console.warn('[MediaPipeManager] Not ready yet. Call init() first.');
      return;
    }
    if (this.running) return;

    this.running = true;
    this.processLoop();
  }

  /** Pause frame processing (can be resumed with start()). */
  stop(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /** Permanently tear down the worker and release all resources. */
  destroy(): void {
    this.stop();
    this.destroyed = true;
    this.ready = false;

    if (this.worker) {
      const msg: WorkerMessage = { type: 'destroy' };
      this.worker.postMessage(msg);
      this.worker.terminate();
      this.worker = null;
    }

    if (this.inlineLandmarker) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.inlineLandmarker as any).close?.();
      } catch { /* ignore */ }
      this.inlineLandmarker = null;
    }

    this.video = null;
    this.onLandmarks = null;
    this.onError = null;
    this.onPerformance = null;
    this.onReady = null;
  }

  /** Attach or swap the video source element. */
  setVideoElement(el: HTMLVideoElement): void {
    this.video = el;
  }

  /** Update HandLandmarker configuration at runtime. */
  async updateConfig(config: Partial<MediaPipeConfig>): Promise<void> {
    Object.assign(this.config, config);

    if (this.worker) {
      const msg: WorkerMessage = { type: 'update_config', config };
      this.worker.postMessage(msg);
    } else if (this.inlineLandmarker) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.inlineLandmarker as any).setOptions?.(config);
      } catch (err) {
        this.onError?.(`Config update failed: ${err}`, 'CONFIG_UPDATE_FAILED');
      }
    }
  }

  /** Whether the manager is currently processing frames. */
  get isRunning(): boolean { return this.running; }

  /** Whether the HandLandmarker is loaded and ready. */
  get isReady(): boolean { return this.ready; }

  // ── Worker Initialisation ────────────────────────────────────────

  private initWorker(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Nuxt / Vite handles `?worker` imports at build time.
        // We use the raw `new Worker(new URL(...))` pattern for universal compat.
        this.worker = new Worker(
          new URL('./mediapipe.worker.ts', import.meta.url),
          { type: 'module' }
        );

        const timeoutId = setTimeout(() => {
          reject(new Error('HandLandmarker init timed out (30 s).'));
        }, 30_000);

        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const msg = event.data;

          switch (msg.type) {
            case 'ready':
              clearTimeout(timeoutId);
              this.ready = true;
              this.onReady?.();
              resolve();
              // Re-attach the normal message handler
              this.worker!.onmessage = this.handleWorkerMessage.bind(this);
              break;
            case 'error':
              clearTimeout(timeoutId);
              this.onError?.(msg.message, msg.code);
              reject(new Error(msg.message));
              break;
          }
        };

        this.worker.onerror = (err) => {
          clearTimeout(timeoutId);
          const message = err.message || 'Worker error';
          this.onError?.(message, 'WORKER_ERROR');
          reject(new Error(message));
        };

        // Send init message
        const initMsg: WorkerMessage = { type: 'init', config: this.config };
        this.worker.postMessage(initMsg);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        reject(new Error(`Failed to spawn worker: ${message}`));
      }
    });
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const msg = event.data;

    switch (msg.type) {
      case 'landmarks':
        this.onLandmarks?.(msg.data, msg.timestamp, msg.latencyMs);
        break;
      case 'error':
        this.onError?.(msg.message, msg.code);
        break;
      case 'performance':
        this.onPerformance?.({
          fps: msg.fps,
          avgLatencyMs: msg.avgLatencyMs,
          framesProcessed: msg.framesProcessed,
        });
        break;
      case 'ready':
        // May fire again after re-init
        this.ready = true;
        this.onReady?.();
        break;
    }
  }

  // ── Inline Fallback (no Web Worker) ──────────────────────────────

  private async initInline(): Promise<void> {
    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(this.config.wasmLoaderPath);

      this.inlineLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.config.modelAssetPath,
          delegate: 'GPU',
        },
        numHands: this.config.numHands,
        minHandDetectionConfidence: this.config.minHandDetectionConfidence,
        minHandPresenceConfidence: this.config.minHandPresenceConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
        runningMode: this.config.runningMode,
      });

      this.ready = true;
      this.onReady?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.onError?.(`Inline init failed: ${message}`, 'INIT_FAILED');
      throw err;
    }
  }

  // ── Frame Processing Loop ────────────────────────────────────────

  private processLoop(): void {
    if (!this.running || this.destroyed) return;

    this.animFrameId = requestAnimationFrame(() => {
      this.captureAndSendFrame();
      this.processLoop();
    });
  }

  private async captureAndSendFrame(): Promise<void> {
    if (!this.video) return;
    // Skip if video not playing or has no data
    if (this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) return;

    const timestamp = performance.now();

    if (this.worker) {
      // Worker path: transfer an ImageBitmap (zero-copy)
      try {
        const bitmap = await createImageBitmap(this.video);
        const msg: WorkerMessage = { type: 'process_frame', frame: bitmap, timestamp };
        this.worker.postMessage(msg, [bitmap]); // transfer ownership
      } catch {
        // createImageBitmap can fail if video element is in an invalid state; silently skip
      }
    } else if (this.inlineLandmarker) {
      // Inline fallback: process directly on main thread
      const start = performance.now();
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const landmarker = this.inlineLandmarker as any;
        const result = landmarker.detectForVideo(this.video, timestamp);
        const latencyMs = performance.now() - start;

        if (result?.landmarks?.length) {
          const detections: HandDetection[] = [];
          for (let i = 0; i < result.landmarks.length; i++) {
            detections.push({
              landmarks: result.landmarks[i],
              worldLandmarks: result.worldLandmarks?.[i] ?? [],
              handedness: result.handedness?.[i]?.[0] ?? { categoryName: 'Right', score: 0, index: i, displayName: 'Right' },
            });
          }
          this.onLandmarks?.(detections, timestamp, latencyMs);
        }
      } catch {
        // Skip frame on error
      }
    }
  }
}
