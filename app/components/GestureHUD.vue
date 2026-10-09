<template>
  <div v-if="gestureStore.showHUD && gestureStore.isEnabled" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border border-slate-200/50 dark:border-slate-700/50 transition-all pointer-events-none">
    
    <!-- State Indicator -->
    <div class="flex items-center gap-2">
      <div 
        class="w-2.5 h-2.5 rounded-full transition-colors"
        :class="stateColorClass"
      ></div>
      <span class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
        {{ gestureStore.currentState }}
      </span>
    </div>
    
    <div class="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
    
    <!-- Active Tool (from geo store) -->
    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
      <Icon name="lucide:pen-tool" class="w-4 h-4" />
      <span class="text-xs font-medium">{{ activeToolName }}</span>
    </div>

    <div class="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>

    <!-- Confidence / Performance -->
    <div class="flex items-center gap-3 text-xs text-slate-500 font-mono">
      <div class="flex items-center gap-1" title="Confidence">
        <Icon name="lucide:target" class="w-3.5 h-3.5" />
        <span>{{ Math.round(gestureStore.confidence * 100) }}%</span>
      </div>
      <div class="flex items-center gap-1" title="FPS / Latency">
        <Icon name="lucide:zap" class="w-3.5 h-3.5" />
        <span>{{ Math.round(gestureStore.fps) }}fps ({{ Math.round(gestureStore.latency) }}ms)</span>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGestureStore } from '../stores/gesture';
import { useGeometryStore } from '../stores/geometry';

const gestureStore = useGestureStore();
const geoStore = useGeometryStore();

const activeToolName = computed(() => {
  return geoStore.activeToolType || 'Select';
});

const stateColorClass = computed(() => {
  switch (gestureStore.currentState) {
    case 'IDLE': return 'bg-slate-400';
    case 'HOVER': return 'bg-blue-400';
    case 'PINCH_START': return 'bg-amber-400';
    case 'PINCH_HOLD': return 'bg-amber-500';
    case 'DRAGGING': return 'bg-green-500';
    case 'PINCH_RELEASE': return 'bg-purple-400';
    case 'SWIPE': return 'bg-rose-500';
    default: return 'bg-slate-400';
  }
});
</script>
