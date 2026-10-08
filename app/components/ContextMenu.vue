<template>
  <div v-if="state.visible"
       :style="{ top: `${state.y}px`, left: `${state.x}px` }"
       class="fixed z-[100] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl shadow-black/10 dark:shadow-black/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-1 min-w-[200px] text-sm text-slate-700 dark:text-slate-300 flex flex-col overflow-visible"
       @click.stop
       @contextmenu.prevent
  >
    <!-- Object Context -->
    <template v-if="state.targetObject">
      <div class="px-4 py-2.5 font-semibold border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
        <span>{{ state.targetObject.metadata?.label || $t(`tools.${state.targetObject.type}`, formatType(state.targetObject.type)) }}</span>
        <span class="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded">{{ $t(`tools.${state.targetObject.type}`, formatType(state.targetObject.type)) }}</span>
      </div>
      
      <button @click="handleAction('properties')" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
        <Icon name="lucide:settings" class="w-4 h-4 text-slate-400"/> 
        {{ $t('context.properties', 'Properties') }}
      </button>
      
      <!-- Construct Submenu -->
      <div class="relative group">
        <button class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors">
          <span class="flex items-center gap-3"><Icon name="lucide:hammer" class="w-4 h-4 text-slate-400"/> {{ $t('context.construct', 'Construct') }}</span>
          <Icon name="lucide:chevron-right" class="w-4 h-4 opacity-50"/>
        </button>
        <!-- Submenu panel -->
        <div class="absolute left-full top-0 hidden group-hover:block ml-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-1 min-w-[160px]">
          <button 
            v-for="cons in availableConstructions" 
            :key="cons.id" 
            @click="handleConstruct(cons)" 
            class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
            :title="$t(`tools.${cons.id}_desc`, cons.description)"
          >
            <Icon :name="cons.icon" class="w-4 h-4 text-slate-400"/> {{ $t(`tools.${cons.id}`, cons.name) }}
          </button>
          
          <div v-if="availableConstructions.length === 0" class="px-4 py-3 text-slate-400 dark:text-slate-500 italic text-xs text-center">
            {{ $t('context.no_constructions', 'No constructions') }}
          </div>
        </div>
      </div>

      <div class="h-px bg-slate-200/50 dark:bg-slate-700/50 my-1 mx-2"></div>
      <button @click="handleAction('delete')" class="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors">
        <Icon name="lucide:trash-2" class="w-4 h-4 opacity-70"/> 
        {{ $t('tools.delete', 'Delete') }}
      </button>
    </template>
    
    <!-- Empty Canvas Context -->
    <template v-else>
      <div v-if="store.selectedIds.size > 0" class="relative group">
        <button class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors">
          <span class="flex items-center gap-3"><Icon name="lucide:hammer" class="w-4 h-4 text-slate-400"/> {{ $t('context.construct', 'Construct') }}</span>
          <Icon name="lucide:chevron-right" class="w-4 h-4 opacity-50"/>
        </button>
        <div class="absolute left-full top-0 hidden group-hover:block ml-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-1 min-w-[160px]">
          <button 
            v-for="cons in emptySpaceAvailableConstructions" 
            :key="cons.id" 
            @click="handleConstructEmpty(cons)" 
            class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
            :title="$t(`tools.${cons.id}_desc`, cons.description)"
          >
            <Icon :name="cons.icon" class="w-4 h-4 text-slate-400"/> {{ $t(`tools.${cons.id}`, cons.name) }}
          </button>
          <div v-if="emptySpaceAvailableConstructions.length === 0" class="px-4 py-3 text-slate-400 dark:text-slate-500 italic text-xs text-center">
            {{ $t('context.no_constructions', 'No constructions') }}
          </div>
        </div>
      </div>

      <button @click="handleAction('selectAll')" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
        <Icon name="lucide:check-square" class="w-4 h-4 text-slate-400"/> 
        {{ $t('context.select_all', 'Select All') }}
      </button>
      <button @click="handleAction('resetZoom')" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
        <Icon name="lucide:maximize" class="w-4 h-4 text-slate-400"/> 
        {{ $t('context.reset_view', 'Reset View') }}
      </button>
      
      <div class="h-px bg-slate-200/50 dark:bg-slate-700/50 my-1 mx-2"></div>
      
      <button @click="handleAction('grid')" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors">
        <span class="flex items-center gap-3"><Icon name="mdi:grid" class="w-4 h-4 text-slate-400"/> {{ $t('context.grid', 'Grid') }}</span>
        <Icon v-if="store.settings.gridVisible" name="lucide:check" class="w-4 h-4 text-blue-500" />
      </button>
      <button @click="handleAction('axis')" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors">
        <span class="flex items-center gap-3"><Icon name="mdi:axis-arrow" class="w-4 h-4 text-slate-400"/> {{ $t('context.axis', 'Axis') }}</span>
        <Icon v-if="store.settings.axisVisible" name="lucide:check" class="w-4 h-4 text-blue-500" />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useContextMenu } from '../composables/useContextMenu';
import { useGeometryStore } from '../stores/geometry';
import { DeleteObjectCommand } from '../../core/commands/deletions';
import { ConstructionRegistry } from '../../core/geometry/constructions/ConstructionRegistry';
import type { ConstructionDefinition } from '../../core/geometry/constructions/ConstructionRegistry';
import type { GeometryObject } from '../../core/types/geometry';

const { state, hideMenu } = useContextMenu();
const store = useGeometryStore();

const formatType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const targetObjectsForConstruction = computed<GeometryObject[]>(() => {
  if (!state.value.targetObject) return [];
  if (store.selectedIds.has(state.value.targetObject.id)) {
    return store.selectedObjects;
  }
  return [state.value.targetObject];
});

const availableConstructions = computed(() => {
  const objects = targetObjectsForConstruction.value;
  if (objects.length === 0) return [];
  return ConstructionRegistry.getInstance().getAvailable(objects);
});

const emptySpaceAvailableConstructions = computed(() => {
  const objects = store.selectedObjects;
  if (objects.length === 0) return [];
  return ConstructionRegistry.getInstance().getAvailable(objects);
});

const handleConstruct = (cons: ConstructionDefinition) => {
  const objects = targetObjectsForConstruction.value;
  const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const command = cons.createCommand(objects, generateId);
  store.executeCommand(command);
  hideMenu();
};

const handleConstructEmpty = (cons: ConstructionDefinition) => {
  const objects = store.selectedObjects;
  const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const command = cons.createCommand(objects, generateId);
  store.executeCommand(command);
  hideMenu();
};

const handleAction = (action: string) => {
  switch (action) {
    case 'delete':
      if (state.value.targetObject) {
        store.executeCommand(new DeleteObjectCommand(state.value.targetObject.id));
        store.selectObject(null);
      }
      break;
    case 'properties':
      if (state.value.targetObject) {
        store.selectObject(state.value.targetObject.id);
      }
      break;
    case 'selectAll':
      store.selectObjects(Array.from(store.objects.keys()));
      break;
    case 'resetZoom':
      window.dispatchEvent(new CustomEvent('geostudio:zoom-reset'));
      break;
    case 'grid':
      store.settings.gridVisible = !store.settings.gridVisible;
      break;
    case 'axis':
      store.settings.axisVisible = !store.settings.axisVisible;
      break;
  }
  
  hideMenu();
};

// Global click listener to close menu when clicking outside
const onGlobalClick = () => {
  hideMenu();
};
const onGlobalScroll = () => {
  hideMenu();
};

onMounted(() => {
  window.addEventListener('click', onGlobalClick);
  window.addEventListener('resize', onGlobalScroll);
});

onUnmounted(() => {
  window.removeEventListener('click', onGlobalClick);
  window.removeEventListener('resize', onGlobalScroll);
});
</script>
