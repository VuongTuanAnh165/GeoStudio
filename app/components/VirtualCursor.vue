<template>
  <div 
    v-if="gestureStore.isEnabled && gestureStore.cursorX >= 0"
    class="virtual-cursor pointer-events-none fixed z-[99999] rounded-full border-2 flex items-center justify-center transition-all duration-75"
    :class="cursorClasses"
    :style="cursorStyle"
  >
    <div class="inner-dot rounded-full transition-all duration-150" :class="innerClasses"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGestureStore } from '../stores/gesture';

const gestureStore = useGestureStore();

const cursorStyle = computed(() => ({
  left: `${gestureStore.cursorX}px`,
  top: `${gestureStore.cursorY}px`,
  transform: 'translate(-50%, -50%)',
}));

const cursorClasses = computed(() => {
  switch (gestureStore.currentState) {
    case 'PINCH_START':
    case 'PINCH_HOLD':
    case 'DRAGGING':
      return 'w-8 h-8 border-blue-600 bg-blue-100/50 shadow-lg scale-90';
    case 'HOVER':
    case 'IDLE':
    default:
      return 'w-12 h-12 border-blue-400 bg-transparent shadow-md scale-100';
  }
});

const innerClasses = computed(() => {
  switch (gestureStore.currentState) {
    case 'PINCH_START':
    case 'PINCH_HOLD':
    case 'DRAGGING':
      return 'w-3 h-3 bg-blue-600';
    case 'HOVER':
    case 'IDLE':
    default:
      return 'w-1 h-1 bg-blue-400';
  }
});
</script>

<style scoped>
.virtual-cursor {
  will-change: left, top, transform;
  /* Disable pointer events so document.elementFromPoint can see through it */
  pointer-events: none !important;
}
</style>
