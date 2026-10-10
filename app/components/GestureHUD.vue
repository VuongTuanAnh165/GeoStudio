<template>
  <div v-if="gestureStore.showHUD && gestureStore.isEnabled" class="absolute top-6 left-6 z-40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-2xl rounded-3xl p-4 flex items-center gap-4 border border-white/40 dark:border-slate-700/50 transition-all pointer-events-none w-72">
    
    <!-- Gesture Icon Animation -->
    <div class="relative w-16 h-16 rounded-2xl bg-white/60 dark:bg-slate-800/60 shadow-inner flex items-center justify-center text-4xl overflow-hidden flex-shrink-0 transition-colors duration-300"
         :class="gestureStore.currentState === 'PINCH_HOLD_LONG' ? 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-400' : ''">
       <span class="transition-all duration-300 transform" :class="iconAnimClass">{{ stateEmoji }}</span>
    </div>

    <!-- Instruction Text -->
    <div class="flex flex-col flex-1">
      <div class="flex justify-between items-center mb-0.5">
        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {{ gestureStore.leftHandState === 'FIST' ? 'BIMANUAL' : gestureStore.currentState.replace(/_/g, ' ') }}
        </span>
        <!-- Confidence -->
        <span class="text-[9px] font-mono font-medium text-slate-400" :title="`${Math.round(gestureStore.fps)} fps`">
          {{ Math.round(gestureStore.confidence * 100) }}%
        </span>
      </div>
      <span class="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight min-h-[40px] flex items-center">
        {{ instructionText }}
      </span>
      
      <!-- Tool Indicator -->
      <div class="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/30 rounded px-2 py-0.5 w-fit">
        <Icon name="lucide:pen-tool" class="w-3 h-3" />
        {{ activeToolName }}
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
  const tool = geoStore.activeToolType || 'select';
  return tool.charAt(0).toUpperCase() + tool.slice(1);
});

const stateEmoji = computed(() => {
  if (gestureStore.leftHandState === 'FIST') return '✊';
  switch (gestureStore.currentState) {
    case 'IDLE': return '🖐️';
    case 'HOVER': return '☝️';
    case 'PINCH_START': return '🤏';
    case 'PINCH_HOLD': return '🤏';
    case 'PINCH_HOLD_LONG': return '👌';
    case 'DRAGGING': return '✍️';
    case 'SWIPE': return '👋';
    default: return '🖐️';
  }
});

const iconAnimClass = computed(() => {
  if (gestureStore.currentState.includes('PINCH')) return 'scale-90';
  if (gestureStore.currentState === 'DRAGGING') return 'scale-90 -rotate-12 translate-x-1 translate-y-1';
  return 'scale-100 rotate-0';
});

const instructionText = computed(() => {
  if (gestureStore.leftHandState === 'FIST') {
    if (gestureStore.currentState === 'PINCH_HOLD' || gestureStore.currentState === 'DRAGGING') {
       return 'Kéo tay phải để Phóng/Thu';
    }
    return 'Di chuyển tay trái để Kéo bản đồ';
  }

  switch (gestureStore.currentState) {
    case 'IDLE': return 'Đưa tay vào camera để bắt đầu';
    case 'HOVER': return 'Chạm ngón trỏ & cái để tương tác';
    case 'PINCH_START': return 'Đang giữ...';
    case 'PINCH_HOLD': return 'Giữ thêm chút nữa để mở Menu';
    case 'PINCH_HOLD_LONG': return 'Thả tay để chọn lệnh';
    case 'DRAGGING': return 'Đang thao tác...';
    default: return 'Chờ tín hiệu...';
  }
});
</script>
