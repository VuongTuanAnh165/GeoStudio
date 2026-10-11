import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useGeometryStore } from './geometry';
import { ConstructionProtocol } from '../../core/geometry/replay/ConstructionProtocol';
import type { ConstructionStepItem, ReplaySpeed } from '../../core/types/replay';

export const useReplayStore = defineStore('replay', () => {
  const geometryStore = useGeometryStore();

  const isActive = ref(false);
  const isPresentationMode = ref(false);
  const currentStepIndex = ref(0);
  const isPlaying = ref(false);
  const speed = ref<ReplaySpeed>(1);
  const customAnnotations = ref<Record<string, string>>({});

  let playTimer: ReturnType<typeof setTimeout> | null = null;

  // Generate steps from current document objects
  const steps = computed<ConstructionStepItem[]>(() => {
    const objs = Array.from(geometryStore.objects.values());
    const baseSteps = ConstructionProtocol.generateSteps(objs, 'vi');

    // Attach custom annotations if any
    return baseSteps.map(step => {
      const customAnn = customAnnotations.value[step.id];
      if (customAnn !== undefined) {
        return { ...step, annotation: customAnn };
      }
      return step;
    });
  });

  const totalSteps = computed(() => steps.value.length);

  const currentStep = computed(() => {
    if (currentStepIndex.value <= 0 || currentStepIndex.value > steps.value.length) {
      return null;
    }
    const step = steps.value[currentStepIndex.value - 1];
    return step ?? null;
  });

  const visibleObjectIds = computed(() => {
    if (!isActive.value) {
      // In normal mode, all objects in store are considered for normal rendering
      return new Set(geometryStore.objects.keys());
    }
    return ConstructionProtocol.getVisibleObjectIds(steps.value, currentStepIndex.value);
  });

  const activeObjectIds = computed(() => {
    if (!isActive.value) return [];
    return ConstructionProtocol.getActiveObjectIds(steps.value, currentStepIndex.value);
  });

  const clearTimer = () => {
    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
  };

  const scheduleNext = () => {
    clearTimer();
    if (!isPlaying.value) return;

    if (currentStepIndex.value >= totalSteps.value) {
      isPlaying.value = false;
      return;
    }

    const interval = Math.round(1600 / speed.value);
    playTimer = setTimeout(() => {
      if (isPlaying.value) {
        nextStep();
        if (currentStepIndex.value < totalSteps.value) {
          scheduleNext();
        } else {
          isPlaying.value = false;
        }
      }
    }, interval);
  };

  const syncSelectionToCurrentStep = () => {
    const active = activeObjectIds.value;
    const targetId = active.length > 0 && active[0] ? active[0] : null;
    geometryStore.selectObject(targetId);
  };

  const goToStep = (index: number) => {
    const clamped = Math.max(0, Math.min(totalSteps.value, index));
    currentStepIndex.value = clamped;
    syncSelectionToCurrentStep();
  };

  const nextStep = () => {
    if (currentStepIndex.value < totalSteps.value) {
      goToStep(currentStepIndex.value + 1);
    } else {
      isPlaying.value = false;
      clearTimer();
    }
  };

  const prevStep = () => {
    pause();
    if (currentStepIndex.value > 0) {
      goToStep(currentStepIndex.value - 1);
    }
  };

  const firstStep = () => {
    pause();
    goToStep(totalSteps.value > 0 ? 1 : 0);
  };

  const lastStep = () => {
    pause();
    goToStep(totalSteps.value);
  };

  const pause = () => {
    isPlaying.value = false;
    clearTimer();
  };

  const play = () => {
    if (totalSteps.value === 0) return;
    if (currentStepIndex.value >= totalSteps.value) {
      goToStep(1);
    }
    isPlaying.value = true;
    scheduleNext();
  };

  const togglePlay = () => {
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }
  };

  const setSpeed = (s: ReplaySpeed) => {
    speed.value = s;
    if (isPlaying.value) {
      scheduleNext();
    }
  };

  const startReplay = () => {
    isActive.value = true;
    if (currentStepIndex.value === 0) {
      currentStepIndex.value = totalSteps.value;
    }
    syncSelectionToCurrentStep();
  };

  const stopReplay = () => {
    pause();
    isActive.value = false;
    isPresentationMode.value = false;
    geometryStore.selectObject(null);
  };

  const enterPresentation = () => {
    startReplay();
    isPresentationMode.value = true;
    try {
      if (typeof document !== 'undefined' && document.documentElement && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      // Ignore fullscreen permission rejections
    }
  };

  const exitPresentation = () => {
    isPresentationMode.value = false;
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  };

  const togglePresentation = () => {
    if (isPresentationMode.value) {
      exitPresentation();
    } else {
      enterPresentation();
    }
  };

  const setAnnotation = (objId: string, text: string) => {
    customAnnotations.value = {
      ...customAnnotations.value,
      [objId]: text
    };
  };

  // Watch for step changes or speed adjustments during playback
  watch(isPlaying, (val) => {
    if (!val) {
      clearTimer();
    }
  });

  return {
    isActive,
    isPresentationMode,
    currentStepIndex,
    isPlaying,
    speed,
    steps,
    totalSteps,
    currentStep,
    visibleObjectIds,
    activeObjectIds,

    goToStep,
    nextStep,
    prevStep,
    firstStep,
    lastStep,
    play,
    pause,
    togglePlay,
    setSpeed,
    startReplay,
    stopReplay,
    enterPresentation,
    exitPresentation,
    togglePresentation,
    setAnnotation
  };
});
