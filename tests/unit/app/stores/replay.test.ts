import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGeometryStore } from '../../../../app/stores/geometry';
import { useReplayStore } from '../../../../app/stores/replay';
import type { GeometryObject } from '../../../../core/types/geometry';

describe('useReplayStore', () => {
  let geometryStore: ReturnType<typeof useGeometryStore>;
  let replayStore: ReturnType<typeof useReplayStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    geometryStore = useGeometryStore();
    replayStore = useReplayStore();

    const p1: GeometryObject = {
      id: 'p1',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: { x: 0, y: 0 } },
      metadata: { label: 'A' }
    };
    const p2: GeometryObject = {
      id: 'p2',
      type: 'point',
      dimension: 2,
      definition: { kind: 'point', coords: { x: 3, y: 4 } },
      metadata: { label: 'B' }
    };
    const s1: GeometryObject = {
      id: 's1',
      type: 'segment',
      dimension: 2,
      parents: ['p1', 'p2'],
      definition: { kind: 'segment', point1: 'p1', point2: 'p2' },
      metadata: { label: 'AB' }
    };

    geometryStore.objects.set('p1', p1);
    geometryStore.objects.set('p2', p2);
    geometryStore.objects.set('s1', s1);
  });

  it('should initialize with correct total steps from objects', () => {
    expect(replayStore.totalSteps).toBe(3);
    expect(replayStore.steps.length).toBe(3);
    expect(replayStore.isActive).toBe(false);
  });

  it('should activate replay and set step index', () => {
    replayStore.startReplay();
    expect(replayStore.isActive).toBe(true);
    expect(replayStore.currentStepIndex).toBe(3);

    replayStore.goToStep(1);
    expect(replayStore.currentStepIndex).toBe(1);
    expect(replayStore.visibleObjectIds.has('p1')).toBe(true);
    expect(replayStore.visibleObjectIds.has('p2')).toBe(false);
    expect(replayStore.visibleObjectIds.has('s1')).toBe(false);
  });

  it('should navigate through steps', () => {
    replayStore.startReplay();
    replayStore.firstStep();
    expect(replayStore.currentStepIndex).toBe(1);

    replayStore.nextStep();
    expect(replayStore.currentStepIndex).toBe(2);
    expect(replayStore.visibleObjectIds.has('p2')).toBe(true);

    replayStore.prevStep();
    expect(replayStore.currentStepIndex).toBe(1);

    replayStore.lastStep();
    expect(replayStore.currentStepIndex).toBe(3);
    expect(replayStore.visibleObjectIds.size).toBe(3);
  });

  it('should toggle play and pause', () => {
    vi.useFakeTimers();

    replayStore.startReplay();
    replayStore.goToStep(1);

    replayStore.togglePlay();
    expect(replayStore.isPlaying).toBe(true);

    // Advance timer at speed 1x (1600ms)
    vi.advanceTimersByTime(1600);
    expect(replayStore.currentStepIndex).toBe(2);

    vi.advanceTimersByTime(1600);
    expect(replayStore.currentStepIndex).toBe(3);
    expect(replayStore.isPlaying).toBe(false); // Reached end

    vi.useRealTimers();
  });

  it('should adjust playback speed', () => {
    replayStore.setSpeed(2);
    expect(replayStore.speed).toBe(2);
  });

  it('should handle presentation mode entry and exit', () => {
    replayStore.enterPresentation();
    expect(replayStore.isPresentationMode).toBe(true);
    expect(replayStore.isActive).toBe(true);

    replayStore.exitPresentation();
    expect(replayStore.isPresentationMode).toBe(false);
  });

  it('should set custom step annotation', () => {
    replayStore.setAnnotation('s1', 'Chú ý: Đoạn thẳng AB có độ dài 5');
    const step3 = replayStore.steps.find(s => s.id === 's1');
    expect(step3?.annotation).toBe('Chú ý: Đoạn thẳng AB có độ dài 5');
  });
});
