<template>
  <div 
    v-if="sliders.length > 0"
    class="slider-overlay absolute top-4 left-4 z-20 flex flex-col gap-2.5 max-w-sm pointer-events-auto select-none transition-all"
  >
    <div 
      v-for="slider in sliders" 
      :key="slider.id"
      class="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 p-3.5 transition-all w-80 text-slate-800 dark:text-slate-100"
    >
      <!-- Header: Name, Current Value, and Collapse/Delete -->
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs uppercase shadow-inner">
            {{ getSliderDef(slider).name || 's' }}
          </span>
          <span class="font-mono text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {{ getSliderDef(slider).name }} = {{ getSliderDef(slider).value.toFixed(2) }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <!-- Animation Play / Pause Button -->
          <button 
            class="p-1.5 rounded-lg transition-colors tooltip-trigger"
            :class="isAnimating(slider.id) ? 'bg-amber-500 text-white hover:bg-amber-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'"
            :title="isAnimating(slider.id) ? 'Pause Animation' : 'Play Animation'"
            @click="toggleAnimation(slider.id)"
          >
            <Icon :name="isAnimating(slider.id) ? 'lucide:pause' : 'lucide:play'" class="w-3.5 h-3.5" />
          </button>

          <!-- Collapse / Expand Details -->
          <button 
            class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
            :title="isExpanded(slider.id) ? 'Collapse' : 'Expand'"
            @click="toggleExpanded(slider.id)"
          >
            <Icon :name="isExpanded(slider.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3.5 h-3.5" />
          </button>

          <!-- Delete Slider -->
          <button 
            class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete Slider"
            @click="deleteSlider(slider.id)"
          >
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Main Slider Bar & Exact Input -->
      <div class="flex items-center gap-3">
        <input 
          type="range"
          :min="getSliderDef(slider).min"
          :max="getSliderDef(slider).max"
          :step="getSliderDef(slider).step"
          :value="getSliderDef(slider).value"
          @input="onRangeChange(slider.id, $event)"
          class="flex-1 accent-blue-600 dark:accent-blue-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
        />
        
        <!-- Exact Value Input Box -->
        <input 
          type="number"
          :min="getSliderDef(slider).min"
          :max="getSliderDef(slider).max"
          :step="getSliderDef(slider).step"
          :value="getSliderDef(slider).value"
          @change="onNumberInput(slider.id, $event)"
          class="w-16 px-1.5 py-0.5 text-xs font-mono font-medium text-right bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Min and Max Labels -->
      <div class="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 px-0.5">
        <span>min: {{ getSliderDef(slider).min }}</span>
        <span>step: {{ getSliderDef(slider).step }}</span>
        <span>max: {{ getSliderDef(slider).max }}</span>
      </div>

      <!-- Expanded Settings & Animation Controls -->
      <div v-if="isExpanded(slider.id)" class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-slate-400 font-medium">Animation Mode:</span>
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <button 
              class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
              :class="getAnimMode(slider.id) === 'bounce' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'"
              @click="setAnimMode(slider.id, 'bounce')"
            >
              Bounce ⇄
            </button>
            <button 
              class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
              :class="getAnimMode(slider.id) === 'loop' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'"
              @click="setAnimMode(slider.id, 'loop')"
            >
              Loop ↻
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-slate-400 font-medium">Speed:</span>
          <div class="flex items-center gap-1">
            <button 
              v-for="s in [0.5, 1, 2, 5]" 
              :key="s"
              class="px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors"
              :class="getAnimSpeed(slider.id) === s ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
              @click="setAnimSpeed(slider.id, s)"
            >
              {{ s }}x
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import { UpdateSliderValueCommand } from '../../core/commands/mutations';
import { DeleteObjectCommand } from '../../core/commands/deletions';
import type { GeometryObject } from '../../core/types/geometry';
import type { SliderDef } from '../../core/geometry/primitives/2d';

const store = useGeometryStore();

const sliders = computed(() => {
  return Array.from(store.objects.values()).filter(obj => obj.type === 'slider');
});

const getSliderDef = (obj: GeometryObject): SliderDef => {
  return obj.definition as SliderDef;
};

// UI Expansion State
const expandedMap = ref<Record<string, boolean>>({});
const isExpanded = (id: string) => !!expandedMap.value[id];
const toggleExpanded = (id: string) => {
  expandedMap.value[id] = !expandedMap.value[id];
};

// Animation State
interface SliderAnimState {
  playing: boolean;
  mode: 'bounce' | 'loop';
  speed: number;
  direction: 1 | -1;
  rafId?: number;
  lastTimestamp?: number;
}

const animStates = ref<Record<string, SliderAnimState>>({});

const getAnimState = (id: string): SliderAnimState => {
  if (!animStates.value[id]) {
    animStates.value[id] = {
      playing: false,
      mode: 'bounce',
      speed: 1,
      direction: 1
    };
  }
  return animStates.value[id]!;
};

const isAnimating = (id: string) => !!getAnimState(id).playing;
const getAnimMode = (id: string) => getAnimState(id).mode;
const getAnimSpeed = (id: string) => getAnimState(id).speed;

const setAnimMode = (id: string, mode: 'bounce' | 'loop') => {
  getAnimState(id).mode = mode;
};

const setAnimSpeed = (id: string, speed: number) => {
  getAnimState(id).speed = speed;
};

const stopAnimation = (id: string) => {
  const state = getAnimState(id);
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = undefined;
  }
  state.playing = false;
  state.lastTimestamp = undefined;
};

const startAnimation = (id: string) => {
  const state = getAnimState(id);
  state.playing = true;
  state.lastTimestamp = undefined;

  const step = (timestamp: number) => {
    if (!state.playing) return;

    if (!state.lastTimestamp) {
      state.lastTimestamp = timestamp;
    }
    const deltaMs = timestamp - state.lastTimestamp;
    state.lastTimestamp = timestamp;

    const sliderObj = store.objects.get(id);
    if (!sliderObj || sliderObj.type !== 'slider') {
      stopAnimation(id);
      return;
    }

    const def = sliderObj.definition as SliderDef;
    const range = def.max - def.min;
    if (range <= 0) {
      stopAnimation(id);
      return;
    }

    // Normal traversal: across full range in ~4 seconds at 1x speed
    const stepIncrement = (range / 4000) * deltaMs * state.speed * state.direction;
    let nextVal = def.value + stepIncrement;

    if (state.mode === 'bounce') {
      if (nextVal >= def.max) {
        nextVal = def.max;
        state.direction = -1;
      } else if (nextVal <= def.min) {
        nextVal = def.min;
        state.direction = 1;
      }
    } else {
      // Loop
      if (nextVal >= def.max) {
        nextVal = def.min;
      } else if (nextVal <= def.min) {
        nextVal = def.max;
      }
    }

    // Update slider value in store
    store.executeCommand(new UpdateSliderValueCommand(id, nextVal));

    state.rafId = requestAnimationFrame(step);
  };

  state.rafId = requestAnimationFrame(step);
};

const toggleAnimation = (id: string) => {
  if (isAnimating(id)) {
    stopAnimation(id);
  } else {
    startAnimation(id);
  }
};

const onRangeChange = (id: string, event: Event) => {
  const val = parseFloat((event.target as HTMLInputElement).value);
  if (!isNaN(val)) {
    store.executeCommand(new UpdateSliderValueCommand(id, val));
  }
};

const onNumberInput = (id: string, event: Event) => {
  const val = parseFloat((event.target as HTMLInputElement).value);
  if (!isNaN(val)) {
    store.executeCommand(new UpdateSliderValueCommand(id, val));
  }
};

const deleteSlider = (id: string) => {
  stopAnimation(id);
  store.executeCommand(new DeleteObjectCommand(id, true));
};

onUnmounted(() => {
  // Cleanup all running animation frames
  Object.keys(animStates.value).forEach(id => {
    stopAnimation(id);
  });
});
</script>

<style scoped>
/* Slider custom track styling */
input[type="range"]::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #2563eb;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>
