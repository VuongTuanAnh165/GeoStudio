<template>
  <div 
    v-if="modelValue" 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
    @keydown.esc="$emit('update:modelValue', false)"
  >
    <div 
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Icon name="lucide:settings-2" class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-semibold text-base text-slate-800 dark:text-slate-100">{{ $t('settings.title', 'Cài đặt hệ thống') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('settings.subtitle', 'Tùy chỉnh hoạt ảnh, bảng vẽ và trải nghiệm') }}</p>
          </div>
        </div>
        <button 
          @click="$emit('update:modelValue', false)"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-slate-100 dark:border-slate-700/60 px-6 gap-6 bg-slate-50/30 dark:bg-slate-800/30">
        <button 
          @click="activeTab = 'animation'"
          class="py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all"
          :class="activeTab === 'animation' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
        >
          <Icon name="lucide:film" class="w-3.5 h-3.5" />
          {{ $t('settings.animation_tab', 'Hoạt ảnh (Animation)') }}
        </button>
        <button 
          @click="activeTab = 'canvas'"
          class="py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all"
          :class="activeTab === 'canvas' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
        >
          <Icon name="lucide:grid" class="w-3.5 h-3.5" />
          {{ $t('settings.canvas_tab', 'Bảng vẽ & Hiển thị') }}
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-5 flex-1">
        <!-- 1. ANIMATION TAB -->
        <div v-if="activeTab === 'animation'" class="space-y-4">
          <!-- Main Toggle -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span class="font-medium text-sm text-slate-800 dark:text-slate-100 block">{{ $t('settings.enable_animations', 'Bật hiệu ứng chuyển động') }}</span>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ $t('settings.enable_animations_desc', 'Hiệu ứng tạo hình mượt mà, biến đổi và xóa') }}</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                :checked="animationConfig.enabled"
                @change="(e) => updateAnim('enabled', (e.target as HTMLInputElement).checked)"
                class="sr-only peer"
              />
              <div class="w-10 h-5 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div v-if="animationConfig.enabled" class="space-y-4 pt-1">
            <!-- Duration Control -->
            <div class="space-y-2 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <div class="flex items-center justify-between text-xs font-medium">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Icon name="lucide:clock" class="w-3.5 h-3.5 text-blue-500" />
                  {{ $t('settings.duration', 'Thời lượng chuyển động:') }}
                </span>
                <span class="font-mono text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-xs">
                  {{ animationConfig.duration }} ms
                </span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="1200" 
                step="50"
                :value="animationConfig.duration"
                @input="(e) => updateAnim('duration', Number((e.target as HTMLInputElement).value))"
                class="w-full accent-blue-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400">
                <span>100ms (Nhanh)</span>
                <span>400ms (Chuẩn)</span>
                <span>1200ms (Chậm)</span>
              </div>
            </div>

            <!-- Easing Selection -->
            <div class="space-y-2 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Icon name="lucide:trending-up" class="w-3.5 h-3.5 text-purple-500" />
                {{ $t('settings.easing', 'Đường cong gia tốc (Easing):') }}
              </label>
              <select 
                class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                :value="animationConfig.easing"
                @change="(e) => updateAnim('easing', (e.target as HTMLSelectElement).value)"
              >
                <option value="easeInOut">{{ $t('settings.easing_ease_in_out', 'Ease In Out (Mượt mà hai đầu - Khuyên dùng)') }}</option>
                <option value="easeOut">{{ $t('settings.easing_ease_out', 'Ease Out (Giảm tốc dần - Tự nhiên)') }}</option>
                <option value="easeIn">{{ $t('settings.easing_ease_in', 'Ease In (Tăng tốc dần)') }}</option>
                <option value="linear">{{ $t('settings.easing_linear', 'Linear (Đều - Tuyến tính)') }}</option>
              </select>
            </div>

            <!-- Detailed Toggles -->
            <div class="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{{ $t('settings.effects', 'Các hiệu ứng áp dụng') }}</span>

              <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>{{ $t('settings.anim_construction', 'Hiện mượt khi tạo hình (Fade-in & Progressive draw)') }}</span>
                <input 
                  type="checkbox" 
                  :checked="animationConfig.constructionFadeIn !== false"
                  @change="(e) => updateAnim('constructionFadeIn', (e.target as HTMLInputElement).checked)"
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
              </label>

              <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>{{ $t('settings.anim_transform', 'Chuyển động mượt khi dời điểm / biến hình (Transition)') }}</span>
                <input 
                  type="checkbox" 
                  :checked="animationConfig.transformTransition !== false"
                  @change="(e) => updateAnim('transformTransition', (e.target as HTMLInputElement).checked)"
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
              </label>

              <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>{{ $t('settings.anim_delete', 'Mờ dần khi xóa đối tượng (Fade-out)') }}</span>
                <input 
                  type="checkbox" 
                  :checked="animationConfig.deleteFadeOut !== false"
                  @change="(e) => updateAnim('deleteFadeOut', (e.target as HTMLInputElement).checked)"
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- 2. CANVAS TAB -->
        <div v-else class="space-y-4">
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{{ $t('settings.grid_axis', 'Lưới & Trục toạ độ') }}</span>

            <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>{{ $t('context.grid', 'Lưới toạ độ') }}</span>
              <input 
                type="checkbox" 
                v-model="store.settings.gridVisible"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
              />
            </label>

            <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>{{ $t('context.axis', 'Trục toạ độ') }}</span>
              <input 
                type="checkbox" 
                v-model="store.settings.axisVisible"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
              />
            </label>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{{ $t('settings.smart_snap', 'Hút điểm thông minh (Snap)') }}</span>

            <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Hút vào điểm có sẵn</span>
              <input type="checkbox" v-model="store.snapSettings.point" class="rounded border-slate-300 text-blue-600 w-4 h-4" />
            </label>
            <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Hút vào giao điểm</span>
              <input type="checkbox" v-model="store.snapSettings.intersection" class="rounded border-slate-300 text-blue-600 w-4 h-4" />
            </label>
            <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Hút vào trung điểm</span>
              <input type="checkbox" v-model="store.snapSettings.midpoint" class="rounded border-slate-300 text-blue-600 w-4 h-4" />
            </label>
            <label class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Hút vào lưới toạ độ</span>
              <input type="checkbox" v-model="store.snapSettings.grid" class="rounded border-slate-300 text-blue-600 w-4 h-4" />
            </label>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
        <button 
          @click="resetToDefaults"
          class="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline transition-colors"
        >
          {{ $t('settings.reset_defaults', 'Khôi phục mặc định') }}
        </button>
        <button 
          @click="$emit('update:modelValue', false)"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          {{ $t('common.done', 'Hoàn tất') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import { DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from '../../core/types/animation';

defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const store = useGeometryStore();
const activeTab = ref<'animation' | 'canvas'>('animation');

const animationConfig = computed<AnimationConfig>(() => {
  return store.settings.animation || DEFAULT_ANIMATION_CONFIG;
});

const updateAnim = (key: keyof AnimationConfig, value: any) => {
  store.updateAnimationConfig({ [key]: value });
};

const resetToDefaults = () => {
  store.updateAnimationConfig({ ...DEFAULT_ANIMATION_CONFIG });
};
</script>
