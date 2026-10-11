<template>
  <div 
    v-if="replayStore.isActive && !replayStore.isPresentationMode"
    class="fixed right-4 bottom-14 z-30 w-96 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col max-h-[75vh] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
  >
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Icon name="lucide:history" class="w-4 h-4" />
        </div>
        <div>
          <h3 class="font-semibold text-xs text-slate-800 dark:text-slate-100">{{ $t('replay.title', 'Các bước dựng hình') }}</h3>
          <span class="text-[10px] text-slate-500 dark:text-slate-400">
            {{ replayStore.totalSteps > 0 ? `${$t('replay.step', 'Bước')} ${replayStore.currentStepIndex} / ${replayStore.totalSteps}` : $t('replay.no_steps', 'Chưa có bước dựng nào') }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button 
          @click="replayStore.enterPresentation()"
          class="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1"
          :title="$t('replay.presentation_mode', 'Chế độ trình chiếu toàn màn hình (F11)')"
        >
          <Icon name="lucide:presentation" class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ $t('replay.presentation_btn', 'Trình chiếu') }}</span>
        </button>

        <button 
          @click="replayStore.stopReplay()"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('replay.close', 'Đóng')"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Playback Controls -->
    <div class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 flex flex-col gap-2 shrink-0">
      <!-- Step Indicator Bar -->
      <div class="w-full flex items-center gap-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          v-for="step in replayStore.steps" 
          :key="step.index"
          @click="replayStore.goToStep(step.index)"
          class="flex-1 h-full cursor-pointer transition-all duration-200"
          :class="step.index <= replayStore.currentStepIndex ? 'bg-blue-600 dark:bg-blue-500' : 'bg-transparent hover:bg-slate-300 dark:hover:bg-slate-600'"
          :title="`${$t('replay.step', 'Bước')} ${step.index}: ${step.label}`"
        />
      </div>

      <div class="flex items-center justify-between">
        <!-- Navigation Buttons -->
        <div class="flex items-center gap-1">
          <button 
            @click="replayStore.firstStep()" 
            :disabled="replayStore.currentStepIndex <= 1"
            class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            :title="$t('replay.first_step', 'Bước đầu tiên')"
          >
            <Icon name="lucide:skip-back" class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="replayStore.prevStep()" 
            :disabled="replayStore.currentStepIndex <= 0"
            class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            :title="$t('replay.prev_step', 'Bước trước')"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
          </button>
          
          <button 
            @click="replayStore.togglePlay()" 
            :disabled="replayStore.totalSteps === 0"
            class="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/30 transition-all disabled:opacity-50"
            :title="replayStore.isPlaying ? $t('replay.pause', 'Tạm dừng') : $t('replay.play', 'Tự động phát')"
          >
            <Icon :name="replayStore.isPlaying ? 'lucide:pause' : 'lucide:play'" class="w-3.5 h-3.5" />
          </button>

          <button 
            @click="replayStore.nextStep()" 
            :disabled="replayStore.currentStepIndex >= replayStore.totalSteps"
            class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            :title="$t('replay.next_step', 'Bước tiếp theo')"
          >
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
          <button 
            @click="replayStore.lastStep()" 
            :disabled="replayStore.currentStepIndex >= replayStore.totalSteps"
            class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            :title="$t('replay.last_step', 'Bước cuối cùng')"
          >
            <Icon name="lucide:skip-forward" class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Speed Selector -->
        <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span class="text-[10px] font-medium">{{ $t('replay.speed', 'Tốc độ:') }}</span>
          <select 
            :value="replayStore.speed" 
            @change="(e) => replayStore.setSpeed(Number((e.target as HTMLSelectElement).value) as any)"
            class="bg-slate-100 dark:bg-slate-700 border-none rounded px-1.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
          >
            <option :value="0.5">0.5x</option>
            <option :value="1">1x</option>
            <option :value="1.5">1.5x</option>
            <option :value="2">2x</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active Step Highlight Banner -->
    <div v-if="replayStore.currentStep" class="px-4 py-2.5 bg-blue-50/70 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30 shrink-0">
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            {{ $t('replay.current_step', 'Bước hiện tại') }} {{ replayStore.currentStep.index }}
          </span>
          <p class="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
            {{ replayStore.currentStep.description }}
          </p>
          <p v-if="replayStore.currentStep.annotation" class="text-[11px] text-amber-700 dark:text-amber-300 italic mt-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-700/50">
            💬 {{ replayStore.currentStep.annotation }}
          </p>
        </div>
        <button 
          @click="openAnnotationPrompt(replayStore.currentStep)"
          class="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition-colors shrink-0"
          :title="$t('replay.edit_annotation', 'Thêm / sửa chú thích bài giảng')"
        >
          <Icon name="lucide:message-square-plus" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Step List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
      <div 
        v-for="step in replayStore.steps" 
        :key="step.index"
        @click="replayStore.goToStep(step.index)"
        class="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border"
        :class="step.index === replayStore.currentStepIndex 
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600/60 shadow-sm' 
          : step.index < replayStore.currentStepIndex 
            ? 'bg-white/60 dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/40' 
            : 'opacity-50 bg-white/30 dark:bg-slate-800/20 border-transparent hover:opacity-80'"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div 
            class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            :class="step.index === replayStore.currentStepIndex 
              ? 'bg-blue-600 text-white' 
              : step.index < replayStore.currentStepIndex 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'"
          >
            {{ step.index }}
          </div>
          <Icon :name="getIcon(step.type)" class="w-4 h-4 text-slate-500 shrink-0" />
          <div class="truncate">
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">{{ step.label }}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{{ step.description }}</span>
          </div>
        </div>

        <button 
          v-if="step.annotation"
          @click.stop="openAnnotationPrompt(step)"
          class="text-amber-500 hover:text-amber-600 p-1 shrink-0"
          :title="step.annotation"
        >
          <Icon name="lucide:message-square" class="w-3.5 h-3.5" />
        </button>
      </div>

      <div v-if="replayStore.steps.length === 0" class="py-8 text-center text-slate-400 text-xs italic">
        {{ $t('replay.no_steps_desc', 'Chưa có đối tượng hình học nào trong tài liệu.') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReplayStore } from '../stores/replay';
import type { ConstructionStepItem } from '../../core/types/replay';

const replayStore = useReplayStore();

const getIcon = (type: string) => {
  switch (type) {
    case 'point': return 'mdi:circle-small';
    case 'segment': return 'mdi:vector-line';
    case 'line': return 'lucide:arrow-left-right';
    case 'ray': return 'lucide:move-right';
    case 'circle': return 'lucide:circle';
    case 'triangle': return 'lucide:triangle';
    case 'polygon': return 'lucide:hexagon';
    case 'slider': return 'lucide:sliders-horizontal';
    case 'locus': return 'lucide:spline';
    default: return 'lucide:box';
  }
};

const openAnnotationPrompt = (step: ConstructionStepItem) => {
  const current = step.annotation || '';
  const newText = prompt(`Nhập chú thích bài giảng cho bước ${step.index} (${step.label}):`, current);
  if (newText !== null) {
    replayStore.setAnnotation(step.id, newText.trim());
  }
};
</script>
