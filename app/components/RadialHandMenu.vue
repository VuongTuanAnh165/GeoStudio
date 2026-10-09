<template>
  <div 
    v-if="gestureStore.isEnabled && isLeftHandOpen"
    class="radial-menu fixed z-[9990] w-64 h-64 rounded-full pointer-events-none transition-all duration-300"
    :style="menuStyle"
  >
    <!-- Background Blur -->
    <div class="absolute inset-0 rounded-full bg-slate-900/30 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center">
      <div class="w-24 h-24 rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
    </div>
    
    <!-- Center Info -->
    <div class="absolute inset-0 flex items-center justify-center flex-col">
      <Icon name="lucide:hand" class="w-6 h-6 text-white mb-1 opacity-70" />
      <span class="text-white text-xs font-medium">Tools</span>
    </div>

    <!-- Radial Items -->
    <div 
      v-for="(tool, index) in tools" 
      :key="tool.id"
      class="absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center transition-all duration-200"
      :class="geometryStore.activeToolType === tool.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110' : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200'"
      :style="getItemStyle(index, tools.length)"
    >
      <!-- We use a hidden button to allow the GestureDOMBridge to click it -->
      <button 
        class="w-full h-full rounded-full flex items-center justify-center pointer-events-auto"
        @click="selectTool(tool.id)"
      >
        <Icon :name="tool.icon" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGestureStore } from '../stores/gesture';
import { useGeometryStore } from '../stores/geometry';

const gestureStore = useGestureStore();
const geometryStore = useGeometryStore();

// Left hand open condition
const isLeftHandOpen = computed(() => {
  // We'll map left hand state when we update the StateMachine. 
  // For now, if we detect two hands and one is Open Palm.
  // We will assume gestureStore will have `leftHandState` soon.
  return gestureStore.leftHandState === 'OPEN_PALM';
});

const menuStyle = computed(() => ({
  left: `${gestureStore.leftCursorX}px`,
  top: `${gestureStore.leftCursorY}px`,
  transform: 'translate(-50%, -50%) scale(1)',
  opacity: isLeftHandOpen.value ? 1 : 0
}));

const tools = [
  { id: 'point', icon: 'lucide:dot' },
  { id: 'segment', icon: 'lucide:minus' },
  { id: 'line', icon: 'lucide:git-commit' },
  { id: 'circle', icon: 'lucide:circle' },
  { id: 'polygon', icon: 'lucide:pentagon' },
  { id: 'delete', icon: 'lucide:trash-2' },
];

const getItemStyle = (index: number, total: number) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2; // Start from top (-90deg)
  const radius = 100; // Radius of the circle
  const x = Math.cos(angle) * radius + 128; // 128 is half of 256 (64*4) w-64
  const y = Math.sin(angle) * radius + 128;
  return {
    left: `${x}px`,
    top: `${y}px`,
  };
};

const selectTool = (id: string) => {
  geometryStore.activeToolType = id;
};
</script>
