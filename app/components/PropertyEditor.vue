<template>
  <div class="flex flex-col h-full bg-white">
    <div class="px-4 py-2 border-b border-slate-100 bg-slate-50 font-semibold text-sm text-slate-700 shrink-0 shadow-sm">
      Properties
    </div>
    
    <div v-if="!selectedObj" class="p-4 text-center text-slate-400 text-sm italic flex-1 flex items-center justify-center">
      No object selected
    </div>
    
    <div v-else class="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-sm">
      <!-- Label -->
      <div class="flex flex-col gap-1.5">
        <label class="text-slate-600 font-medium">Label</label>
        <input 
          type="text" 
          class="border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
          :value="selectedObj.metadata?.label || ''"
          placeholder="e.g. A"
          @change="(e) => updateLabel((e.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Color -->
      <div class="flex flex-col gap-1.5">
        <label class="text-slate-600 font-medium">Color</label>
        <div class="flex items-center gap-3">
          <div class="relative w-8 h-8 rounded-md overflow-hidden border border-slate-200 shadow-sm">
            <input 
              type="color" 
              class="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
              :value="(selectedObj.style?.color as string) || '#0000ff'"
              @change="(e) => updateStyle('color', (e.target as HTMLInputElement).value)"
            />
          </div>
          <span class="text-slate-500 uppercase font-mono text-xs">{{ (selectedObj.style?.color as string) || '#0000ff' }}</span>
        </div>
      </div>

      <!-- Line Width -->
      <div class="flex flex-col gap-1.5">
        <div class="flex justify-between">
          <label class="text-slate-600 font-medium">Line Width</label>
          <span class="text-slate-400 text-xs">{{ selectedObj.style?.strokeWidth || 2 }}px</span>
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
          class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          @change="(e) => toggleLabel((e.target as HTMLInputElement).checked)"
        />
        <label :for="'showLabel_' + selectedObj.id" class="text-slate-700 cursor-pointer select-none">Show Label</label>
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
