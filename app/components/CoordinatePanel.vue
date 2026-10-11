<template>
  <div 
    v-if="coordStore.isPanelOpen" 
    class="coordinate-panel fixed top-16 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
  >
    <!-- Header -->
    <div class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Icon name="lucide:function-square" class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">
            {{ $t('coordinate.title', 'Tọa độ & Phương trình') }}
          </h3>
          <span class="text-[10px] text-slate-400 font-medium">Coordinate Geometry & Equations</span>
        </div>
      </div>
      <button 
        @click="coordStore.closePanel()"
        class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </button>
    </div>

    <!-- Tab navigation -->
    <div class="flex border-b border-slate-100 dark:border-slate-800 px-3 pt-2 gap-1 bg-slate-50/30 dark:bg-slate-900/40">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="coordStore.activeTab = tab.id"
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all"
        :class="coordStore.activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <Icon :name="tab.icon" class="w-3.5 h-3.5" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="p-5 flex-1 overflow-y-auto max-h-[70vh] space-y-4">
      
      <!-- TAB 1: EQUATION INPUT -> GEOMETRY -->
      <div v-if="coordStore.activeTab === 'input'" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            {{ $t('coordinate.input_label', 'Nhập phương trình đường thẳng, đường tròn hoặc hàm số') }}:
          </label>
          <div class="relative">
            <input 
              v-model="coordStore.inputEquation"
              type="text" 
              class="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              placeholder="ví dụ: y = 2x - 1, (x-2)^2 + y^2 = 9, y = x^2 - 4"
              @keydown.enter="handlePlot"
            />
          </div>
        </div>

        <!-- Quick Template Buttons -->
        <div>
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            {{ $t('coordinate.examples', 'Mẫu phương trình gợi ý') }}:
          </span>
          <div class="flex flex-wrap gap-1.5">
            <button 
              v-for="sample in sampleEquations" 
              :key="sample"
              type="button"
              @click="coordStore.inputEquation = sample"
              class="px-2 py-1 text-[11px] font-mono bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200/50 dark:border-slate-700/50 transition-colors"
            >
              {{ sample }}
            </button>
          </div>
        </div>

        <!-- Live KaTeX Preview & Detection -->
        <div 
          v-if="coordStore.parsedInputEquation"
          class="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2"
        >
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Icon name="lucide:check-circle-2" class="w-3 h-3" />
              <span>{{ getParsedTypeLabel(coordStore.parsedInputEquation.type) }}</span>
            </span>
            <span class="text-[10px] text-slate-400">Xem trước KaTeX</span>
          </div>
          <div class="flex justify-center py-1">
            <FormulaDisplay :formula="previewFormula" :display-mode="true" />
          </div>
        </div>

        <!-- Error / Success messages -->
        <div v-if="coordStore.inputError" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0" />
          <span>{{ coordStore.inputError }}</span>
        </div>

        <div v-if="coordStore.successMessage" class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Icon name="lucide:check-circle" class="w-4 h-4 shrink-0" />
          <span>{{ coordStore.successMessage }}</span>
        </div>

        <!-- Plot Action Button -->
        <button 
          @click="handlePlot"
          class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>{{ $t('coordinate.plot_btn', 'Vẽ lên bảng hình học') }}</span>
        </button>
      </div>

      <!-- TAB 2: ACTIVE GEOMETRY -> EQUATION DISPLAY -->
      <div v-else-if="coordStore.activeTab === 'selected'" class="space-y-4">
        <div v-if="coordStore.selectedEquation" class="space-y-3">
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Icon name="lucide:mouse-pointer" class="w-3.5 h-3.5 text-indigo-500" />
            <span>Đối tượng đang chọn:</span>
            <span class="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold uppercase text-[10px]">
              {{ coordStore.selectedEquation.type }}
            </span>
          </div>

          <!-- Line Equations -->
          <div v-if="coordStore.selectedEquation.type === 'line'" class="space-y-2">
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span class="text-[11px] font-semibold text-slate-400 block mb-1">Phương trình tổng quát (General Form):</span>
              <div class="py-1 flex justify-center">
                <FormulaDisplay :formula="coordStore.selectedEquation.katexGeneral" :display-mode="true" />
              </div>
            </div>

            <div v-if="coordStore.selectedEquation.katexSlopeIntercept" class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span class="text-[11px] font-semibold text-slate-400 block mb-1">Phương trình hệ số góc (Slope-Intercept Form):</span>
              <div class="py-1 flex justify-center">
                <FormulaDisplay :formula="coordStore.selectedEquation.katexSlopeIntercept" :display-mode="true" />
              </div>
            </div>
          </div>

          <!-- Circle Equations -->
          <div v-else-if="coordStore.selectedEquation.type === 'circle'" class="space-y-2">
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span class="text-[11px] font-semibold text-slate-400 block mb-1">Phương trình chính tắc (Standard Form):</span>
              <div class="py-1 flex justify-center">
                <FormulaDisplay :formula="coordStore.selectedEquation.katexStandard" :display-mode="true" />
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span class="text-[11px] font-semibold text-slate-400 block mb-1">Phương trình khai triển (General Form):</span>
              <div class="py-1 flex justify-center">
                <FormulaDisplay :formula="coordStore.selectedEquation.katexGeneral" :display-mode="true" />
              </div>
            </div>

            <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
              <span>Tâm I: ({{ coordStore.selectedEquation.center.x }}, {{ coordStore.selectedEquation.center.y }})</span>
              <span>Bán kính R: {{ coordStore.selectedEquation.radius }}</span>
            </div>
          </div>

          <!-- Function Equation -->
          <div v-else-if="coordStore.selectedEquation.type === 'function'" class="space-y-2">
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span class="text-[11px] font-semibold text-slate-400 block mb-1">Công thức hàm số:</span>
              <div class="py-1 flex justify-center">
                <FormulaDisplay :formula="coordStore.selectedEquation.katexFormula" :display-mode="true" />
              </div>
            </div>
          </div>

          <!-- Action: Insert as Annotation -->
          <button 
            @click="addEquationAsAnnotation"
            class="w-full py-2 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Icon name="lucide:message-square-plus" class="w-3.5 h-3.5" />
            <span>Chèn phương trình làm chú thích lên Canvas</span>
          </button>
        </div>

        <!-- Empty state when no object selected -->
        <div v-else class="text-center py-8 space-y-3">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Icon name="lucide:mouse-pointer-click" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {{ $t('coordinate.no_selection', 'Chưa chọn đối tượng nào') }}
            </p>
            <p class="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
              Hãy chọn một đường thẳng, đoạn thẳng hoặc đường tròn trên bảng vẽ để xem phương trình tức thì.
            </p>
          </div>
        </div>
      </div>

      <!-- TAB 3: AXES & GRID CUSTOMIZATION -->
      <div v-else-if="coordStore.activeTab === 'grid'" class="space-y-4">
        <!-- Cartesian Axis Toggle -->
        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon name="mdi:axis-arrow" class="w-4 h-4 text-indigo-500" />
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Trục tọa độ Cartesian</span>
            </div>
            <button 
              @click="coordStore.toggleAxis()"
              class="w-10 h-6 flex items-center rounded-full p-1 transition-colors"
              :class="coordStore.axisConfig.visible ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'"
            >
              <div class="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <div v-if="coordStore.axisConfig.visible" class="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Hiển thị nhãn số và Ox, Oy:</span>
            <input 
              type="checkbox" 
              v-model="coordStore.axisConfig.showLabels"
              @change="coordStore.setAxisLabels(coordStore.axisConfig.showLabels)"
              class="rounded text-indigo-600"
            />
          </div>
        </div>

        <!-- Grid Customization -->
        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon name="mdi:grid" class="w-4 h-4 text-indigo-500" />
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Lưới tọa độ (Grid)</span>
            </div>
            <button 
              @click="coordStore.toggleGrid()"
              class="w-10 h-6 flex items-center rounded-full p-1 transition-colors"
              :class="coordStore.gridConfig.visible ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'"
            >
              <div class="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <template v-if="coordStore.gridConfig.visible">
            <!-- Grid Size / Step -->
            <div class="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
              <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Khoảng cách lưới (Grid Step):</span>
              <div class="grid grid-cols-4 gap-1.5">
                <button 
                  v-for="step in [0.5, 1, 2, 5]" 
                  :key="step"
                  type="button"
                  @click="coordStore.setGridSize(step)"
                  class="py-1 px-2 text-xs font-bold rounded-lg border transition-all"
                  :class="coordStore.gridConfig.size === step ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'"
                >
                  {{ step }}
                </button>
              </div>
            </div>

            <!-- Grid Style -->
            <div class="space-y-1.5 pt-1">
              <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kiểu lưới (Grid Style):</span>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  @click="coordStore.setGridStyle('lines')"
                  class="py-1.5 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all"
                  :class="coordStore.gridConfig.style === 'lines' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
                >
                  <Icon name="lucide:grid" class="w-3.5 h-3.5" />
                  <span>Đường kẻ (Lines)</span>
                </button>
                <button 
                  type="button"
                  @click="coordStore.setGridStyle('dots')"
                  class="py-1.5 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all"
                  :class="coordStore.gridConfig.style === 'dots' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
                >
                  <Icon name="lucide:grip" class="w-3.5 h-3.5" />
                  <span>Chấm điểm (Dots)</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCoordinateStore } from '../stores/coordinate';
import { useAnnotationStore } from '../stores/annotation';
import FormulaDisplay from './FormulaDisplay.vue';

const coordStore = useCoordinateStore();
const annotationStore = useAnnotationStore();

const tabs: Array<{ id: 'input' | 'selected' | 'grid'; label: string; icon: string }> = [
  { id: 'input', label: 'Vẽ phương trình', icon: 'lucide:pen-tool' },
  { id: 'selected', label: 'Hiện phương trình', icon: 'lucide:sparkles' },
  { id: 'grid', label: 'Trục & Lưới', icon: 'lucide:layout-grid' }
];

const sampleEquations = [
  'y = 2x - 1',
  '2x - y + 3 = 0',
  '(x - 2)^2 + (y + 1)^2 = 9',
  'x^2 + y^2 = 16',
  'y = x^2 - 4',
  'y = sin(x)',
  'y = 1/x'
];

const previewFormula = computed(() => {
  const p = coordStore.parsedInputEquation;
  if (!p) return coordStore.inputEquation;

  if (p.type === 'line') {
    return p.raw;
  }
  if (p.type === 'circle') {
    return `(x ${p.center.x >= 0 ? '- ' + p.center.x : '+ ' + Math.abs(p.center.x)})^2 + (y ${p.center.y >= 0 ? '- ' + p.center.y : '+ ' + Math.abs(p.center.y)})^2 = ${p.radiusSquared}`;
  }
  if (p.type === 'function') {
    return `y = ${p.expression}`;
  }
  return coordStore.inputEquation;
});

const getParsedTypeLabel = (type: string) => {
  if (type === 'line') return 'Phương trình đường thẳng';
  if (type === 'circle') return 'Phương trình đường tròn';
  if (type === 'function') return 'Đồ thị hàm số y = f(x)';
  return 'Phương trình';
};

const handlePlot = () => {
  coordStore.plotFromEquation();
};

const addEquationAsAnnotation = () => {
  const eq = coordStore.selectedEquation;
  if (!eq) return;

  let textFormula = '';
  if (eq.type === 'line') {
    textFormula = eq.katexSlopeIntercept || eq.katexGeneral;
  } else if (eq.type === 'circle') {
    textFormula = eq.katexStandard;
  } else if (eq.type === 'function') {
    textFormula = eq.katexFormula;
  }

  if (textFormula) {
    annotationStore.addFormulaAnnotation({ x: 0, y: 0 }, textFormula);
    coordStore.successMessage = 'Đã chèn phương trình làm chú thích lên bảng vẽ!';
  }
};
</script>

<style scoped>
.coordinate-panel {
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2);
}
</style>
