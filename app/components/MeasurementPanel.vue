<template>
  <div class="flex flex-col flex-1 min-h-0 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
    <div class="px-5 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 shrink-0 flex justify-between items-center">
      <span>{{ $t('panel.measurements') }}</span>
      <span v-if="measurements.length > 0" class="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px]">
        {{ measurements.length }}
      </span>
    </div>
    
    <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
      <div 
        v-for="measure in measurements" 
        :key="measure.id"
        class="group relative flex flex-col p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
        @click="selectObject(measure.id)"
        :class="store.selectedIds.has(measure.id) ? 'ring-1 ring-blue-500/50 border-blue-400 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10' : ''"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Icon :name="getIcon(measure.definition.measureType as string)" class="w-3.5 h-3.5" />
            <span class="capitalize">{{ $t(`tools.measure_${measure.definition.measureType}`) || measure.definition.measureType }}</span>
          </div>
          <button 
            @click.stop="copyValue(measure)"
            class="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
            title="Copy formula"
          >
            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div class="bg-slate-50 dark:bg-slate-900/50 rounded p-2 text-center overflow-x-auto scrollbar-hide">
          <FormulaDisplay :formula="getFormula(measure)" :display-mode="false" />
        </div>
      </div>
      
      <div v-if="measurements.length === 0" class="py-6 px-4 text-center text-slate-400 text-sm flex flex-col items-center justify-center h-full">
        <Icon name="lucide:ruler" class="w-8 h-8 mb-2 opacity-20" />
        <p>{{ $t('panel.no_measurements') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import type { GeometryObject } from '../../core/types/geometry';
import FormulaDisplay from './FormulaDisplay.vue';
import { distanceCoords, angleCoords, polygonAreaCoords, polygonPerimeterCoords } from '../../core/geometry/measurements';

const store = useGeometryStore();

const measurements = computed(() => {
  return Array.from(store.objects.values()).filter(obj => obj.type === 'measurement');
});

const getIcon = (type: string) => {
  switch(type) {
    case 'distance': return 'lucide:ruler';
    case 'angle': return 'lucide:spline';
    case 'area': return 'lucide:scaling';
    case 'perimeter': return 'lucide:expand';
    default: return 'lucide:hash';
  }
};

const selectObject = (id: string) => {
  store.selectObject(id);
};

// Compute formula dynamically based on parents' current positions via JSXGraph
const getFormula = (measureObj: GeometryObject) => {
  // Add a reactive dependency on cursorCoords to force re-evaluation on mouse move (during drag)
  store.cursorCoords.x;
  
  const type = measureObj.definition.measureType;
  const renderer = (window as any).__geostudio_renderer;
  
  if (renderer && typeof renderer.getMeasurementText === 'function') {
    const text = renderer.getMeasurementText(measureObj.id);
    if (text) return text;
  }
  
  // Fallback if not rendered yet
  return '\\text{Measuring...}';
};

const copyValue = (measureObj: GeometryObject) => {
  const text = getFormula(measureObj);
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy', err);
  });
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
