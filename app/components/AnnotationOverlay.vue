<template>
  <div class="annotation-overlay-root pointer-events-none">
    <!-- SVG and HTML Layer (visible when annotations are toggled on) -->
    <div 
      v-if="annotationStore.isVisible" 
      class="annotation-overlay absolute inset-0 pointer-events-none overflow-hidden select-none z-20"
    >
      <!-- SVG Layer for Arrows and Connector Lines -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
          <marker 
            id="arrowhead-indigo" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
          <marker 
            id="arrowhead-amber" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
          </marker>
          <marker 
            id="arrowhead-emerald" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>
        </defs>

        <!-- Render all Arrow annotations -->
        <template v-for="ann in arrowAnnotations" :key="ann.id">
          <g v-if="getArrowCoords(ann)" class="pointer-events-auto">
            <!-- Clickable buffer line for selection and whole-arrow drag -->
            <line 
              :x1="getArrowCoords(ann)!.x1" 
              :y1="getArrowCoords(ann)!.y1" 
              :x2="getArrowCoords(ann)!.x2" 
              :y2="getArrowCoords(ann)!.y2" 
              stroke="transparent" 
              stroke-width="16" 
              class="cursor-pointer"
              @click.stop="annotationStore.selectAnnotation(ann.id)"
              @dblclick.stop="annotationStore.openEditModal(ann)"
              @mousedown="startDragArrow($event, ann, 'both')"
            />
            <!-- Visible line -->
            <line 
              :x1="getArrowCoords(ann)!.x1" 
              :y1="getArrowCoords(ann)!.y1" 
              :x2="getArrowCoords(ann)!.x2" 
              :y2="getArrowCoords(ann)!.y2" 
              :stroke="ann.style?.color || '#ef4444'" 
              stroke-width="2.5" 
              stroke-linecap="round"
              :marker-end="getArrowMarker(ann.style?.color)"
              class="pointer-events-none"
            />
            <!-- Midpoint label text if present -->
            <text 
              v-if="ann.content"
              :x="(getArrowCoords(ann)!.x1 + getArrowCoords(ann)!.x2) / 2" 
              :y="((getArrowCoords(ann)!.y1 + getArrowCoords(ann)!.y2) / 2) - 8" 
              text-anchor="middle" 
              :fill="ann.style?.color || '#ef4444'" 
              class="text-[12px] font-bold drop-shadow-sm select-none pointer-events-none"
            >
              {{ ann.content }}
            </text>
            <!-- Endpoint Handles when selected -->
            <template v-if="annotationStore.selectedId === ann.id">
              <circle 
                :cx="getArrowCoords(ann)!.x1" 
                :cy="getArrowCoords(ann)!.y1" 
                r="6" 
                fill="#ffffff" 
                :stroke="ann.style?.color || '#ef4444'" 
                stroke-width="2.5" 
                class="cursor-move hover:scale-125 transition-transform"
                @mousedown.stop="startDragArrow($event, ann, 'start')"
              />
              <circle 
                :cx="getArrowCoords(ann)!.x2" 
                :cy="getArrowCoords(ann)!.y2" 
                r="6" 
                fill="#ffffff" 
                :stroke="ann.style?.color || '#ef4444'" 
                stroke-width="2.5" 
                class="cursor-move hover:scale-125 transition-transform"
                @mousedown.stop="startDragArrow($event, ann, 'target')"
              />
            </template>
          </g>
        </template>
      </svg>

      <!-- Midpoint Actions for selected Arrow -->
      <template v-for="ann in arrowAnnotations" :key="'act_' + ann.id">
        <div 
          v-if="annotationStore.selectedId === ann.id && getArrowCoords(ann)"
          class="absolute pointer-events-auto flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-1.5 py-1 rounded-full shadow-lg border border-slate-200 dark:border-slate-700"
          :style="{
            left: `${(getArrowCoords(ann)!.x1 + getArrowCoords(ann)!.x2) / 2}px`,
            top: `${(getArrowCoords(ann)!.y1 + getArrowCoords(ann)!.y2) / 2 + 16}px`,
            transform: 'translate(-50%, 0)'
          }"
        >
          <button 
            @click.stop="annotationStore.openEditModal(ann)" 
            class="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
            :title="$t('annotation.edit', 'Chỉnh sửa')"
          >
            <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
          </button>
          <button 
            @click.stop="annotationStore.deleteAnnotation(ann.id)" 
            class="p-1 hover:text-red-600 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
            :title="$t('annotation.delete', 'Xóa')"
          >
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>

      <!-- HTML Layer for Text, Formula, Step Labels, Highlights -->
      <template v-for="ann in nonArrowAnnotations" :key="ann.id">
        <div 
          v-if="getScreenPos(ann.position)"
          class="absolute pointer-events-auto transition-shadow"
          :style="{
            left: `${getScreenPos(ann.position)!.x}px`,
            top: `${getScreenPos(ann.position)!.y}px`,
            transform: 'translate(-50%, -50%)'
          }"
          @mousedown="startDrag($event, ann)"
          @click.stop="annotationStore.selectAnnotation(ann.id)"
          @dblclick.stop="annotationStore.openEditModal(ann)"
        >
          <!-- 1. Text Annotation -->
          <div 
            v-if="ann.type === 'text'"
            class="group relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-md text-xs font-medium cursor-move transition-all hover:scale-105"
            :class="annotationStore.selectedId === ann.id ? 'ring-2 ring-indigo-500 border-indigo-400' : 'border-slate-200/80 dark:border-slate-700/80'"
            :style="{
              color: ann.style?.color || '#1e293b',
              fontSize: `${ann.style?.fontSize || 13}px`
            }"
          >
            <span>{{ ann.content }}</span>
            <!-- Action Buttons Hover Float -->
            <div class="absolute -top-3 -right-3 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full shadow border border-slate-200 dark:border-slate-700 p-0.5">
              <button @click.stop="annotationStore.openEditModal(ann)" class="p-1 hover:text-indigo-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:pencil" class="w-3 h-3" />
              </button>
              <button @click.stop="annotationStore.deleteAnnotation(ann.id)" class="p-1 hover:text-red-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:trash-2" class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- 2. Formula Annotation (KaTeX) -->
          <div 
            v-else-if="ann.type === 'formula'"
            class="group relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-3.5 py-2 rounded-2xl border shadow-lg cursor-move transition-all hover:scale-105"
            :class="annotationStore.selectedId === ann.id ? 'ring-2 ring-indigo-500 border-indigo-400' : 'border-slate-200/90 dark:border-slate-700/90'"
          >
            <FormulaDisplay :formula="ann.content" :display-mode="false" />
            <div class="absolute -top-3 -right-3 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full shadow border border-slate-200 dark:border-slate-700 p-0.5">
              <button @click.stop="annotationStore.openEditModal(ann)" class="p-1 hover:text-indigo-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:pencil" class="w-3 h-3" />
              </button>
              <button @click.stop="annotationStore.deleteAnnotation(ann.id)" class="p-1 hover:text-red-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:trash-2" class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- 3. Step Label Annotation -->
          <div 
            v-else-if="ann.type === 'step_label'"
            class="group relative flex items-center gap-2 bg-indigo-50/90 dark:bg-indigo-950/90 backdrop-blur-md pl-1.5 pr-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-md cursor-move transition-all hover:scale-105"
            :class="annotationStore.selectedId === ann.id ? 'ring-2 ring-indigo-500' : ''"
          >
            <span class="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
              {{ ann.stepNumber || 1 }}
            </span>
            <span class="text-xs font-semibold text-indigo-900 dark:text-indigo-200 whitespace-nowrap">
              {{ ann.content }}
            </span>
            <div class="absolute -top-3 -right-3 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full shadow border border-slate-200 dark:border-slate-700 p-0.5">
              <button @click.stop="annotationStore.openEditModal(ann)" class="p-1 hover:text-indigo-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:pencil" class="w-3 h-3" />
              </button>
              <button @click.stop="annotationStore.deleteAnnotation(ann.id)" class="p-1 hover:text-red-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:trash-2" class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- 4. Highlight Annotation -->
          <div 
            v-else-if="ann.type === 'highlight'"
            class="group relative flex items-center justify-center cursor-move"
          >
            <!-- Glowing animated pulse ring -->
            <div 
              class="w-8 h-8 rounded-full border-2 border-dashed animate-spin opacity-80"
              :style="{ borderColor: ann.style?.highlightColor || '#f59e0b' }"
            />
            <div 
              class="absolute w-5 h-5 rounded-full opacity-40 animate-ping"
              :style="{ backgroundColor: ann.style?.highlightColor || '#f59e0b' }"
            />
            <div 
              class="absolute w-3 h-3 rounded-full shadow"
              :style="{ backgroundColor: ann.style?.highlightColor || '#f59e0b' }"
            />
            <!-- Tooltip label if content present -->
            <div 
              v-if="ann.content" 
              class="absolute left-6 top-0 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-900/90 text-white whitespace-nowrap shadow-md pointer-events-none"
            >
              {{ ann.content }}
            </div>
            <div class="absolute -top-3 -right-3 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full shadow border border-slate-200 dark:border-slate-700 p-0.5">
              <button @click.stop="annotationStore.openEditModal(ann)" class="p-1 hover:text-indigo-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:pencil" class="w-3 h-3" />
              </button>
              <button @click.stop="annotationStore.deleteAnnotation(ann.id)" class="p-1 hover:text-red-600 rounded-full text-slate-600 dark:text-slate-300">
                <Icon name="lucide:trash-2" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ANNOTATION EDIT / CREATE MODAL (Always available even if annotations hidden) -->
    <div 
      v-if="annotationStore.isModalOpen && annotationStore.editingAnnotation"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 pointer-events-auto"
      @click.self="annotationStore.closeModal()"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Icon name="lucide:message-square-plus" class="w-4 h-4 text-indigo-500" />
            <span>{{ annotationStore.editingAnnotation.id ? $t('annotation.edit_title', 'Chỉnh sửa chú thích') : $t('annotation.add_title', 'Thêm chú thích mới') }}</span>
          </h3>
          <button @click="annotationStore.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Type selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {{ $t('annotation.type', 'Loại chú thích') }}
            </label>
            <div class="grid grid-cols-5 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button 
                v-for="t in typeOptions" 
                :key="t.value"
                type="button"
                @click="setType(t.value)"
                class="px-2 py-1.5 text-xs font-medium rounded-lg transition-all flex flex-col items-center gap-0.5"
                :class="annotationStore.editingAnnotation.type === t.value ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
              >
                <Icon :name="t.icon" class="w-4 h-4" />
                <span class="text-[10px]">{{ t.label }}</span>
              </button>
            </div>
          </div>

          <!-- Step Number if step_label -->
          <div v-if="annotationStore.editingAnnotation.type === 'step_label'">
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {{ $t('annotation.step_number', 'Số thứ tự bước') }}
            </label>
            <input 
              type="number" 
              v-model.number="annotationStore.editingAnnotation.stepNumber" 
              min="1"
              class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <!-- Arrow coordinates if type is arrow -->
          <div v-if="annotationStore.editingAnnotation.type === 'arrow' && annotationStore.editingAnnotation.position" class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tọa độ gốc (x, y)
              </label>
              <div class="flex gap-1.5">
                <input 
                  type="number" 
                  step="0.5" 
                  v-model.number="annotationStore.editingAnnotation.position.x" 
                  class="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100" 
                  placeholder="x" 
                />
                <input 
                  type="number" 
                  step="0.5" 
                  v-model.number="annotationStore.editingAnnotation.position.y" 
                  class="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100" 
                  placeholder="y" 
                />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tọa độ mũi tên (x, y)
              </label>
              <div class="flex gap-1.5" v-if="annotationStore.editingAnnotation.targetPosition">
                <input 
                  type="number" 
                  step="0.5" 
                  v-model.number="annotationStore.editingAnnotation.targetPosition.x" 
                  class="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100" 
                  placeholder="x" 
                />
                <input 
                  type="number" 
                  step="0.5" 
                  v-model.number="annotationStore.editingAnnotation.targetPosition.y" 
                  class="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100" 
                  placeholder="y" 
                />
              </div>
            </div>
          </div>

          <!-- Content Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {{ annotationStore.editingAnnotation.type === 'formula' ? $t('annotation.katex_formula', 'Công thức KaTeX') : $t('annotation.content', 'Nội dung chú thích') }}
              <span v-if="annotationStore.editingAnnotation.type === 'text' || annotationStore.editingAnnotation.type === 'formula' || annotationStore.editingAnnotation.type === 'step_label'" class="text-rose-500">*</span>
            </label>
            <textarea 
              v-model="annotationStore.editingAnnotation.content" 
              rows="3"
              class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              :placeholder="annotationStore.editingAnnotation.type === 'formula' ? 'Ví dụ: AH \\perp BC hoặc a^2 + b^2 = c^2' : 'Nhập nội dung văn bản chú thích...'"
            />
          </div>

          <!-- KaTeX Live Preview -->
          <div 
            v-if="annotationStore.editingAnnotation.type === 'formula' && annotationStore.editingAnnotation.content"
            class="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center justify-center gap-1"
          >
            <span class="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider self-start">{{ $t('annotation.preview_katex', 'Xem trước KaTeX:') }}</span>
            <FormulaDisplay :formula="annotationStore.editingAnnotation.content" :display-mode="true" />
          </div>

          <!-- Color palette -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{{ $t('annotation.color', 'Màu sắc') }}</label>
            <div class="flex items-center gap-2">
              <button 
                v-for="color in colorPalette" 
                :key="color"
                type="button"
                @click="setColor(color)"
                class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                :class="(annotationStore.editingAnnotation.style?.color === color || annotationStore.editingAnnotation.style?.highlightColor === color) ? 'ring-2 ring-indigo-500 scale-110' : 'border-transparent'"
                :style="{ backgroundColor: color }"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-2">
          <button 
            @click="annotationStore.closeModal()"
            class="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {{ $t('common.cancel', 'Hủy') }}
          </button>
          <button 
            @click="annotationStore.saveEditingAnnotation()"
            class="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shadow-indigo-500/20"
          >
            {{ $t('annotation.save', 'Lưu chú thích') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAnnotationStore } from '../stores/annotation';
import type { Annotation, AnnotationType } from '../../core/types/annotation';
import type { Coords2D } from '../../core/types/geometry';
import type { GeometryRenderer } from '../../core/types/renderer';
import FormulaDisplay from './FormulaDisplay.vue';

const props = defineProps<{
  renderer?: GeometryRenderer | null;
}>();

const annotationStore = useAnnotationStore();

const typeOptions: Array<{ value: AnnotationType; label: string; icon: string }> = [
  { value: 'text', label: 'Văn bản', icon: 'lucide:type' },
  { value: 'formula', label: 'Công thức', icon: 'lucide:function-square' },
  { value: 'arrow', label: 'Mũi tên', icon: 'lucide:move-up-right' },
  { value: 'step_label', label: 'Số bước', icon: 'lucide:list-ordered' },
  { value: 'highlight', label: 'Điểm nhấn', icon: 'lucide:sparkles' }
];

const colorPalette = [
  '#1e293b',
  '#2563eb',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6'
];

const setType = (type: AnnotationType) => {
  if (!annotationStore.editingAnnotation) return;
  annotationStore.editingAnnotation.type = type;
  if (type === 'arrow' && !annotationStore.editingAnnotation.targetPosition) {
    const p = annotationStore.editingAnnotation.position || { x: 0, y: 0 };
    annotationStore.editingAnnotation.targetPosition = { x: p.x + 2, y: p.y + 2 };
  }
};

const arrowAnnotations = computed(() => {
  return annotationStore.visibleAnnotations.filter(a => a.type === 'arrow');
});

const nonArrowAnnotations = computed(() => {
  return annotationStore.visibleAnnotations.filter(a => a.type !== 'arrow');
});

const getScreenPos = (pos: Coords2D): Coords2D | null => {
  if (!props.renderer || typeof props.renderer.getScreenPosition !== 'function') {
    return null;
  }
  return props.renderer.getScreenPosition(pos);
};

const getArrowCoords = (ann: Annotation) => {
  if (!ann.position || !ann.targetPosition) return null;
  const p1 = getScreenPos(ann.position);
  const p2 = getScreenPos(ann.targetPosition);
  if (!p1 || !p2) return null;
  return {
    x1: p1.x,
    y1: p1.y,
    x2: p2.x,
    y2: p2.y
  };
};

const getArrowMarker = (color?: string) => {
  if (color === '#6366f1' || color === '#2563eb') return 'url(#arrowhead-indigo)';
  if (color === '#f59e0b') return 'url(#arrowhead-amber)';
  if (color === '#10b981') return 'url(#arrowhead-emerald)';
  return 'url(#arrowhead)';
};

const setColor = (color: string) => {
  if (!annotationStore.editingAnnotation) return;
  if (!annotationStore.editingAnnotation.style) {
    annotationStore.editingAnnotation.style = {};
  }
  if (annotationStore.editingAnnotation.type === 'highlight') {
    annotationStore.editingAnnotation.style.highlightColor = color;
  } else {
    annotationStore.editingAnnotation.style.color = color;
  }
};

// Dragging logic
let dragAnn: Annotation | null = null;
let dragPart: 'single' | 'start' | 'target' | 'both' = 'single';
let startMouseX = 0;
let startMouseY = 0;
let startPosMath: Coords2D = { x: 0, y: 0 };
let startTargetMath: Coords2D = { x: 0, y: 0 };

const startDrag = (e: MouseEvent, ann: Annotation) => {
  if (e.button !== 0) return; // Left click only
  dragAnn = ann;
  dragPart = 'single';
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  startPosMath = { ...ann.position };

  window.addEventListener('mousemove', onDragging);
  window.addEventListener('mouseup', stopDrag);
};

const startDragArrow = (e: MouseEvent, ann: Annotation, part: 'start' | 'target' | 'both') => {
  if (e.button !== 0) return;
  dragAnn = ann;
  dragPart = part;
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  startPosMath = { ...ann.position };
  startTargetMath = ann.targetPosition ? { ...ann.targetPosition } : { x: ann.position.x + 2, y: ann.position.y + 2 };

  window.addEventListener('mousemove', onDragging);
  window.addEventListener('mouseup', stopDrag);
};

const onDragging = (e: MouseEvent) => {
  if (!dragAnn || !props.renderer) return;
  const dxScreen = e.clientX - startMouseX;
  const dyScreen = e.clientY - startMouseY;

  if (dragPart === 'single' || dragPart === 'start') {
    const currentScr = props.renderer.getScreenPosition(startPosMath);
    if (!currentScr) return;
    const newScr: Coords2D = {
      x: currentScr.x + dxScreen,
      y: currentScr.y + dyScreen
    };
    const newMath = props.renderer.getMathPosition(newScr);
    if (newMath) {
      annotationStore.updateAnnotation(dragAnn.id, {
        position: { x: Number(newMath.x.toFixed(2)), y: Number(newMath.y.toFixed(2)) }
      });
    }
  } else if (dragPart === 'target') {
    const currentScr = props.renderer.getScreenPosition(startTargetMath);
    if (!currentScr) return;
    const newScr: Coords2D = {
      x: currentScr.x + dxScreen,
      y: currentScr.y + dyScreen
    };
    const newMath = props.renderer.getMathPosition(newScr);
    if (newMath) {
      annotationStore.updateAnnotation(dragAnn.id, {
        targetPosition: { x: Number(newMath.x.toFixed(2)), y: Number(newMath.y.toFixed(2)) }
      });
    }
  } else if (dragPart === 'both') {
    const currentScr1 = props.renderer.getScreenPosition(startPosMath);
    const currentScr2 = props.renderer.getScreenPosition(startTargetMath);
    if (!currentScr1 || !currentScr2) return;
    const newScr1 = { x: currentScr1.x + dxScreen, y: currentScr1.y + dyScreen };
    const newScr2 = { x: currentScr2.x + dxScreen, y: currentScr2.y + dyScreen };
    const newMath1 = props.renderer.getMathPosition(newScr1);
    const newMath2 = props.renderer.getMathPosition(newScr2);
    if (newMath1 && newMath2) {
      annotationStore.updateAnnotation(dragAnn.id, {
        position: { x: Number(newMath1.x.toFixed(2)), y: Number(newMath1.y.toFixed(2)) },
        targetPosition: { x: Number(newMath2.x.toFixed(2)), y: Number(newMath2.y.toFixed(2)) }
      });
    }
  }
};

const stopDrag = () => {
  dragAnn = null;
  window.removeEventListener('mousemove', onDragging);
  window.removeEventListener('mouseup', stopDrag);
};
</script>

<style scoped>
.annotation-overlay {
  contain: layout style;
}
</style>
