<template>
  <div class="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col w-16 shrink-0 z-10 transition-colors shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
    <div class="flex-1 overflow-y-auto overflow-x-visible py-4 flex flex-col items-center gap-3 scrollbar-hide">
      
      <!-- Basic Tools -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:mouse-pointer-2" 
          :label="$t('tools.select')" 
          shortcut="V"
          :active="store.activeToolType === 'select'"
          @click="selectTool('select')" 
        />
        <ToolButton 
          icon="lucide:eraser" 
          :label="$t('tools.delete')" 
          shortcut="Del"
          :active="store.activeToolType === 'delete'"
          @click="selectTool('delete')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Creation Tools -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:circle-dot" 
          :label="$t('tools.point')" 
          shortcut="P"
          :active="store.activeToolType === 'point'"
          @click="selectTool('point')" 
        />
        <ToolButton 
          icon="lucide:sliders-horizontal" 
          :label="$t('tools.slider')" 
          shortcut="Alt+S"
          :active="store.activeToolType === 'slider'"
          @click="selectTool('slider')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Lines -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:minus" 
          :label="$t('tools.segment')" 
          shortcut="S"
          :active="store.activeToolType === 'segment'"
          @click="selectTool('segment')" 
        />
        <ToolButton 
          icon="lucide:move-horizontal" 
          :label="$t('tools.line')" 
          shortcut="L"
          :active="store.activeToolType === 'line'"
          @click="selectTool('line')" 
        />
        <ToolButton 
          icon="lucide:arrow-right" 
          :label="$t('tools.ray')" 
          shortcut="R"
          :active="store.activeToolType === 'ray'"
          @click="selectTool('ray')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Curves -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:circle" 
          :label="$t('tools.circle')" 
          shortcut="C"
          :active="store.activeToolType === 'circle'"
          @click="selectTool('circle')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Polygons -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:triangle" 
          :label="$t('tools.triangle')" 
          shortcut="T"
          :active="store.activeToolType === 'triangle'"
          @click="selectTool('triangle')" 
        />
        <ToolButton 
          icon="lucide:hexagon" 
          :label="$t('tools.polygon')" 
          shortcut="G"
          :active="store.activeToolType === 'polygon'"
          @click="selectTool('polygon')" 
        />
      </div>

      <!-- Constructions -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:split-square-horizontal" 
          :label="$t('tools.midpoint')" 
          :active="store.activeToolType === 'construct_midpoint'"
          @click="selectTool('construct_midpoint')" 
        />
        <ToolButton 
          icon="lucide:ruler" 
          :label="$t('tools.perpendicular')" 
          :active="store.activeToolType === 'construct_perpendicular'"
          @click="selectTool('construct_perpendicular')" 
        />
        <ToolButton 
          icon="lucide:equal" 
          :label="$t('tools.parallel')" 
          :active="store.activeToolType === 'construct_parallel'"
          @click="selectTool('construct_parallel')" 
        />
        <ToolButton 
          icon="lucide:scissors" 
          :label="$t('tools.angle_bisector')" 
          :active="store.activeToolType === 'construct_angle_bisector'"
          @click="selectTool('construct_angle_bisector')" 
        />
        <ToolButton 
          icon="lucide:move-vertical" 
          :label="$t('tools.perpendicular_bisector')" 
          :active="store.activeToolType === 'construct_perpendicular_bisector'"
          @click="selectTool('construct_perpendicular_bisector')" 
        />
        <ToolButton 
          icon="lucide:x" 
          :label="$t('tools.intersection')" 
          :active="store.activeToolType === 'construct_intersection'"
          @click="selectTool('construct_intersection')" 
        />
        <ToolButton 
          icon="lucide:circle-dashed" 
          :label="$t('tools.circumcircle')" 
          :active="store.activeToolType === 'construct_circumcircle'"
          @click="selectTool('construct_circumcircle')" 
        />
        <ToolButton 
          icon="lucide:disc-3" 
          :label="$t('tools.incircle')" 
          :active="store.activeToolType === 'construct_incircle'"
          @click="selectTool('construct_incircle')" 
        />
        <ToolButton 
          icon="lucide:trending-up" 
          :label="$t('tools.tangent')" 
          :active="store.activeToolType === 'construct_tangent'"
          @click="selectTool('construct_tangent')" 
        />
        <ToolButton 
          icon="lucide:activity" 
          :label="$t('tools.locus')" 
          :active="store.activeToolType === 'construct_locus'"
          @click="selectTool('construct_locus')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Measurements -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:ruler" 
          :label="$t('tools.measure_distance')" 
          :active="store.activeToolType === 'construct_measure_distance'"
          @click="selectTool('construct_measure_distance')" 
        />
        <ToolButton 
          icon="lucide:spline" 
          :label="$t('tools.measure_angle')" 
          :active="store.activeToolType === 'construct_measure_angle'"
          @click="selectTool('construct_measure_angle')" 
        />
        <ToolButton 
          icon="lucide:scaling" 
          :label="$t('tools.measure_area')" 
          :active="store.activeToolType === 'construct_measure_area'"
          @click="selectTool('construct_measure_area')" 
        />
        <ToolButton 
          icon="lucide:expand" 
          :label="$t('tools.measure_perimeter')" 
          :active="store.activeToolType === 'construct_measure_perimeter'"
          @click="selectTool('construct_measure_perimeter')" 
        />
      </div>

      <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />

      <!-- Transformations -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          icon="lucide:move" 
          :label="$t('tools.translate')" 
          :active="store.activeToolType === 'transform_translate' || store.activeToolType === 'construct_translate'"
          @click="selectTool('transform_translate')" 
        />
        <ToolButton 
          icon="lucide:rotate-cw" 
          :label="$t('tools.rotate')" 
          :active="store.activeToolType === 'transform_rotate' || store.activeToolType === 'construct_rotate'"
          @click="selectTool('transform_rotate')" 
        />
        <ToolButton 
          icon="lucide:flip-horizontal-2" 
          :label="$t('tools.reflect')" 
          :active="store.activeToolType === 'transform_reflect' || store.activeToolType === 'construct_reflect'"
          @click="selectTool('transform_reflect')" 
        />
        <ToolButton 
          icon="lucide:maximize-2" 
          :label="$t('tools.homothety')" 
          :active="store.activeToolType === 'transform_homothety' || store.activeToolType === 'construct_homothety'"
          @click="selectTool('transform_homothety')" 
        />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useGeometryStore } from '../stores/geometry';
import ToolButton from './ToolButton.vue';

// i18n
import { useI18n } from 'vue-i18n';
// The project might use vue-i18n or nuxt/i18n. Usually nuxt/i18n exposes $t globally.
// Let's assume it works in the template globally.

const store = useGeometryStore();

const selectTool = (tool: string) => {
  store.activeToolType = tool;
};
</script>

<style scoped>
/* Hide scrollbar for clean UI */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
