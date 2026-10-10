<template>
  <div 
    class="geo-canvas-wrapper relative w-full h-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- JSXGraph Container -->
    <div id="jxgbox" class="jxgbox w-full h-full" />
    
    <!-- Custom Overlay for Snap and Measurement Indicators -->
    <CanvasOverlay :snap-result="currentSnapResult" :renderer="renderer" />

    <!-- View Controls Overlay (Bottom Right) -->
    <div class="absolute bottom-6 right-6 flex gap-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-lg shadow-black/5 rounded-2xl p-1.5 border border-slate-200/50 dark:border-slate-700/50 transition-colors">
      <button 
        class="p-2 rounded transition-colors tooltip-trigger"
        title="Toggle Grid"
        :class="store.settings.gridVisible ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'"
        @click="toggleGrid"
      >
        <Icon name="mdi:grid" class="w-5 h-5" />
      </button>
      <button 
        class="p-2 rounded transition-colors tooltip-trigger"
        title="Toggle Axis"
        :class="store.settings.axisVisible ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'"
        @click="toggleAxis"
      >
        <Icon name="mdi:axis-arrow" class="w-5 h-5" />
      </button>
      <div class="w-px bg-slate-200 dark:bg-slate-700 my-1 mx-1" />
      <button 
        class="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 tooltip-trigger"
        title="Zoom Out"
        @click="() => renderer.zoomOut && renderer.zoomOut()"
      >
        <Icon name="lucide:zoom-out" class="w-5 h-5" />
      </button>
      <button 
        class="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 tooltip-trigger"
        title="Zoom In"
        @click="() => renderer.zoomIn && renderer.zoomIn()"
      >
        <Icon name="lucide:zoom-in" class="w-5 h-5" />
      </button>
      <button 
        class="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 tooltip-trigger"
        title="Fit to View"
        @click="fitToView"
      >
        <Icon name="mdi:fit-to-screen" class="w-5 h-5" />
      </button>
    </div>

    <ContextMenu v-if="!gestureStore.isGestureActive" />
    <SpatialRadialMenu v-else />
  </div>
</template>

<script setup lang="ts">
import '../assets/css/jsxgraph.css';
import { onMounted, watch } from 'vue';
import { useCanvas } from '../composables/useCanvas';
import { useGeometryStore } from '../stores/geometry';
import { useGestureStore } from '../stores/gesture';
import { useContextMenu } from '../composables/useContextMenu';
import ContextMenu from './ContextMenu.vue';
import SpatialRadialMenu from './SpatialRadialMenu.vue';
import CanvasOverlay from './CanvasOverlay.vue';

const store = useGeometryStore();
const gestureStore = useGestureStore();
const { init, renderer, currentSnapResult } = useCanvas();
const { showMenu } = useContextMenu();

// Handle right click manually since JSXGraph doesn't expose it nicely
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  
  let targetObject = null;
  // Get math pos and check hit
  // We can ask renderer to hitTest
  if (renderer && typeof renderer.getMathPositionFromEvent === 'function') {
    // @ts-ignore
    const mathPos = renderer.getMathPositionFromEvent(e);
    // @ts-ignore
    const screenPos = renderer.getScreenPosition(mathPos);
    // @ts-ignore
    const hitId = renderer.hitTest(screenPos);
    
    if (hitId) {
      targetObject = store.objects.get(hitId) || null;
    }
  }

  showMenu(e.clientX, e.clientY, targetObject);
};

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
  window.addEventListener('geostudio:pan', (e: any) => {
    if (renderer.pan && e.detail) {
      renderer.pan(e.detail.dx, e.detail.dy);
    }
  });
  window.addEventListener('geostudio:zoom-reset', () => {
    // @ts-ignore
    if (renderer.resetZoom) renderer.resetZoom();
  });
  window.addEventListener('geostudio:zoom-fit', () => {
    fitToView();
  });
  
  // Listen to context menu from MouseHandler (handles touch long-press & right clicks)
  window.addEventListener('geostudio:context-menu', ((e: CustomEvent) => {
    const { clientX, clientY, hitId } = e.detail;
    const targetObject = hitId ? store.objects.get(hitId) || null : null;
    showMenu(clientX, clientY, targetObject);
  }) as EventListener);
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
