<template>
  <div 
    class="fixed left-1/2 -translate-x-1/2 z-[90] w-[90vw] max-w-4xl transition-all duration-500 ease-spring"
    :class="gestureStore.isToolDockVisible && gestureStore.isGestureActive ? 'bottom-8 opacity-100' : '-bottom-32 opacity-0 pointer-events-none'"
  >
    <div class="flex items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/50 overflow-x-auto no-scrollbar">
      
      <!-- Tool Buttons -->
      <button 
        v-for="tool in tools" 
        :key="tool.id"
        @click="selectTool(tool.id)"
        class="relative w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300"
        :class="store.activeToolType === tool.id ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:scale-105'"
      >
        <Icon :name="tool.icon" class="w-8 h-8 mb-1" />
        <span class="text-[10px] font-semibold">{{ $t(`tools.${tool.id}`, tool.label) }}</span>
        
        <!-- Active Indicator -->
        <div v-if="store.activeToolType === tool.id" class="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)]"></div>
      </button>

      <!-- Divider -->
      <div class="w-px h-12 bg-slate-300/50 dark:bg-slate-600/50 mx-2"></div>

      <!-- Undo / Redo -->
      <button 
        @click="store.undo()"
        :disabled="!store.canUndo"
        class="w-16 h-16 rounded-2xl flex flex-col items-center justify-center bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:scale-105 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-white/60"
      >
        <Icon name="lucide:undo-2" class="w-8 h-8" />
      </button>
      <button 
        @click="store.redo()"
        :disabled="!store.canRedo"
        class="w-16 h-16 rounded-2xl flex flex-col items-center justify-center bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:scale-105 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-white/60"
      >
        <Icon name="lucide:redo-2" class="w-8 h-8" />
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useGeometryStore } from '../stores/geometry';
import { useGestureStore } from '../stores/gesture';

const store = useGeometryStore();
const gestureStore = useGestureStore();

const tools = [
  { id: 'select', icon: 'lucide:mouse-pointer-2', label: 'Select' },
  { id: 'point', icon: 'lucide:circle-dot', label: 'Point' },
  { id: 'segment', icon: 'lucide:minus', label: 'Segment' },
  { id: 'line', icon: 'lucide:move-horizontal', label: 'Line' },
  { id: 'ray', icon: 'lucide:arrow-right', label: 'Ray' },
  { id: 'circle', icon: 'lucide:circle', label: 'Circle' },
  { id: 'triangle', icon: 'lucide:triangle', label: 'Triangle' },
  { id: 'polygon', icon: 'lucide:hexagon', label: 'Polygon' },
  { id: 'measure_distance', icon: 'lucide:ruler', label: 'Distance' },
  { id: 'measure_angle', icon: 'lucide:angle', label: 'Angle' },
  { id: 'text', icon: 'lucide:type', label: 'Text' },
  { id: 'delete', icon: 'lucide:eraser', label: 'Delete' },
];

const selectTool = (toolId: string) => {
  store.activeToolType = toolId;
  // Automatically hide the dock after selection to keep workspace clean
  // We can let the user naturally hide it by lifting their left hand.
};
</script>

<style scoped>
.ease-spring {
  transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
