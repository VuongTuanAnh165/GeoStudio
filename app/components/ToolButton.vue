<template>
  <button
    class="relative group w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200"
    :class="[
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 shadow-inner'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
    ]"
    @click="$emit('click')"
  >
    <!-- Icon from @nuxt/icon -->
    <Icon :name="icon" class="w-5 h-5 transition-transform group-hover:scale-110" />

    <!-- Tooltip (CSS only, using absolute positioning) -->
    <div
      class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-2 z-50"
    >
      <span class="font-medium">{{ label }}</span>
      <kbd v-if="shortcut" class="bg-slate-700 px-1 rounded text-[10px] text-slate-300">{{ shortcut }}</kbd>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  shortcut?: string;
  active?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>
