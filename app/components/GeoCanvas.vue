<template>
  <div class="geo-canvas-wrapper relative w-full h-full bg-slate-50 overflow-hidden">
    <!-- JSXGraph Container -->
    <div id="jxgbox" class="jxgbox w-full h-full" />
    
    <!-- View Controls Overlay (Bottom Right) -->
    <div class="absolute bottom-4 right-4 flex gap-2 bg-white/90 backdrop-blur shadow-sm rounded-lg p-1 border border-slate-200">
      <button 
        class="p-2 rounded hover:bg-slate-100 transition-colors tooltip-trigger"
        title="Toggle Grid"
        :class="{ 'text-blue-600 bg-blue-50': store.settings.gridVisible }"
        @click="toggleGrid"
      >
        <Icon name="mdi:grid" class="w-5 h-5" />
      </button>
      <button 
        class="p-2 rounded hover:bg-slate-100 transition-colors tooltip-trigger"
        title="Toggle Axis"
        :class="{ 'text-blue-600 bg-blue-50': store.settings.axisVisible }"
        @click="toggleAxis"
      >
        <Icon name="mdi:axis-arrow" class="w-5 h-5" />
      </button>
      <div class="w-px bg-slate-200 my-1 mx-1" />
      <button 
        class="p-2 rounded hover:bg-slate-100 transition-colors text-slate-700 tooltip-trigger"
        title="Zoom Out"
        @click="() => renderer.zoomOut && renderer.zoomOut()"
      >
        <Icon name="lucide:zoom-out" class="w-5 h-5" />
      </button>
      <button 
        class="p-2 rounded hover:bg-slate-100 transition-colors text-slate-700 tooltip-trigger"
        title="Zoom In"
        @click="() => renderer.zoomIn && renderer.zoomIn()"
      >
        <Icon name="lucide:zoom-in" class="w-5 h-5" />
      </button>
      <button 
        class="p-2 rounded hover:bg-slate-100 transition-colors text-slate-700 tooltip-trigger"
        title="Fit to View"
        @click="fitToView"
      >
        <Icon name="mdi:fit-to-screen" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../assets/css/jsxgraph.css';
import { onMounted, watch } from 'vue';
import { useCanvas } from '../composables/useCanvas';
import { useGeometryStore } from '../stores/geometry';

const store = useGeometryStore();
const { init, renderer } = useCanvas();

onMounted(() => {
  // Initialize the JSXGraph board
  init('jxgbox');

  // Sync initial settings
  renderer.setGridVisible(store.settings.gridVisible);
  renderer.setAxisVisible(store.settings.axisVisible);

  // Listen to zoom events from StatusBar
  window.addEventListener('geostudio:zoom-in', () => {
    // @ts-ignore
    if (renderer.zoomIn) renderer.zoomIn();
  });
  window.addEventListener('geostudio:zoom-out', () => {
    // @ts-ignore
    if (renderer.zoomOut) renderer.zoomOut();
  });
  window.addEventListener('geostudio:zoom-reset', () => {
    // @ts-ignore
    if (renderer.resetZoom) renderer.resetZoom();
  });
});

// Watch for store settings changes to update renderer
watch(() => store.settings.gridVisible, (visible) => {
  renderer.setGridVisible(visible);
});

watch(() => store.settings.axisVisible, (visible) => {
  renderer.setAxisVisible(visible);
});

// Actions
const toggleGrid = () => {
  store.settings.gridVisible = !store.settings.gridVisible;
};

const toggleAxis = () => {
  store.settings.axisVisible = !store.settings.axisVisible;
};

const fitToView = () => {
  renderer.fitToView();
};
</script>

<style scoped>
/* Basic styling for the jsxgraph box if needed, though Tailwind covers most */
.jxgbox {
  /* Prevent default browser behaviors like text selection while dragging */
  user-select: none;
  -webkit-user-select: none;
}
</style>
