<template>
  <div 
    v-if="gestureStore.isEnabled && gestureStore.cursorX >= 0"
    class="virtual-cursor pointer-events-none fixed z-[99999] rounded-full border-2 flex items-center justify-center transition-all duration-75"
    :class="cursorClasses"
    :style="cursorStyle"
  >
    <div class="inner-dot rounded-full transition-all duration-150" :class="innerClasses"></div>
    
    <!-- Ripple Effects -->
    <div 
      v-for="ripple in ripples" 
      :key="ripple.id"
      class="absolute w-full h-full rounded-full border-2 border-blue-400 animate-ping-once"
      :class="ripple.type === 'long' ? 'border-orange-400 border-4' : 'border-blue-400'"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
    case 'PINCH_HOLD_LONG':
      return 'w-8 h-8 border-orange-500 bg-orange-100/50 shadow-lg scale-110';
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
    case 'PINCH_HOLD_LONG':
      return 'w-4 h-4 bg-orange-500';
    case 'HOVER':
    case 'IDLE':
    default:
      return 'w-1 h-1 bg-blue-400';
  }
});

// Ripples logic
interface Ripple { id: number; type: 'normal' | 'long' }
const ripples = ref<Ripple[]>([]);
let rippleId = 0;

watch(() => gestureStore.currentState, (newVal, oldVal) => {
  if (newVal === 'PINCH_START') {
    const id = rippleId++;
    ripples.value.push({ id, type: 'normal' });
    setTimeout(() => { ripples.value = ripples.value.filter(r => r.id !== id); }, 500);
  } else if (newVal === 'PINCH_HOLD_LONG' && oldVal !== 'PINCH_HOLD_LONG') {
    const id = rippleId++;
    ripples.value.push({ id, type: 'long' });
    setTimeout(() => { ripples.value = ripples.value.filter(r => r.id !== id); }, 800);
  }
});
</script>

<style scoped>
.virtual-cursor {
  will-change: left, top, transform;
  pointer-events: none !important;
}
.animate-ping-once {
  animation: ping-once 0.5s cubic-bezier(0, 0, 0.2, 1) forwards;
}
@keyframes ping-once {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}
</style>
