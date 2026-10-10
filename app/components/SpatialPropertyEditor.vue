<template>
  <div v-if="selectedObj && gestureStore.isEnabled" 
       class="fixed right-6 top-1/2 -translate-y-1/2 z-[80] w-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-2xl rounded-[2rem] p-4 flex flex-col items-center gap-6 border border-white/40 dark:border-slate-700/50 transition-all pointer-events-auto"
  >
    <!-- Header -->
    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mt-2">
      {{ selectedObj.type }}
    </div>

    <!-- Color Swatches -->
    <div class="flex flex-col gap-3 w-full">
      <button 
        v-for="color in colors" 
        :key="color"
        class="w-12 h-12 mx-auto rounded-full shadow-lg transition-transform hover:scale-110 border-2"
        :class="currentColor === color ? 'border-white scale-110 ring-4 ring-blue-400/50' : 'border-transparent'"
        :style="{ backgroundColor: color }"
        @click="updateStyle('color', color)"
      ></button>
    </div>

    <!-- Divider -->
    <div class="w-10 h-px bg-slate-300/50 dark:bg-slate-600/50"></div>

    <!-- Spatial Thickness Slider -->
    <div class="flex flex-col items-center gap-2 w-full">
      <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Size</div>
      
      <div 
        ref="sliderRef"
        class="relative w-12 h-40 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden cursor-pointer touch-none shadow-inner"
        @pointerdown="onSliderPointerDown"
      >
        <!-- Fill -->
        <div 
          class="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full transition-all duration-75"
          :style="{ height: `${thicknessPercent}%` }"
        ></div>
      </div>
      
      <div class="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
        {{ currentThickness }}px
      </div>
    </div>
    
    <!-- Show Label Toggle -->
    <button 
      @click="toggleLabel"
      class="w-12 h-12 rounded-2xl shadow-lg transition-all flex items-center justify-center mb-2"
      :class="showLabel ? 'bg-blue-500 text-white' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'"
    >
      <Icon name="lucide:tag" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import { useGestureStore } from '../stores/gesture';
import { SetStyleCommand, ShowLabelCommand, HideLabelCommand } from '../../core/commands/mutations';

const store = useGeometryStore();
const gestureStore = useGestureStore();

const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#1e293b'];

const selectedObj = computed(() => {
  if (store.selectedIds.size === 0) return null;
  const firstId = Array.from(store.selectedIds)[0];
  if (!firstId) return null;
  return store.objects.get(firstId) || null;
});

const currentColor = computed(() => {
  return (selectedObj.value?.style?.color as string) || '#0000ff';
});

const currentThickness = computed(() => {
  return (selectedObj.value?.style?.strokeWidth as number) || 2;
});

const thicknessPercent = computed(() => {
  const t = currentThickness.value;
  return Math.max(0, Math.min(100, ((t - 1) / 9) * 100));
});

const showLabel = computed(() => {
  return selectedObj.value?.style?.showLabel === true;
});

const updateStyle = (key: string, value: string | number) => {
  if (!selectedObj.value) return;
  const cmd = new SetStyleCommand(selectedObj.value.id, { [key]: value });
  store.executeCommand(cmd);
};

const toggleLabel = () => {
  if (!selectedObj.value) return;
  if (showLabel.value) {
    store.executeCommand(new HideLabelCommand(selectedObj.value.id));
  } else {
    store.executeCommand(new ShowLabelCommand(selectedObj.value.id));
  }
};

// Custom Spatial Slider Logic
const sliderRef = ref<HTMLElement | null>(null);
let isDraggingSlider = false;

const onSliderPointerDown = (e: PointerEvent) => {
  isDraggingSlider = true;
  updateThicknessFromEvent(e);
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDraggingSlider) return;
  updateThicknessFromEvent(e);
};

const onPointerUp = () => {
  isDraggingSlider = false;
};

const updateThicknessFromEvent = (e: PointerEvent) => {
  if (!sliderRef.value || !selectedObj.value) return;
  const rect = sliderRef.value.getBoundingClientRect();
  
  // Calculate percentage from bottom
  const y = e.clientY - rect.top;
  let percent = 1 - (y / rect.height);
  percent = Math.max(0, Math.min(1, percent));
  
  // Map 0-1 to thickness 1-10
  const newThickness = Math.round(1 + percent * 9);
  
  if (newThickness !== currentThickness.value) {
    updateStyle('strokeWidth', newThickness);
  }
};

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
});

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});
</script>
