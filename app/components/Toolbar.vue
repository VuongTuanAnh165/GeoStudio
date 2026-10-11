<template>
  <div class="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col w-16 shrink-0 z-10 transition-colors shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
    <div class="flex-1 overflow-y-auto overflow-x-visible py-4 flex flex-col items-center gap-3 scrollbar-hide">
      
      <!-- Basic Tools -->
      <div class="flex flex-col gap-1 w-full items-center">
        <ToolButton 
          v-if="curriculumStore.isToolVisible('select')"
          icon="lucide:mouse-pointer-2" 
          :label="$t('tools.select')" 
          shortcut="V"
          :active="store.activeToolType === 'select'"
          @click="selectTool('select')" 
        />
        <ToolButton 
          v-if="curriculumStore.isToolVisible('delete')"
          icon="lucide:eraser" 
          :label="$t('tools.delete')" 
          shortcut="Del"
          :active="store.activeToolType === 'delete'"
          @click="selectTool('delete')" 
        />
      </div>

      <!-- Creation Tools -->
      <template v-if="hasVisibleTools(['point', 'slider'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('point')"
            icon="lucide:circle-dot" 
            :label="$t('tools.point')" 
            shortcut="P"
            :active="store.activeToolType === 'point'"
            @click="selectTool('point')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('slider')"
            icon="lucide:sliders-horizontal" 
            :label="$t('tools.slider')" 
            shortcut="Alt+S"
            :active="store.activeToolType === 'slider'"
            @click="selectTool('slider')" 
          />
        </div>
      </template>

      <!-- Lines -->
      <template v-if="hasVisibleTools(['segment', 'line', 'ray'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('segment')"
            icon="lucide:minus" 
            :label="$t('tools.segment')" 
            shortcut="S"
            :active="store.activeToolType === 'segment'"
            @click="selectTool('segment')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('line')"
            icon="lucide:move-horizontal" 
            :label="$t('tools.line')" 
            shortcut="L"
            :active="store.activeToolType === 'line'"
            @click="selectTool('line')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('ray')"
            icon="lucide:arrow-right" 
            :label="$t('tools.ray')" 
            shortcut="R"
            :active="store.activeToolType === 'ray'"
            @click="selectTool('ray')" 
          />
        </div>
      </template>

      <!-- Curves -->
      <template v-if="hasVisibleTools(['circle'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('circle')"
            icon="lucide:circle" 
            :label="$t('tools.circle')" 
            shortcut="C"
            :active="store.activeToolType === 'circle'"
            @click="selectTool('circle')" 
          />
        </div>
      </template>

      <!-- Polygons -->
      <template v-if="hasVisibleTools(['triangle', 'polygon'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('triangle')"
            icon="lucide:triangle" 
            :label="$t('tools.triangle')" 
            shortcut="T"
            :active="store.activeToolType === 'triangle'"
            @click="selectTool('triangle')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('polygon')"
            icon="lucide:hexagon" 
            :label="$t('tools.polygon')" 
            shortcut="G"
            :active="store.activeToolType === 'polygon'"
            @click="selectTool('polygon')" 
          />
        </div>
      </template>

      <!-- Constructions -->
      <template v-if="hasVisibleTools(['construct_midpoint', 'construct_perpendicular', 'construct_parallel', 'construct_angle_bisector', 'construct_perpendicular_bisector', 'construct_intersection', 'construct_circumcircle', 'construct_incircle', 'construct_tangent', 'construct_locus'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_midpoint')"
            icon="lucide:split-square-horizontal" 
            :label="$t('tools.midpoint')" 
            :active="store.activeToolType === 'construct_midpoint'"
            @click="selectTool('construct_midpoint')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_perpendicular')"
            icon="lucide:ruler" 
            :label="$t('tools.perpendicular')" 
            :active="store.activeToolType === 'construct_perpendicular'"
            @click="selectTool('construct_perpendicular')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_parallel')"
            icon="lucide:equal" 
            :label="$t('tools.parallel')" 
            :active="store.activeToolType === 'construct_parallel'"
            @click="selectTool('construct_parallel')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_angle_bisector')"
            icon="lucide:scissors" 
            :label="$t('tools.angle_bisector')" 
            :active="store.activeToolType === 'construct_angle_bisector'"
            @click="selectTool('construct_angle_bisector')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_perpendicular_bisector')"
            icon="lucide:move-vertical" 
            :label="$t('tools.perpendicular_bisector')" 
            :active="store.activeToolType === 'construct_perpendicular_bisector'"
            @click="selectTool('construct_perpendicular_bisector')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_intersection')"
            icon="lucide:x" 
            :label="$t('tools.intersection')" 
            :active="store.activeToolType === 'construct_intersection'"
            @click="selectTool('construct_intersection')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_circumcircle')"
            icon="lucide:circle-dashed" 
            :label="$t('tools.circumcircle')" 
            :active="store.activeToolType === 'construct_circumcircle'"
            @click="selectTool('construct_circumcircle')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_incircle')"
            icon="lucide:disc-3" 
            :label="$t('tools.incircle')" 
            :active="store.activeToolType === 'construct_incircle'"
            @click="selectTool('construct_incircle')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_tangent')"
            icon="lucide:trending-up" 
            :label="$t('tools.tangent')" 
            :active="store.activeToolType === 'construct_tangent'"
            @click="selectTool('construct_tangent')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_locus')"
            icon="lucide:activity" 
            :label="$t('tools.locus')" 
            :active="store.activeToolType === 'construct_locus'"
            @click="selectTool('construct_locus')" 
          />
        </div>
      </template>

      <!-- Measurements -->
      <template v-if="hasVisibleTools(['construct_measure_distance', 'construct_measure_angle', 'construct_measure_area', 'construct_measure_perimeter'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_measure_distance')"
            icon="lucide:ruler" 
            :label="$t('tools.measure_distance')" 
            :active="store.activeToolType === 'construct_measure_distance'"
            @click="selectTool('construct_measure_distance')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_measure_angle')"
            icon="lucide:spline" 
            :label="$t('tools.measure_angle')" 
            :active="store.activeToolType === 'construct_measure_angle'"
            @click="selectTool('construct_measure_angle')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_measure_area')"
            icon="lucide:scaling" 
            :label="$t('tools.measure_area')" 
            :active="store.activeToolType === 'construct_measure_area'"
            @click="selectTool('construct_measure_area')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('construct_measure_perimeter')"
            icon="lucide:expand" 
            :label="$t('tools.measure_perimeter')" 
            :active="store.activeToolType === 'construct_measure_perimeter'"
            @click="selectTool('construct_measure_perimeter')" 
          />
        </div>
      </template>

      <!-- Transformations -->
      <template v-if="hasVisibleTools(['transform_translate', 'transform_rotate', 'transform_reflect', 'transform_homothety'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('transform_translate')"
            icon="lucide:move" 
            :label="$t('tools.translate')" 
            :active="store.activeToolType === 'transform_translate' || store.activeToolType === 'construct_translate'"
            @click="selectTool('transform_translate')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('transform_rotate')"
            icon="lucide:rotate-cw" 
            :label="$t('tools.rotate')" 
            :active="store.activeToolType === 'transform_rotate' || store.activeToolType === 'construct_rotate'"
            @click="selectTool('transform_rotate')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('transform_reflect')"
            icon="lucide:flip-horizontal-2" 
            :label="$t('tools.reflect')" 
            :active="store.activeToolType === 'transform_reflect' || store.activeToolType === 'construct_reflect'"
            @click="selectTool('transform_reflect')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('transform_homothety')"
            icon="lucide:maximize-2" 
            :label="$t('tools.homothety')" 
            :active="store.activeToolType === 'transform_homothety' || store.activeToolType === 'construct_homothety'"
            @click="selectTool('transform_homothety')" 
          />
        </div>
      </template>

      <!-- Annotations (Phase 9.5) -->
      <template v-if="hasVisibleTools(['annotate_text', 'annotate_formula', 'annotate_arrow', 'annotate_step_label', 'annotate_highlight'])">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            v-if="curriculumStore.isToolVisible('annotate_text')"
            icon="lucide:type" 
            :label="$t('tools.annotate_text', 'Chú thích chữ')" 
            :active="annotationStore.isModalOpen && annotationStore.editingAnnotation?.type === 'text'"
            @click="handleAnnotationTool('text')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('annotate_formula')"
            icon="lucide:function-square" 
            :label="$t('tools.annotate_formula', 'Công thức KaTeX')" 
            :active="annotationStore.isModalOpen && annotationStore.editingAnnotation?.type === 'formula'"
            @click="handleAnnotationTool('formula')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('annotate_arrow')"
            icon="lucide:move-up-right" 
            :label="$t('tools.annotate_arrow', 'Mũi tên')" 
            :active="annotationStore.isModalOpen && annotationStore.editingAnnotation?.type === 'arrow'"
            @click="handleAnnotationTool('arrow')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('annotate_step_label')"
            icon="lucide:list-ordered" 
            :label="$t('tools.annotate_step_label', 'Số bước')" 
            :active="annotationStore.isModalOpen && annotationStore.editingAnnotation?.type === 'step_label'"
            @click="handleAnnotationTool('step_label')" 
          />
          <ToolButton 
            v-if="curriculumStore.isToolVisible('annotate_highlight')"
            icon="lucide:sparkles" 
            :label="$t('tools.annotate_highlight', 'Điểm nhấn')" 
            :active="annotationStore.isModalOpen && annotationStore.editingAnnotation?.type === 'highlight'"
            @click="handleAnnotationTool('highlight')" 
          />
        </div>
      </template>

      <!-- View Mode Toggle (2D / 3D) -->
      <template v-if="curriculumStore.isToolVisible('view_3d')">
        <div class="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div class="flex flex-col gap-1 w-full items-center">
          <ToolButton 
            :icon="store.is3DMode ? 'lucide:layout-grid' : 'lucide:box'" 
            :label="store.is3DMode ? '2D View' : '3D View'" 
            :active="store.is3DMode"
            @click="store.toggleViewMode()" 
          />
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useGeometryStore } from '../stores/geometry';
import { useCurriculumStore } from '../stores/curriculum';
import { useAnnotationStore } from '../stores/annotation';
import type { AnnotationType } from '../../core/types/annotation';
import ToolButton from './ToolButton.vue';

const store = useGeometryStore();
const curriculumStore = useCurriculumStore();
const annotationStore = useAnnotationStore();

const hasVisibleTools = (tools: string[]) => {
  return tools.some(tool => curriculumStore.isToolVisible(tool));
};

const selectTool = (tool: string) => {
  store.activeToolType = tool;
};

const handleAnnotationTool = (type: AnnotationType) => {
  store.activeToolType = 'select';
  annotationStore.openCreateModal(type, {
    x: Number((store.cursorCoords?.x || 0).toFixed(2)),
    y: Number((store.cursorCoords?.y || 0).toFixed(2))
  });
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
