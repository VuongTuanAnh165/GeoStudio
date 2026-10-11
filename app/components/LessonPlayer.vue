<template>
  <div 
    v-if="lessonStore.isPlayerActive"
    class="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden"
    :class="lessonStore.isPlayerFullscreen ? 'bg-slate-950/20' : ''"
    @mousemove="handleActivity"
  >
    <!-- Top Bar: Lesson Info & Quick Controls -->
    <div 
      class="absolute top-4 left-4 right-4 flex items-center justify-between transition-opacity duration-300 pointer-events-auto"
      :class="isControlsVisible ? 'opacity-100' : 'opacity-0'"
    >
      <!-- Left: Lesson Title & Lesson Switcher -->
      <div class="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
        <div class="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
          <Icon name="lucide:presentation" class="w-4 h-4" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-800 dark:text-slate-100">
              {{ lessonStore.currentLesson?.title || $t('lesson.player_title', 'Trình chiếu bài giảng') }}
            </h2>
            <span 
              v-if="lessonStore.currentLesson" 
              class="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
            >
              Lớp {{ lessonStore.currentLesson.grade }}
            </span>
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{{ $t('lesson.step_progress', { current: lessonStore.playerCurrentStepIndex, total: lessonStore.totalSteps }) }}</span>
            <span v-if="lessonStore.isAutoPlaying" class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Đang phát tự động
            </span>
          </div>
        </div>

        <!-- Quick Lesson Picker dropdown if multiple saved lessons exist -->
        <div v-if="lessonStore.savedLessons.length > 1" class="ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
          <select 
            :value="lessonStore.currentLesson?.id" 
            @change="onLessonSelect"
            class="bg-slate-100 dark:bg-slate-800 text-xs rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 border-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option v-for="l in lessonStore.savedLessons" :key="l.id" :value="l.id">
              {{ l.title }} (Lớp {{ l.grade }})
            </option>
          </select>
        </div>
      </div>

      <!-- Right: Fullscreen & Exit -->
      <div class="flex items-center gap-2">
        <button 
          @click="lessonStore.togglePlayerFullscreen()"
          class="px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/60 shadow-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
          :title="lessonStore.isPlayerFullscreen ? $t('lesson.exit_fullscreen', 'Thu nhỏ') : $t('lesson.fullscreen', 'Toàn màn hình (F11)')"
        >
          <Icon :name="lessonStore.isPlayerFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ lessonStore.isPlayerFullscreen ? $t('lesson.exit_fullscreen', 'Thu nhỏ') : $t('lesson.fullscreen', 'Toàn màn hình') }}</span>
          <kbd class="px-1 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">F</kbd>
        </button>

        <button 
          @click="lessonStore.stopPlayer()"
          class="px-3.5 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white backdrop-blur-md border border-red-500/60 shadow-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
          :title="$t('lesson.exit_player', 'Đóng trình chiếu (Esc)')"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
          <span>{{ $t('replay.exit', 'Đóng') }}</span>
          <kbd class="px-1 py-0.2 rounded bg-red-800 text-[10px] text-red-200">Esc</kbd>
        </button>
      </div>
    </div>

    <!-- Center/Bottom Pedagogical HUD: Step Info, Annotations, KaTeX Formulas -->
    <div 
      class="absolute bottom-24 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-auto flex flex-col items-center gap-2.5 max-w-2xl w-[90vw]"
      :class="isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
    >
      <div 
        v-if="lessonStore.playerCurrentStep" 
        class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl text-center flex flex-col gap-2 w-full transition-all"
      >
        <!-- Step Title Badge -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
              {{ lessonStore.playerCurrentStep.stepNumber }}
            </span>
            <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {{ lessonStore.playerCurrentStep.title }}
            </span>
          </div>

          <span class="text-[11px] text-slate-400">
            {{ lessonStore.playerCurrentStepIndex }} / {{ lessonStore.totalSteps }}
          </span>
        </div>

        <!-- Description -->
        <p class="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
          {{ lessonStore.playerCurrentStep.description }}
        </p>

        <!-- Teacher Annotation Callout -->
        <div 
          v-if="lessonStore.playerCurrentStep.annotation" 
          class="text-xs text-blue-800 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 px-3.5 py-1.5 rounded-xl border border-blue-200/60 dark:border-blue-800/50 flex items-start justify-center gap-2 text-left"
        >
          <Icon name="lucide:message-square-quote" class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>{{ lessonStore.playerCurrentStep.annotation }}</span>
        </div>

        <!-- KaTeX Formula Display -->
        <div 
          v-if="lessonStore.playerCurrentStep.formula" 
          class="text-sm bg-amber-50/80 dark:bg-amber-950/50 px-4 py-2 rounded-xl border border-amber-200/60 dark:border-amber-800/50 flex flex-col items-center justify-center gap-1"
        >
          <span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider self-start">
            {{ $t('lesson.formula_label', 'Công thức áp dụng') }}:
          </span>
          <FormulaDisplay :formula="lessonStore.playerCurrentStep.formula" :display-mode="true" />
        </div>
      </div>
    </div>

    <!-- Bottom Playback Control Bar -->
    <div 
      class="absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-auto flex items-center gap-3"
      :class="isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
    >
      <div class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-2xl flex items-center gap-3">
        <!-- First Step -->
        <button 
          @click="lessonStore.playerFirstStep()"
          :disabled="lessonStore.playerCurrentStepIndex <= 1"
          class="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Bước đầu tiên (Home)"
        >
          <Icon name="lucide:chevrons-left" class="w-4 h-4" />
        </button>

        <!-- Prev Step -->
        <button 
          @click="lessonStore.playerPrevStep()"
          :disabled="lessonStore.playerCurrentStepIndex <= 1"
          class="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Bước trước (←)"
        >
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
        </button>

        <!-- Play / Pause Auto Play -->
        <button 
          @click="lessonStore.toggleAutoPlay()"
          class="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 transition-all hover:scale-105"
          :title="lessonStore.isAutoPlaying ? $t('lesson.pause', 'Tạm dừng (P)') : $t('lesson.auto_play', 'Tự động phát (P)')"
        >
          <Icon :name="lessonStore.isAutoPlaying ? 'lucide:pause' : 'lucide:play'" class="w-5 h-5" />
        </button>

        <!-- Next Step -->
        <button 
          @click="lessonStore.playerNextStep()"
          :disabled="lessonStore.playerCurrentStepIndex >= lessonStore.totalSteps"
          class="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Bước tiếp theo (→ / Space)"
        >
          <Icon name="lucide:arrow-right" class="w-4 h-4" />
        </button>

        <!-- Last Step -->
        <button 
          @click="lessonStore.playerLastStep()"
          :disabled="lessonStore.playerCurrentStepIndex >= lessonStore.totalSteps"
          class="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Bước cuối cùng (End)"
        >
          <Icon name="lucide:chevrons-right" class="w-4 h-4" />
        </button>

        <div class="w-px h-5 bg-slate-300 dark:bg-slate-700" />

        <!-- Step Scrub / Jump Bar -->
        <div class="flex items-center gap-1 max-w-[200px] overflow-x-auto scrollbar-hide py-1">
          <button 
            v-for="step in lessonStore.steps" 
            :key="step.id"
            @click="lessonStore.playerGoToStep(step.stepNumber)"
            class="w-6 h-6 rounded-md text-[11px] font-semibold transition-all shrink-0"
            :class="lessonStore.playerCurrentStepIndex === step.stepNumber
              ? 'bg-indigo-600 text-white shadow-sm font-bold scale-110'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'"
            :title="`Nhảy tới bước ${step.stepNumber}: ${step.title}`"
          >
            {{ step.stepNumber }}
          </button>
        </div>

        <div class="w-px h-5 bg-slate-300 dark:bg-slate-700" />

        <!-- Speed Selector -->
        <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <select 
            :value="lessonStore.playerSpeed" 
            @change="(e) => lessonStore.setPlayerSpeed(Number((e.target as HTMLSelectElement).value) as any)"
            class="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            title="Tốc độ tự động phát"
          >
            <option :value="0.5">0.5x</option>
            <option :value="1">1.0x</option>
            <option :value="1.5">1.5x</option>
            <option :value="2">2.0x</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useLessonStore } from '../stores/lesson';
import FormulaDisplay from './FormulaDisplay.vue';

const lessonStore = useLessonStore();
const isControlsVisible = ref(true);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const handleActivity = () => {
  isControlsVisible.value = true;
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  // Auto hide HUD after 4s when playing
  hideTimer = setTimeout(() => {
    if (lessonStore.isPlayerActive && lessonStore.isAutoPlaying) {
      isControlsVisible.value = false;
    }
  }, 4000);
};

const onLessonSelect = async (e: Event) => {
  const select = e.target as HTMLSelectElement;
  if (select.value) {
    await lessonStore.startPlayer(select.value);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!lessonStore.isPlayerActive) return;

  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      if (lessonStore.isPlayerFullscreen) {
        lessonStore.exitPlayerFullscreen();
      } else {
        lessonStore.stopPlayer();
      }
      break;
    case 'ArrowRight':
    case ' ':
      e.preventDefault();
      lessonStore.playerNextStep();
      handleActivity();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      lessonStore.playerPrevStep();
      handleActivity();
      break;
    case 'p':
    case 'P':
      e.preventDefault();
      lessonStore.toggleAutoPlay();
      handleActivity();
      break;
    case 'Home':
      e.preventDefault();
      lessonStore.playerFirstStep();
      handleActivity();
      break;
    case 'End':
      e.preventDefault();
      lessonStore.playerLastStep();
      handleActivity();
      break;
    case 'f':
    case 'F':
      e.preventDefault();
      lessonStore.togglePlayerFullscreen();
      handleActivity();
      break;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('mousemove', handleActivity);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('mousemove', handleActivity);
  if (hideTimer) clearTimeout(hideTimer);
});

watch(() => lessonStore.isPlayerActive, (active) => {
  if (active) {
    handleActivity();
  }
});
</script>

<style scoped>
/* Clean scrollbar for step jump bar */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
