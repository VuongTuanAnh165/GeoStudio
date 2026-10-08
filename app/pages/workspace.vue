<template>
  <div class="flex flex-col w-full h-full overflow-hidden">
    <!-- Header của workspace -->
    <header class="h-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 shrink-0 transition-colors z-20 shadow-sm">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
        </NuxtLink>
        <div class="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
        <span class="font-medium text-sm text-slate-800 dark:text-slate-200">{{ $t('workspace.untitled') }}</span>
      </div>
      
      <div class="flex items-center gap-3">
        <button 
          @click="toggleTheme" 
          class="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md"
          :title="isDark ? $t('statusbar.light_mode') : $t('statusbar.dark_mode')"
        >
          <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
        </button>
        <button 
          @click="toggleLanguage" 
          class="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md font-medium text-xs uppercase"
          :title="$t('statusbar.change_language')"
        >
          {{ locale }}
        </button>
        <button class="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
          {{ $t('workspace.share') }}
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

    <!-- Rename Modal -->
    <div v-if="showRenameModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ $t('workspace.rename_object') }}</h3>
        </div>
        <div class="p-6">
          <label for="object-name" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{{ $t('workspace.new_name') }}</label>
          <input 
            id="object-name"
            type="text" 
            v-model="renameInput"
            @keyup.enter="confirmRename"
            @keyup.esc="cancelRename"
            ref="renameInputRef"
            class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            :placeholder="$t('workspace.enter_name')"
          />
          <p v-if="renameError" class="mt-2 text-sm text-red-500 dark:text-red-400">{{ renameError }}</p>
        </div>
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
          <button @click="cancelRename" class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">{{ $t('workspace.cancel') }}</button>
          <button @click="confirmRename" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shadow-blue-500/20">{{ $t('workspace.rename') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useKeyboard } from '../composables/useKeyboard';
import { useGeometryStore } from '../stores/geometry';
import { RenameObjectCommand } from '../../core/commands/mutations';
import { NameGenerator } from '../../core/geometry/naming/NameGenerator';
import { useI18n } from '#imports';

const { toggleTheme, isDark } = useTheme();
const store = useGeometryStore();
const { locale, setLocale } = useI18n();
useKeyboard();

const toggleLanguage = () => {
  setLocale(locale.value === 'vi' ? 'en' : 'vi');
};

const showRenameModal = ref(false);
const renameTargetId = ref('');
const renameInput = ref('');
const renameError = ref('');
const renameOriginalLabel = ref('');
const renameInputRef = ref<HTMLInputElement | null>(null);

const handleRenameEvent = (e: Event) => {
  const customEvent = e as CustomEvent;
  const hitId = customEvent.detail?.hitId;
  if (!hitId) return;

  const obj = store.objects.get(hitId);
  if (!obj) return;

  renameTargetId.value = hitId;
  renameOriginalLabel.value = (obj.metadata?.label as string) || '';
  renameInput.value = renameOriginalLabel.value;
  renameError.value = '';
  showRenameModal.value = true;
  
  nextTick(() => {
    if (renameInputRef.value) {
      renameInputRef.value.focus();
      renameInputRef.value.select();
    }
  });
};

const cancelRename = () => {
  showRenameModal.value = false;
  renameError.value = '';
};

const confirmRename = () => {
  const newName = renameInput.value;
  
  if (newName !== null && newName.trim() !== '') {
    const trimmed = newName.trim();
    if (trimmed !== renameOriginalLabel.value) {
      if (!NameGenerator.isNameAvailable(store.rawState, trimmed)) {
        renameError.value = `Name "${trimmed}" is already taken!`;
        return;
      }
      store.executeCommand(new RenameObjectCommand(renameTargetId.value, trimmed));
    }
  }
  
  showRenameModal.value = false;
  renameError.value = '';
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

