<template>
  <div class="h-8 shrink-0 bg-slate-800/95 dark:bg-slate-950/95 backdrop-blur-md text-slate-300 text-xs flex items-center justify-between px-4 select-none z-20 border-t border-slate-700/50 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity cursor-default" :title="$t('statusbar.object_count')">
        <Icon name="lucide:layers" class="w-3.5 h-3.5" />
        <span class="font-medium tracking-wide">{{ $t('statusbar.objects', { count: store.objects.size }) }}</span>
      </div>
      
      <div v-if="store.activeToolType" class="flex items-center gap-1 text-blue-300" :title="$t('statusbar.active_tool', { tool: '' })">
        <Icon name="lucide:pen-tool" class="w-3.5 h-3.5" />
        <span class="capitalize">{{ $t('statusbar.active_tool', { tool: store.activeToolType }) }}</span>
      </div>
      <div v-else class="flex items-center gap-1 text-slate-400" :title="$t('statusbar.select_tool')">
        <Icon name="lucide:mouse-pointer" class="w-3.5 h-3.5" />
        <span>{{ $t('statusbar.select_tool') }}</span>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1 font-mono text-[10px]" :title="$t('statusbar.cursor_position')">
        <Icon name="lucide:crosshair" class="w-3 h-3" />
        <span>{{ cursorX }}, {{ cursorY }}</span>
      </div>
      
      <div class="w-px h-3 bg-slate-600 mx-1" />
      
      <button 
        @click="toggleLanguage" 
        class="flex items-center hover:text-white transition-colors uppercase font-bold" 
        :title="$t('statusbar.change_language')"
      >
        {{ locale }}
      </button>

      <div class="w-px h-3 bg-slate-600 mx-1" />

      <button 
        @click="toggleTheme" 
        class="flex items-center hover:text-white transition-colors" 
        :title="isDark ? $t('statusbar.light_mode') : $t('statusbar.dark_mode')"
      >
        <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" class="w-3.5 h-3.5" />
      </button>

      <div class="w-px h-3 bg-slate-600 mx-1" />
      
      <div class="flex items-center bg-slate-700/50 rounded overflow-hidden" :title="$t('statusbar.zoom')">
        <button 
          @click="handleZoomOut"
          class="px-2 py-0.5 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
          :title="$t('statusbar.zoom_out')"
        >
          <Icon name="lucide:minus" class="w-3 h-3" />
        </button>
        <span class="w-10 text-center text-[10px] font-mono cursor-pointer hover:text-white transition-colors" :title="$t('statusbar.reset_zoom')" @click="handleResetZoom">
          {{ store.zoomLevel }}%
        </span>
        <button 
          @click="handleZoomIn"
          class="px-2 py-0.5 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
          :title="$t('statusbar.zoom_in')"
        >
          <Icon name="lucide:plus" class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import { useTheme } from '../composables/useTheme';
import { useI18n } from '#imports';

const store = useGeometryStore();
const { toggleTheme, isDark } = useTheme();
const { locale, setLocale } = useI18n();

const toggleLanguage = () => {
  setLocale(locale.value === 'vi' ? 'en' : 'vi');
};
const cursorX = computed(() => store.cursorCoords.x.toFixed(2));
const cursorY = computed(() => store.cursorCoords.y.toFixed(2));

// Since StatusBar is mounted outside of GeoCanvas, we need to communicate with the canvas.
// The easiest way is to use a global event bus or emit a custom event to window, 
// or let workspace.vue pass down the canvas ref.
// For now, we'll dispatch a custom event that GeoCanvas listens to.
const handleZoomIn = () => window.dispatchEvent(new CustomEvent('geostudio:zoom-in'));
const handleZoomOut = () => window.dispatchEvent(new CustomEvent('geostudio:zoom-out'));
const handleResetZoom = () => window.dispatchEvent(new CustomEvent('geostudio:zoom-reset'));
</script>

<style scoped>
</style>
