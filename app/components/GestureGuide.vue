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

        <!-- Bimanual Tool Dictionary -->
        <div class="flex items-start gap-3 mt-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
          <div class="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-1">
            <span class="text-lg">✌️</span>
          </div>
          <div class="w-full">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Từ điển Công cụ (Tay trái)</p>
            
            <div class="space-y-3">
              <!-- Basic Shapes -->
              <div class="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Giơ 1 ngón (Cơ bản)</p>
                <div class="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span>☝️ Trỏ: <b class="text-blue-500">Điểm</b></span>
                  <span>🖕 Giữa: <b class="text-blue-500">Đoạn thẳng</b></span>
                  <span>💍 Áp út: <b class="text-blue-500">Đường tròn</b></span>
                  <span>🤙 Út: <b class="text-blue-500">Đa giác</b></span>
                </div>
              </div>

              <!-- Constructive -->
              <div class="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Giơ 2 ngón (Nâng cao)</p>
                <div class="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span>✌️ Trỏ+Giữa: <b class="text-purple-500">Đường thẳng</b></span>
                  <span>🖖 Giữa+Áp út: <b class="text-purple-500">Tia (Ray)</b></span>
                  <span>🤘 Trỏ+Út: <b class="text-red-500">Xóa (Delete)</b></span>
                  <span>🤟 Áp út+Út: <b class="text-purple-500">Tam giác</b></span>
                </div>
              </div>

              <!-- Measurements -->
              <div class="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Giơ 3 ngón (Đo lường)</p>
                <div class="grid grid-cols-1 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span>Trỏ+Giữa+Áp út: <b class="text-orange-500">Đo Góc (Angle)</b></span>
                  <span>Giữa+Áp út+Út: <b class="text-orange-500">Đo Khoảng cách</b></span>
                  <span>Trỏ+Áp út+Út: <b class="text-orange-500">Viết Chữ (Text)</b></span>
                </div>
              </div>
            </div>
            
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 italic text-center">
              *Không cần mở menu, chỉ cần giơ đúng ngón tay trái và dùng tay phải vẽ.
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

        <!-- Swipe (Undo/Redo) -->
        <div class="flex items-start gap-3 mt-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
          <div class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <span class="text-lg">👋</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">Hoàn tác (Undo / Redo)</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Mở bàn tay trái và <b>Vuốt nhanh (Swipe)</b>:<br/>
              - Vuốt sang trái: <b>Undo</b> (Hoàn tác).<br/>
              - Vuốt sang phải: <b>Redo</b> (Làm lại).
            </p>
          </div>
        </div>
        
        <!-- Pan / Zoom -->
        <div class="flex items-start gap-3 mt-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
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
