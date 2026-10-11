<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="curriculumStore.isBrowserOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
        @click.self="curriculumStore.closeBrowser()"
      >
        <div 
          class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="curriculum-browser-title"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Icon name="lucide:graduation-cap" class="w-5 h-5" />
              </div>
              <div>
                <h2 id="curriculum-browser-title" class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{{ $t('curriculum.title', 'Chương trình hình học GDPT 2018') }}</span>
                  <span 
                    v-if="curriculumStore.selectedGrade !== null" 
                    class="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  >
                    {{ curriculumStore.gradeLabel }}
                  </span>
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ $t('curriculum.search_placeholder', 'Tra cứu bài học, lọc công cụ theo khối lớp GDPT') }}
                </p>
              </div>
            </div>

            <button 
              @click="curriculumStore.closeBrowser()" 
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đóng"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Controls Bar (Level Tabs, Grade Pills & Search) -->
          <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 shrink-0 bg-white dark:bg-slate-900">
            <!-- Search & Filter Row -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <!-- Search Input -->
              <div class="relative flex-1">
                <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  v-model="curriculumStore.searchQuery" 
                  class="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  :placeholder="$t('curriculum.search_placeholder', 'Tìm kiếm bài học, khái niệm (trung điểm, góc vuông, vectơ...)')"
                />
                <button 
                  v-if="curriculumStore.searchQuery" 
                  @click="curriculumStore.searchQuery = ''"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Icon name="lucide:x" class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Education Level Switcher -->
              <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto overflow-x-auto max-w-full">
                <button 
                  @click="selectedLevelTab = 'all'" 
                  class="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                  :class="selectedLevelTab === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                >
                  {{ $t('curriculum.level_all', 'Tất cả') }}
                </button>
                <button 
                  @click="selectedLevelTab = 'primary'" 
                  class="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                  :class="selectedLevelTab === 'primary' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                >
                  {{ $t('curriculum.level_primary', 'Tiểu học (1–5)') }}
                </button>
                <button 
                  @click="selectedLevelTab = 'secondary'" 
                  class="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                  :class="selectedLevelTab === 'secondary' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                >
                  {{ $t('curriculum.level_secondary', 'THCS (6–9)') }}
                </button>
                <button 
                  @click="selectedLevelTab = 'high'" 
                  class="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                  :class="selectedLevelTab === 'high' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                >
                  {{ $t('curriculum.level_high', 'THPT (10–12)') }}
                </button>
              </div>
            </div>

            <!-- Grade Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
              <button 
                @click="curriculumStore.setGrade(null)"
                class="px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all border shrink-0"
                :class="curriculumStore.selectedGrade === null 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold' 
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
              >
                {{ $t('curriculum.all_grades', 'Tất cả lớp') }}
              </button>

              <button 
                v-for="g in displayedGrades" 
                :key="g"
                @click="curriculumStore.setGrade(g)"
                class="px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all border shrink-0"
                :class="curriculumStore.selectedGrade === g 
                  ? getActiveGradeClass(g)
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
              >
                Lớp {{ g }}
              </button>
            </div>
          </div>

          <!-- Active Grade Info Banner (if grade is selected) -->
          <div 
            v-if="curriculumStore.selectedGrade !== null && curriculumStore.currentCurriculum" 
            class="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0"
          >
            <div class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <div>
                <div class="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  {{ curriculumStore.currentCurriculum.name }}
                </div>
                <div class="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                  {{ curriculumStore.currentCurriculum.allowedTools.length }} công cụ được mở khóa trong chương trình lớp này
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="curriculumStore.setGrade(null)" 
                class="text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
              >
                <Icon name="lucide:rotate-ccw" class="w-3 h-3" />
                {{ $t('curriculum.reset_filter', 'Bỏ lọc (Hiện tất cả)') }}
              </button>
            </div>
          </div>

          <!-- Concepts List / Grid -->
          <div class="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-slate-900/40">
            <!-- Empty State -->
            <div 
              v-if="curriculumStore.filteredConcepts.length === 0" 
              class="h-64 flex flex-col items-center justify-center text-center p-6"
            >
              <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <Icon name="lucide:search-x" class="w-6 h-6" />
              </div>
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                {{ $t('curriculum.no_results', 'Không tìm thấy khái niệm phù hợp') }}
              </p>
              <p class="text-xs text-slate-400 mt-1 max-w-sm">
                Hãy thử tìm kiếm bằng từ khoá khác hoặc chọn khối lớp / cấp học khác.
              </p>
              <button 
                @click="resetSearch" 
                class="mt-4 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {{ $t('curriculum.reset_filter', 'Bỏ lọc (Hiện tất cả)') }}
              </button>
            </div>

            <!-- Concepts Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="concept in curriculumStore.filteredConcepts" 
                :key="concept.id"
                class="bg-white dark:bg-slate-800 rounded-xl p-4 border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
                :class="curriculumStore.activeConceptId === concept.id 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                  : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'"
              >
                <div>
                  <!-- Badges header -->
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <span 
                      class="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
                      :class="getGradeBadgeClass(concept.grade)"
                    >
                      Lớp {{ concept.grade }}
                    </span>
                    <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                      {{ concept.category }}
                    </span>
                  </div>

                  <!-- Title & Description -->
                  <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                    {{ concept.name }}
                  </h3>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    {{ concept.description }}
                  </p>
                </div>

                <div>
                  <!-- Required tools list -->
                  <div class="pt-2 border-t border-slate-100 dark:border-slate-700/50 mb-3">
                    <span class="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
                      {{ $t('curriculum.required_tools', 'Công cụ sử dụng:') }}
                    </span>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="tool in concept.requiredTools" 
                        :key="tool"
                        class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1"
                      >
                        <Icon :name="getToolIcon(tool)" class="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        {{ getToolLabel(tool) }}
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center justify-between pt-1">
                    <button 
                      @click="applyConcept(concept)"
                      class="w-full py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      :class="curriculumStore.activeConceptId === concept.id
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'"
                    >
                      <Icon name="lucide:play" class="w-3.5 h-3.5" />
                      <span>{{ $t('curriculum.apply_lesson', 'Dựng bài học này') }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
            <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Icon name="lucide:layers" class="w-4 h-4 text-slate-400" />
              <span>{{ curriculumStore.filteredConcepts.length }} bài học / khái niệm hiển thị</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                v-if="curriculumStore.selectedGrade !== null"
                @click="curriculumStore.setGrade(null)"
                class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {{ $t('curriculum.all_grades', 'Hiện tất cả lớp') }}
              </button>
              <button 
                @click="curriculumStore.closeBrowser()"
                class="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shadow-blue-500/20"
              >
                {{ $t('replay.close', 'Đóng') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCurriculumStore } from '../stores/curriculum';
import { useGeometryStore } from '../stores/geometry';
import type { CurriculumConcept } from '../../core/types/curriculum';

const curriculumStore = useCurriculumStore();
const geometryStore = useGeometryStore();

const selectedLevelTab = ref<'all' | 'primary' | 'secondary' | 'high'>('all');

// Lọc các nút chọn khối lớp theo tab cấp học
const displayedGrades = computed(() => {
  if (selectedLevelTab.value === 'primary') {
    return [1, 2, 3, 4, 5];
  }
  if (selectedLevelTab.value === 'secondary') {
    return [6, 7, 8, 9];
  }
  if (selectedLevelTab.value === 'high') {
    return [10, 11, 12];
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
});

const getActiveGradeClass = (grade: number): string => {
  if (grade <= 5) {
    return 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold';
  }
  if (grade <= 9) {
    return 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold';
  }
  return 'bg-purple-600 text-white border-purple-600 shadow-sm font-semibold';
};

const getGradeBadgeClass = (grade: number): string => {
  if (grade <= 5) {
    return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  }
  if (grade <= 9) {
    return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  }
  return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
};

const toolIconMap: Record<string, string> = {
  select: 'lucide:mouse-pointer-2',
  delete: 'lucide:eraser',
  point: 'lucide:circle-dot',
  segment: 'lucide:minus',
  line: 'lucide:move-horizontal',
  ray: 'lucide:arrow-right',
  polygon: 'lucide:hexagon',
  regular_polygon: 'lucide:pentagon',
  circle: 'lucide:circle',
  midpoint: 'lucide:dot',
  perpendicular: 'lucide:corner-down-right',
  parallel: 'lucide:equal',
  angle_bisector: 'lucide:split',
  measure_distance: 'lucide:ruler',
  measure_angle: 'lucide:angle',
  measure_area: 'lucide:maximize-2',
  measure_perimeter: 'lucide:square',
  rotate: 'lucide:rotate-cw',
  reflect: 'lucide:flip-horizontal',
  translate: 'lucide:move',
  slider: 'lucide:sliders-horizontal',
  view_3d: 'lucide:box',
  cube: 'lucide:box',
  cylinder: 'lucide:cylinder',
  cone: 'lucide:cone',
  sphere: 'lucide:globe',
  vector: 'lucide:arrow-up-right',
  cross_section: 'lucide:scissors'
};

const toolNameMap: Record<string, string> = {
  select: 'Chọn',
  delete: 'Xóa',
  point: 'Điểm',
  segment: 'Đoạn thẳng',
  line: 'Đường thẳng',
  ray: 'Tia',
  polygon: 'Đa giác',
  regular_polygon: 'Đa giác đều',
  circle: 'Đường tròn',
  midpoint: 'Trung điểm',
  perpendicular: 'Vuông góc',
  parallel: 'Song song',
  angle_bisector: 'Phân giác',
  measure_distance: 'Đo khoảng cách',
  measure_angle: 'Đo góc',
  measure_area: 'Đo diện tích',
  measure_perimeter: 'Đo chu vi',
  rotate: 'Phép quay',
  reflect: 'Đối xứng',
  translate: 'Tịnh tiến',
  slider: 'Thanh trượt',
  view_3d: 'Không gian 3D',
  cube: 'Lập phương',
  cylinder: 'Hình trụ',
  cone: 'Hình nón',
  sphere: 'Hình cầu',
  vector: 'Vectơ',
  cross_section: 'Mặt cắt'
};

const getToolIcon = (tool: string): string => {
  return toolIconMap[tool] || 'lucide:wrench';
};

const getToolLabel = (tool: string): string => {
  return toolNameMap[tool] || tool;
};

const resetSearch = () => {
  curriculumStore.searchQuery = '';
  curriculumStore.setGrade(null);
  selectedLevelTab.value = 'all';
};

const applyConcept = (concept: CurriculumConcept) => {
  curriculumStore.selectConcept(concept);
  
  // Tự động chuyển 2D sang 3D nếu concept là 3D
  const requires3D = concept.requiredTools.some(t => 
    t === 'view_3d' || t === 'cube' || t === 'cylinder' || t === 'cone' || t === 'sphere' || t === 'cross_section'
  );
  if (requires3D && !geometryStore.is3DMode) {
    geometryStore.setViewMode('3d');
  } else if (!requires3D && geometryStore.is3DMode && concept.grade < 5) {
    // Nếu là bài học tiểu học 2D thuần túy, về 2D
    geometryStore.setViewMode('2d');
  }

  // Chọn công cụ đầu tiên phù hợp của bài học nếu có
  const firstTool = concept.requiredTools[0];
  if (firstTool && firstTool !== 'view_3d') {
    geometryStore.activeToolType = firstTool;
  }

  // Đóng browser để giáo viên bắt đầu thực hành
  curriculumStore.closeBrowser();
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
