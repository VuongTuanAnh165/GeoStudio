<template>
  <div class="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col w-16 shrink-0 z-10 transition-colors shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
    <div class="flex-1 overflow-y-auto overflow-x-visible py-4 flex flex-col items-center gap-3 scrollbar-hide">
      
      <!-- Basic Tools -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:mouse-pointer-2" 
          label="Select & Move" 
          shortcut="V"
          :active="store.activeToolType === 'select'"
          @click="selectTool('select')" 
        />
        <ToolButton 
          icon="lucide:eraser" 
          label="Delete Object" 
          shortcut="Del"
          :active="store.activeToolType === 'delete'"
          @click="selectTool('delete')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Creation Tools -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:circle-dot" 
          label="Point" 
          shortcut="P"
          :active="store.activeToolType === 'point'"
          @click="selectTool('point')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Lines -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:minus" 
          label="Segment" 
          shortcut="S"
          :active="store.activeToolType === 'segment'"
          @click="selectTool('segment')" 
        />
        <ToolButton 
          icon="lucide:move-horizontal" 
          label="Line" 
          shortcut="L"
          :active="store.activeToolType === 'line'"
          @click="selectTool('line')" 
        />
        <ToolButton 
          icon="lucide:arrow-right" 
          label="Ray" 
          shortcut="R"
          :active="store.activeToolType === 'ray'"
          @click="selectTool('ray')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Curves -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:circle" 
          label="Circle" 
          shortcut="C"
          :active="store.activeToolType === 'circle'"
          @click="selectTool('circle')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Polygons -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:triangle" 
          label="Triangle" 
          shortcut="T"
          :active="store.activeToolType === 'triangle'"
          @click="selectTool('triangle')" 
        />
        <ToolButton 
          icon="lucide:hexagon" 
          label="Polygon" 
          shortcut="G"
          :active="store.activeToolType === 'polygon'"
          @click="selectTool('polygon')" 
        />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import ToolButton from './ToolButton.vue';

const store = useGeometryStore();

const selectTool = (tool: string) => {
  store.activeToolType = tool;
};

// Global shortcuts listener
const handleKeyDown = (e: KeyboardEvent) => {
  // Don't trigger if user is typing in an input
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  const key = e.key.toLowerCase();
  
  switch (key) {
    case 'v': selectTool('select'); break;
    case 'p': selectTool('point'); break;
    case 's': selectTool('segment'); break;
    case 'l': selectTool('line'); break;
    case 'r': selectTool('ray'); break;
    case 'c': selectTool('circle'); break;
    case 't': selectTool('triangle'); break;
    case 'g': selectTool('polygon'); break;
    case 'delete':
    case 'backspace': 
      // If we already have selected objects, deleting them is an action. 
      // But activating the delete tool is another option.
      selectTool('delete'); 
      break;
    case 'escape': 
      // Cancel tool or select
      selectTool('select'); 
      store.selectedIds.clear(); 
      break;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* Hide scrollbar for clean UI */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
