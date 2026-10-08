<template>
  <button
    class="relative group w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200"
    :class="[
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 shadow-inner'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
    ]"
    @click="$emit('click')"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    ref="buttonRef"
  >
    <!-- Icon from @nuxt/icon -->
    <Icon :name="icon" class="w-5 h-5 transition-transform group-hover:scale-110" />

    <!-- Tooltip (Teleported to body to avoid clipping) -->
    <Teleport to="body">
      <div
        v-if="isHovered"
        class="fixed px-2 py-1 bg-slate-800 text-white text-xs rounded pointer-events-none whitespace-nowrap flex items-center gap-2 z-[9999] shadow-lg animate-in fade-in duration-200"
        :style="{ top: `${tooltipY}px`, left: `${tooltipX}px` }"
      >
        <span class="font-medium">{{ label }}</span>
        <kbd v-if="shortcut" class="bg-slate-700 px-1 rounded text-[10px] text-slate-300">{{ shortcut }}</kbd>
      </div>
    </Teleport>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  icon: string;
  label: string;
  shortcut?: string;
  active?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();

const buttonRef = ref<HTMLElement | null>(null);
const isHovered = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);

const handleMouseEnter = () => {
  if (buttonRef.value) {
    const rect = buttonRef.value.getBoundingClientRect();
    tooltipX.value = rect.right + 10;
    tooltipY.value = rect.top + rect.height / 2 - 12;
    isHovered.value = true;
  }
};

const handleMouseLeave = () => {
  isHovered.value = false;
};
</script>
