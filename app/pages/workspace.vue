<template>
  <div class="flex flex-col w-full h-full overflow-hidden">
    <!-- Header của workspace -->
    <header class="h-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 shrink-0 transition-colors z-20 shadow-sm">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
        </NuxtLink>
        <div class="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
        <span class="font-medium text-sm text-slate-800 dark:text-slate-200">Untitled Document</span>
      </div>
      
      <div class="flex items-center gap-3">
        <button 
          @click="toggleTheme" 
          class="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md"
          :title="isDark ? 'Light Mode' : 'Dark Mode'"
        >
          <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
        </button>
        <button class="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
          Share
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex flex-row overflow-hidden">
      <!-- Toolbar (Left) -->
      <Toolbar />

      <!-- Canvas Area (Center) -->
      <div class="flex-1 relative h-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
        <GeoCanvas />
      </div>

      <!-- Object Panel (Right) -->
      <ObjectPanel />
    </div>

    <!-- Status Bar (Bottom) -->
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useKeyboard } from '../composables/useKeyboard';
import { useGeometryStore } from '../stores/geometry';
import { RenameObjectCommand } from '../../core/commands/mutations';
import { NameGenerator } from '../../core/geometry/naming/NameGenerator';

const { toggleTheme, isDark } = useTheme();
const store = useGeometryStore();
useKeyboard();

const handleRenameEvent = (e: Event) => {
  const customEvent = e as CustomEvent;
  const hitId = customEvent.detail?.hitId;
  if (!hitId) return;

  const obj = store.objects.get(hitId);
  if (!obj) return;

  const currentLabel = (obj.metadata?.label as string) || '';
  const newName = window.prompt(`Rename object ${currentLabel || obj.type}:`, currentLabel);
  
  if (newName !== null && newName.trim() !== '') {
    const trimmed = newName.trim();
    if (trimmed !== currentLabel) {
      if (!NameGenerator.isNameAvailable(store.rawState, trimmed)) {
        window.alert(`Name "${trimmed}" is already taken!`);
        return;
      }
      store.executeCommand(new RenameObjectCommand(hitId, trimmed));
    }
  }
};

onMounted(() => {
  window.addEventListener('geostudio:rename-object', handleRenameEvent);
});

onUnmounted(() => {
  window.removeEventListener('geostudio:rename-object', handleRenameEvent);
});

definePageMeta({
  layout: 'workspace'
})
</script>

<style scoped>
/* Vite HMR cache fix */
</style>

