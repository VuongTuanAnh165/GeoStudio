<template>
  <div v-if="gestureStore.isEnabled" class="fixed right-6 top-24 z-40 animate-in fade-in slide-in-from-right-8 duration-500">
    <!-- Trigger Button -->
    <button 
      @click="isOpen = !isOpen"
      class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-2.5 rounded-full shadow-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors tooltip-trigger"
      title="Hướng dẫn cử chỉ"
    >
      <Icon name="lucide:info" class="w-5 h-5" />
    </button>

    <!-- Guide Panel -->
    <div 
      v-if="isOpen"
      class="absolute right-0 top-12 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
        <h4 class="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Icon name="lucide:hand" class="w-4 h-4 text-blue-500" />
          Hướng dẫn cử chỉ
        </h4>
        <button @click="isOpen = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
      
      <div class="p-4 flex flex-col gap-4">
        <!-- Tool Switcher -->
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <Icon name="lucide:hand" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">Đổi công cụ bằng Tay Trái</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ☝️ 1 ngón: Điểm <br/>
              ✌️ 2 ngón: Đoạn thẳng <br/>
              🖖 3 ngón: Đường tròn <br/>
              🖐 Xòe tay: Chọn đối tượng
            </p>
          </div>
        </div>

        <!-- Hover / Move -->
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <Icon name="lucide:mouse-pointer-2" class="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">Di chuyển bằng Tay Phải</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mở bàn tay phải, tựa cùi chỏ lên bàn và <b>lắc nhẹ cổ tay</b> (như xài chuột).</p>
          </div>
        </div>

        <!-- Click / Select -->
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Icon name="lucide:check-circle-2" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">Click / Vẽ hình (Pinch)</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kẹp ngón trỏ + cái tay phải để click. Con trỏ sẽ tự động khóa (Pinch-lock) chống rung.</p>
          </div>
        </div>
      </div>
      
      <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50">
        <p class="text-[11px] text-slate-500 text-center">Bimanual Sign Language (Thao tác 2 tay)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGestureStore } from '../stores/gesture';

const gestureStore = useGestureStore();
const isOpen = ref(true); // Default to open for discoverability
</script>
