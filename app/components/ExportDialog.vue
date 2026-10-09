<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ $t('export.title') }}</h3>
        <button @click="close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>
      
      <div class="p-6 grid grid-cols-2 gap-4">
        <!-- PNG -->
        <button 
          @click="handleExport('png')" 
          class="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 transition-all group"
          :disabled="isExporting"
        >
          <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Icon name="lucide:image" class="w-6 h-6" />
          </div>
          <span class="font-medium text-sm">{{ $t('export.png') }}</span>
        </button>

        <!-- SVG -->
        <button 
          @click="handleExport('svg')" 
          class="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-slate-700 dark:text-slate-300 transition-all group"
          :disabled="isExporting"
        >
          <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
            <Icon name="lucide:vector" class="w-6 h-6" />
          </div>
          <span class="font-medium text-sm">{{ $t('export.svg') }}</span>
        </button>

        <!-- JSON -->
        <button 
          @click="handleExport('json')" 
          class="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-700 dark:text-slate-300 transition-all group"
          :disabled="isExporting"
        >
          <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
            <Icon name="lucide:file-json" class="w-6 h-6" />
          </div>
          <span class="font-medium text-sm">{{ $t('export.json') }}</span>
        </button>

        <!-- Print -->
        <button 
          @click="handleExport('print')" 
          class="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-700 dark:text-slate-300 transition-all group"
          :disabled="isExporting"
        >
          <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
            <Icon name="lucide:printer" class="w-6 h-6" />
          </div>
          <span class="font-medium text-sm">{{ $t('export.print') }}</span>
        </button>
      </div>

      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
        <button @click="close" class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">{{ $t('workspace.cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useExport } from '../composables/useExport';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);
const { exportPNG, exportSVG, exportJSON, printDocument } = useExport();

const isExporting = ref(false);

const close = () => {
  if (isExporting.value) return;
  emit('update:modelValue', false);
};

const handleExport = async (type: 'png' | 'svg' | 'json' | 'print') => {
  isExporting.value = true;
  
  try {
    switch (type) {
      case 'png':
        await exportPNG();
        break;
      case 'svg':
        exportSVG();
        break;
      case 'json':
        exportJSON();
        break;
      case 'print':
        printDocument();
        break;
    }
    close();
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    isExporting.value = false;
  }
};
</script>
