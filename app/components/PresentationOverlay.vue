<template>
  <div 
    v-if="replayStore.isPresentationMode"
    class="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden"
    @mousemove="handleActivity"
  >
    <!-- Top Right Quick Exit Button -->
    <div 
      class="absolute top-4 right-4 transition-opacity duration-300 pointer-events-auto"
      :class="isControlsVisible ? 'opacity-100' : 'opacity-0'"
    >
      <button 
        @click="replayStore.exitPresentation()"
        class="px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/60 shadow-lg text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
        :title="$t('replay.exit_presentation', 'Thoát chế độ trình chiếu (Esc)')"
      >
        <Icon name="lucide:minimize-2" class="w-4 h-4" />
        <span>{{ $t('replay.exit', 'Thoát') }}</span>
        <kbd class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">Esc</kbd>
      </button>
    </div>

    <!-- Bottom Presentation HUD Bar -->
    <div 
      class="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-auto flex flex-col items-center gap-2.5 max-w-xl w-[90vw]"
      :class="isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
    >
      <!-- Step Description / Annotation Badge -->
      <div 
        v-if="replayStore.currentStep" 
        class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl text-center flex flex-col gap-1 max-w-lg"
      >
        <div class="text-xs font-bold text-blue-600 dark:text-blue-400">
          {{ $t('replay.step', 'Bước') }} {{ replayStore.currentStep.index }} / {{ replayStore.totalSteps }}: {{ replayStore.currentStep.label }}
        </div>
        <div class="text-sm font-medium text-slate-800 dark:text-slate-100">
          {{ replayStore.currentStep.description }}
        </div>
        <div v-if="replayStore.currentStep.annotation" class="text-xs text-amber-700 dark:text-amber-300 italic bg-amber-50 dark:bg-amber-900/40 px-3 py-1 rounded-lg border border-amber-200/50 dark:border-amber-700/40 mt-0.5">
          💬 {{ replayStore.currentStep.annotation }}
        </div>
      </div>

      <!-- Navigation & Playback Controls -->
      <div class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-2xl flex items-center gap-4">
        <!-- Prev Button -->
        <button 
          @click="replayStore.prevStep()"
          :disabled="replayStore.currentStepIndex <= 0"
          class="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          :title="$t('replay.prev_step', 'Bước trước (←)')"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </button>

        <!-- Play/Pause Button -->
        <button 
          @click="replayStore.togglePlay()"
          class="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-all hover:scale-105"
          :title="replayStore.isPlaying ? $t('replay.pause', 'Tạm dừng (P)') : $t('replay.play', 'Phát (P)')"
        >
          <Icon :name="replayStore.isPlaying ? 'lucide:pause' : 'lucide:play'" class="w-5 h-5" />
        </button>

        <!-- Next Button -->
        <button 
          @click="replayStore.nextStep()"
          :disabled="replayStore.currentStepIndex >= replayStore.totalSteps"
          class="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          :title="$t('replay.next_step', 'Bước sau (→)')"
        >
          <Icon name="lucide:arrow-right" class="w-5 h-5" />
        </button>

        <div class="w-px h-5 bg-slate-300 dark:bg-slate-700" />

        <!-- Speed Selector -->
        <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <select 
            :value="replayStore.speed" 
            @change="(e) => replayStore.setSpeed(Number((e.target as HTMLSelectElement).value) as any)"
            class="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option :value="0.5">0.5x</option>
            <option :value="1">1.0x</option>
            <option :value="1.5">1.5x</option>
            <option :value="2">2.0x</option>
          </select>
        </div>

        <div class="w-px h-5 bg-slate-300 dark:bg-slate-700" />

        <!-- Exit Button -->
        <button 
          @click="replayStore.exitPresentation()"
          class="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
          :title="$t('replay.exit_presentation', 'Thoát')"
        >
          {{ $t('replay.exit', 'Thoát') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useReplayStore } from '../stores/replay';

const replayStore = useReplayStore();
const isControlsVisible = ref(true);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const handleActivity = () => {
  isControlsVisible.value = true;
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  // Auto-hide controls after 3.5 seconds of inactivity
  hideTimer = setTimeout(() => {
    if (replayStore.isPresentationMode && replayStore.isPlaying) {
      isControlsVisible.value = false;
    }
  }, 3500);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!replayStore.isPresentationMode) return;

  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      replayStore.exitPresentation();
      break;
    case 'ArrowRight':
    case ' ':
      e.preventDefault();
      replayStore.nextStep();
      handleActivity();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      replayStore.prevStep();
      handleActivity();
      break;
    case 'p':
    case 'P':
      e.preventDefault();
      replayStore.togglePlay();
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

watch(() => replayStore.isPresentationMode, (active) => {
  if (active) {
    handleActivity();
  }
});
</script>
