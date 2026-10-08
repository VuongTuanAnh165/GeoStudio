<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <!-- Snap Indicator -->
    <div
      v-if="snapResult && snapResult.snapped && screenPos"
      class="absolute transform -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center"
      :style="{ left: `${screenPos.x}px`, top: `${screenPos.y}px` }"
    >
      <!-- The dot -->
      <div 
        class="w-3 h-3 rounded-full border-2 bg-white/80 animate-pulse shadow-sm"
        :class="dotClass"
      />
      
      <div 
        v-if="snapResult.tooltipI18n || snapResult.tooltip"
        class="absolute left-4 top-4 px-2 py-1 bg-slate-800/80 backdrop-blur text-white text-xs rounded shadow whitespace-nowrap opacity-90 transition-opacity"
      >
        {{ snapResult.tooltipI18n ? $t(snapResult.tooltipI18n.key, snapResult.tooltipI18n.args || {}) : snapResult.tooltip }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SnapResult } from '../../core/engine/SnapEngine';
import type { GeometryRenderer } from '../../core/types/renderer';

const props = defineProps<{
  snapResult?: SnapResult | null;
  renderer?: GeometryRenderer | null;
}>();

const screenPos = computed(() => {
  if (!props.snapResult || !props.snapResult.snapped || !props.renderer) return null;
  // Use renderer to convert math pos to screen pos
  if (typeof props.renderer.getScreenPosition === 'function') {
    return props.renderer.getScreenPosition(props.snapResult.pos);
  }
  return null;
});

const dotClass = computed(() => {
  if (!props.snapResult) return '';
  switch (props.snapResult.snapType) {
    case 'point': return 'border-blue-500';
    case 'intersection': return 'border-purple-500';
    case 'midpoint': return 'border-green-500';
    case 'line': return 'border-orange-500';
    case 'grid': return 'border-slate-400';
    default: return 'border-blue-500';
  }
});
</script>
