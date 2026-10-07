<template>
  <div class="h-full bg-white border-l border-slate-200 flex flex-col w-72 shrink-0 shadow-sm z-10">
    <div class="flex flex-col flex-1 min-h-0 border-b border-slate-200">
      <div class="px-4 py-2 border-b border-slate-100 bg-slate-50 font-semibold text-sm text-slate-700 shrink-0">
        Objects
      </div>
      <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        <div 
          v-for="obj in objectList" 
          :key="obj.id"
          class="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors"
          :class="store.selectedIds.has(obj.id) ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100'"
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
              title="Toggle Visibility"
              @click.stop="toggleVisibility(obj)"
            >
              <Icon :name="obj.style?.visible === false ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
            </button>
            <button 
              class="p-1 rounded text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
              title="Delete Object"
              @click.stop="deleteObject(obj.id)"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div v-if="objectList.length === 0" class="p-4 text-center text-slate-400 text-sm italic">
          No objects yet
        </div>
      </div>
    </div>
    
    <div class="flex flex-col h-1/2 shrink-0 bg-slate-50">
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

const store = useGeometryStore();

const objectList = computed(() => Array.from(store.objects.values()));

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
