<template>
  <div class="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-l border-slate-200/50 dark:border-slate-700/50 flex flex-col w-72 shrink-0 z-10 transition-colors shadow-[-4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.2)]">
    <!-- Objects Section -->
    <div class="flex flex-col h-[40%] min-h-0 border-b border-slate-200/50 dark:border-slate-700/50">
      <div class="px-5 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 shrink-0">
        {{ $t('panel.objects') }}
      </div>
      <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scrollbar-thin">
        <div 
          v-for="obj in objectList" 
          :key="obj.id"
          class="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors"
          :class="store.selectedIds.has(obj.id) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'"
          @click="selectObject(obj.id)"
        >
          <div class="flex items-center gap-2 truncate">
            <Icon :name="getIcon(obj.type)" class="w-4 h-4 opacity-70" />
            <span class="text-sm truncate">
              {{ obj.metadata?.label || obj.type + '_' + obj.id.split('_').pop()?.substring(0,4) }}
            </span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button 
              class="p-1 rounded text-slate-400"
              :class="store.selectedIds.has(obj.id) ? 'hover:bg-blue-200 hover:text-blue-900' : 'hover:bg-slate-200 hover:text-slate-600'"
              :title="$t('panel.toggle_visibility')"
              @click.stop="toggleVisibility(obj)"
            >
              <Icon :name="obj.style?.visible === false ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
            </button>
            <button 
              class="p-1 rounded text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
              :title="$t('panel.delete_object')"
              @click.stop="deleteObject(obj.id)"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div v-if="objectList.length === 0" class="p-4 text-center text-slate-400 text-sm italic">
          {{ $t('panel.no_objects') }}
        </div>
      </div>
    </div>
    
    <!-- Measurements Section -->
    <div class="flex flex-col h-[25%] shrink-0 border-b border-slate-200/50 dark:border-slate-700/50">
      <MeasurementPanel />
    </div>

    <!-- Properties Section -->
    <div class="flex flex-col flex-1 shrink-0 bg-slate-50">
      <PropertyEditor />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import { ToggleVisibilityCommand } from '../../core/commands/mutations';
import { DeleteObjectCommand } from '../../core/commands/deletions';
import type { GeometryObject } from '../../core/types/geometry';
import PropertyEditor from './PropertyEditor.vue';
import MeasurementPanel from './MeasurementPanel.vue';

const store = useGeometryStore();

const objectList = computed(() => Array.from(store.objects.values()).filter(obj => obj.type !== 'measurement'));

const getIcon = (type: string) => {
  switch(type) {
    case 'point': return 'mdi:circle-small';
    case 'segment': return 'mdi:vector-line';
    case 'line': return 'lucide:arrow-left-right';
    case 'ray': return 'lucide:move-right';
    case 'circle': return 'lucide:circle';
    case 'triangle': return 'lucide:triangle';
    case 'polygon': return 'lucide:hexagon';
    default: return 'lucide:box';
  }
};

const selectObject = (id: string) => {
  store.selectObject(id);
};

const toggleVisibility = (obj: GeometryObject) => {
  store.executeCommand(new ToggleVisibilityCommand(obj.id));
};

const deleteObject = (id: string) => {
  store.executeCommand(new DeleteObjectCommand(id));
  if (store.selectedIds.has(id)) {
    store.selectedIds.delete(id);
    store.rawState.selection = Array.from(store.selectedIds);
  }
};
</script>
