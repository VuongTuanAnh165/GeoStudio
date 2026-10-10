<template>
  <div v-if="gestureStore.isEnabled" class="fixed right-6 bottom-24 z-40 animate-in fade-in slide-in-from-right-8 duration-500">
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
      class="absolute right-0 bottom-12 w-80 max-h-[70vh] flex flex-col bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
        <h4 class="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Icon name="lucide:hand" class="w-4 h-4 text-blue-500" />
          Hướng dẫn tương tác Camera
        </h4>
        <button @click="isOpen = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
      
      <div class="p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <!-- Core -->
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <span class="text-lg">🤏</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">Chuột trái (Pinch)</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              - <b>Click:</b> Kẹp ngón trỏ + cái (tay phải) nhanh rồi thả.<br/>
              - <b>Vẽ/Kéo thả:</b> Kẹp và giữ để vẽ đoạn thẳng, hình tròn hoặc kéo đối tượng, thả ra khi xong.
            </p>
          </div>
        </div>

        <!-- Tool Dock 1 tay -->
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <span class="text-lg">✌️</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">Mở khay công cụ (Tool Dock)</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              - <b>Cách 1 (2 tay):</b> Hạ tay trái xuống mép dưới màn hình.<br/>
              - <b>Cách 2 (1 tay):</b> Pinch <b>2 lần liên tiếp</b> bằng tay phải.
            </p>
          </div>
        </div>

        <!-- Context Menu -->
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <span class="text-lg">👌</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">Menu phụ (Chuột phải)</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Kẹp (Pinch) và <b>giữ yên nửa giây</b> vào vùng trống hoặc đối tượng. Menu thao tác (Xóa, Copy, Thuộc tính) sẽ hiện ra.
            </p>
          </div>
        </div>
        
        <!-- Pan / Zoom -->
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <span class="text-lg">✊</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">Di chuyển bản đồ (Pan/Zoom)</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              <b>Nắm tay trái thành nắm đấm (Fist)</b>:<br/>
              - Di chuyển tay trái để <b>Kéo</b> bản đồ.<br/>
              - Dùng tay phải Pinch kéo lên/xuống để <b>Zoom</b>.
            </p>
          </div>
        </div>
      </div>
      
      <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50 shrink-0">
        <p class="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
          <Icon name="lucide:check-circle" class="w-3 h-3 text-green-500" />
          Hỗ trợ đầy đủ thao tác như dùng chuột
        </p>
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

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.5);
}
</style>
