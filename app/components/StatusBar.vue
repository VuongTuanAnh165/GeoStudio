<template>
  <div class="h-6 shrink-0 bg-slate-800 text-slate-300 text-xs flex items-center justify-between px-3 select-none">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1" title="Object Count">
        <Icon name="lucide:layers" class="w-3.5 h-3.5" />
        <span>{{ store.objects.size }} objects</span>
      </div>
      
      <div v-if="store.activeToolType" class="flex items-center gap-1 text-blue-300" title="Active Tool">
        <Icon name="lucide:pen-tool" class="w-3.5 h-3.5" />
        <span class="capitalize">{{ store.activeToolType }} tool</span>
      </div>
      <div v-else class="flex items-center gap-1 text-slate-400" title="Active Tool">
        <Icon name="lucide:mouse-pointer" class="w-3.5 h-3.5" />
        <span>Select tool</span>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1 font-mono text-[10px]" title="Cursor Position">
        <Icon name="lucide:crosshair" class="w-3 h-3" />
        <span>{{ cursorX }}, {{ cursorY }}</span>
      </div>
      
      <div class="flex items-center gap-1" title="Zoom">
        <Icon name="lucide:zoom-in" class="w-3.5 h-3.5" />
        <span>100%</span> <!-- Hardcoded for MVP as zooming is built into JSXGraph but not explicitly tracked yet -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGeometryStore } from '../stores/geometry';

const store = useGeometryStore();

const cursorX = computed(() => store.cursorCoords.x.toFixed(2));
const cursorY = computed(() => store.cursorCoords.y.toFixed(2));
</script>

<style scoped>
</style>
