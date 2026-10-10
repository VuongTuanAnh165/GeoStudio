import { defineStore } from 'pinia';
import type { GestureState } from '../../core/types/input';

export interface GestureCalibration {
  pinchThreshold: number;
  workspacePadding: { x: number; y: number };
}

const DEFAULT_CALIBRATION: GestureCalibration = {
  pinchThreshold: 0.04,
  workspacePadding: { x: 0.1, y: 0.1 } // 10% padding on each side
};

export const useGestureStore = defineStore('gesture', {
  state: () => ({
    isEnabled: false,
    showCamera: false,
    showHUD: true,
    showCalibration: false,
    currentState: 'IDLE' as GestureState,
    confidence: 0,
    fps: 0,
    latency: 0,
    activeIntentType: 'none',
    calibration: { ...DEFAULT_CALIBRATION } as GestureCalibration,
    rawPinchDistance: 0, // For real-time feedback during calibration
    cursorX: -100,
    cursorY: -100,
    leftCursorX: -100,
    leftCursorY: -100,
    leftHandState: 'IDLE' as GestureState,
    lastDetections: [] as any[],
    isToolDockVisible: false,
  }),
  getters: {
    isGestureActive: (state) => state.isEnabled,
  },
  actions: {
    toggleCamera() {
      this.setCamera(!this.showCamera);
    },
    setCamera(val: boolean) {
      this.showCamera = val;
      this.isEnabled = val;
      if (!val) {
        // Reset all gesture state when camera is turned off
        this.currentState = 'IDLE';
        this.confidence = 0;
        this.fps = 0;
        this.latency = 0;
        this.activeIntentType = 'none';
        this.cursorX = -100;
        this.cursorY = -100;
        this.leftCursorX = -100;
        this.leftCursorY = -100;
        this.leftHandState = 'IDLE';
        this.lastDetections = [];
        this.isToolDockVisible = false;
      }
    },
    updateMetrics(fps: number, latency: number) {
      this.fps = fps;
      this.latency = latency;
    },
    updateState(state: GestureState, confidence: number, rawPinchDistance?: number, leftState: GestureState = 'IDLE') {
      this.currentState = state;
      this.leftHandState = leftState;
      this.confidence = confidence;
      if (rawPinchDistance !== undefined) {
        this.rawPinchDistance = rawPinchDistance;
      }
    },
    saveCalibration(newCalib: Partial<GestureCalibration>) {
      this.calibration = { ...this.calibration, ...newCalib };
      if (typeof window !== 'undefined') {
        localStorage.setItem('geostudio_gesture_calibration', JSON.stringify(this.calibration));
      }
    },
    loadCalibration() {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('geostudio_gesture_calibration');
        if (stored) {
          try {
            this.calibration = { ...DEFAULT_CALIBRATION, ...JSON.parse(stored) };
          } catch (e) {
            console.error('Failed to parse calibration settings');
          }
        }
      }
    }
  }
});
