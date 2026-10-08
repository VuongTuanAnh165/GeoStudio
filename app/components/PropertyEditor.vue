<template>
  <div class="flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
    <div class="px-5 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 shrink-0">
      {{ $t('panel.properties') }}
    </div>
    
    <div v-if="!selectedObj" class="p-4 text-center text-slate-400 dark:text-slate-500 text-sm italic flex-1 flex items-center justify-center">
      {{ $t('panel.no_object_selected') }}
    </div>
    
    <div v-else class="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-sm text-slate-700 dark:text-slate-300">
      <!-- Label -->
      <div class="flex flex-col gap-1.5">
        <label class="text-slate-600 dark:text-slate-400 font-medium">{{ $t('panel.label') }}</label>
        <input 
          type="text" 
          class="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          :value="selectedObj.metadata?.label || ''"
          placeholder="e.g. A"
          @change="(e) => updateLabel((e.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Color -->
      <div class="flex flex-col gap-1.5">
        <label class="text-slate-600 dark:text-slate-400 font-medium">{{ $t('panel.color') }}</label>
        <div class="flex items-center gap-3">
          <div class="relative w-8 h-8 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <input 
              type="color" 
              class="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
              :value="(selectedObj.style?.color as string) || '#0000ff'"
              @change="(e) => updateStyle('color', (e.target as HTMLInputElement).value)"
            />
          </div>
          <span class="text-slate-500 dark:text-slate-400 uppercase font-mono text-xs">{{ (selectedObj.style?.color as string) || '#0000ff' }}</span>
        </div>
      </div>

      <!-- Line Width -->
      <div class="flex flex-col gap-1.5">
        <div class="flex justify-between">
          <label class="text-slate-600 dark:text-slate-400 font-medium">{{ $t('panel.line_width') }}</label>
          <span class="text-slate-400 dark:text-slate-500 text-xs">{{ selectedObj.style?.strokeWidth || 2 }}px</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="10" 
          :value="(selectedObj.style?.strokeWidth as number) || 2"
          class="w-full accent-blue-500"
          @change="(e) => updateStyle('strokeWidth', parseInt((e.target as HTMLInputElement).value, 10))"
        />
      </div>

      <!-- Show Label Toggle -->
      <div class="flex items-center gap-2 mt-1">
        <input 
          type="checkbox" 
          :checked="selectedObj.style?.showLabel === true"
          :id="'showLabel_' + selectedObj.id"
          class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          @change="(e) => toggleLabel((e.target as HTMLInputElement).checked)"
        />
        <label :for="'showLabel_' + selectedObj.id" class="text-slate-700 dark:text-slate-300 cursor-pointer select-none">{{ $t('panel.show_label') }}</label>
      </div>

      <!-- Constraints -->
      <div v-if="selectedObj.constraints && selectedObj.constraints.length > 0" class="flex flex-col gap-1.5 mt-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <label class="text-slate-600 dark:text-slate-400 font-medium">{{ $t('panel.constraints') }}</label>
        <div v-for="(constraintId, index) in selectedObj.constraints" :key="index" class="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-md px-3 py-2 text-xs">
          <span class="truncate pr-2 font-mono text-slate-600 dark:text-slate-400">
            {{ store.constraints.get(constraintId)?.type || constraintId }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import { SetStyleCommand, ShowLabelCommand, HideLabelCommand } from '../../core/commands/mutations';

const store = useGeometryStore();

const selectedObj = computed(() => {
  if (store.selectedIds.size === 0) return null;
  const firstId = Array.from(store.selectedIds)[0];
  if (!firstId) return null;
  return store.objects.get(firstId) || null;
});

const updateStyle = (key: string, value: string | number) => {
  if (!selectedObj.value) return;
  const cmd = new SetStyleCommand(selectedObj.value.id, { [key]: value });
  store.executeCommand(cmd);
};

const updateLabel = (label: string) => {
  if (!selectedObj.value) return;
  const cmd = new ShowLabelCommand(selectedObj.value.id, label);
  store.executeCommand(cmd);
};

const toggleLabel = (show: boolean) => {
  if (!selectedObj.value) return;
  const cmd = show 
    ? new ShowLabelCommand(selectedObj.value.id)
    : new HideLabelCommand(selectedObj.value.id);
  store.executeCommand(cmd);
};
</script>
