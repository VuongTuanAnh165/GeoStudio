<template>
  <div v-if="state.visible"
       class="fixed z-[100] inset-0 pointer-events-none"
  >
    <!-- Background Dim overlay (optional, maybe too intrusive) -->
    <!-- <div class="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]"></div> -->

    <!-- Center Point -->
    <div 
      class="absolute w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-auto"
      :style="{ top: `${state.y}px`, left: `${state.x}px` }"
      @click.stop
      @contextmenu.prevent
    ></div>

    <!-- Connecting line to active item -->
    <svg v-if="gestureStore.isGestureActive && activeIndex !== -1" class="absolute inset-0 w-full h-full pointer-events-none z-0">
      <line 
        :x1="state.x" 
        :y1="state.y" 
        :x2="items[activeIndex].x" 
        :y2="items[activeIndex].y" 
        stroke="currentColor" 
        stroke-width="2" 
        class="text-blue-500/50" 
        stroke-dasharray="4 4"
      />
    </svg>

    <!-- Radial Items -->
    <div 
      v-for="(item, index) in items" 
      :key="item.id"
      class="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-200"
      :style="{ 
        top: `${item.y}px`, 
        left: `${item.x}px`,
        transitionDelay: `${index * 30}ms`
      }"
    >
      <button 
        @click="executeItem(item)"
        @mouseenter="activeIndex = index"
        @mouseleave="activeIndex = -1"
        class="group flex flex-col items-center justify-center w-16 h-16 rounded-full backdrop-blur-xl shadow-xl border border-white/20 transition-all duration-300"
        :class="[
          activeIndex === index 
            ? 'bg-blue-500 text-white scale-110 shadow-blue-500/30' 
            : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 scale-100',
          item.danger && activeIndex !== index ? 'text-red-500 dark:text-red-400' : '',
          item.danger && activeIndex === index ? 'bg-red-500 text-white shadow-red-500/30' : ''
        ]"
      >
        <Icon :name="item.icon" class="w-6 h-6 mb-1" />
        <span class="text-[10px] font-semibold opacity-0 group-hover:opacity-100 absolute -bottom-5 whitespace-nowrap bg-slate-800 text-white px-2 py-0.5 rounded"
              :class="activeIndex === index ? 'opacity-100' : ''"
        >
          {{ item.label }}
        </span>
      </button>
    </div>
    
    <!-- Title / Helper text at the center bottom -->
    <div class="absolute left-1/2 -translate-x-1/2 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md"
         :style="{ top: `${state.y + 120}px` }"
    >
      {{ state.targetObject ? state.targetObject.type.toUpperCase() : 'WORKSPACE' }}
      <div class="text-xs font-normal opacity-70">
        {{ gestureStore.isGestureActive ? 'Thả tay để chọn' : 'Click để chọn' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useContextMenu } from '../composables/useContextMenu';
import { useGeometryStore } from '../stores/geometry';
import { useGestureStore } from '../stores/gesture';
import { DeleteObjectCommand } from '../../core/commands/deletions';
import { ConstructionRegistry } from '../../core/geometry/constructions/ConstructionRegistry';
import type { ConstructionDefinition } from '../../core/geometry/constructions/ConstructionRegistry';
import { ClipboardManager } from '../../core/clipboard/ClipboardManager';

const { state, hideMenu } = useContextMenu();
const store = useGeometryStore();
const gestureStore = useGestureStore();

const activeIndex = ref(-1);
const radius = 100; // 100px radius for items

// Combine all actions into a unified list
const menuActions = computed(() => {
  const actions: any[] = [];
  
  if (state.value.targetObject) {
    // 1. Properties
    actions.push({ id: 'properties', label: 'Thuộc tính', icon: 'lucide:settings', action: () => handleAction('properties') });
    
    // 2. Constructions
    const objects = store.selectedIds.has(state.value.targetObject.id) ? store.selectedObjects : [state.value.targetObject];
    const cons = ConstructionRegistry.getInstance().getAvailable(objects);
    cons.forEach(c => {
      actions.push({ id: c.id, label: c.name, icon: c.icon, action: () => handleConstruct(c, objects) });
    });
    
    // 3. Duplicate
    actions.push({ id: 'duplicate', label: 'Nhân bản', icon: 'lucide:copy-plus', action: () => handleAction('duplicate') });
    
    // 4. Delete
    actions.push({ id: 'delete', label: 'Xóa', icon: 'lucide:trash-2', danger: true, action: () => handleAction('delete') });
  } else {
    // Empty space actions
    const objects = store.selectedObjects;
    const cons = ConstructionRegistry.getInstance().getAvailable(objects);
    cons.forEach(c => {
      actions.push({ id: c.id, label: c.name, icon: c.icon, action: () => handleConstruct(c, objects) });
    });
    
    actions.push({ id: 'paste', label: 'Dán', icon: 'lucide:clipboard-paste', action: () => handleAction('paste') });
    actions.push({ id: 'selectAll', label: 'Chọn tất cả', icon: 'lucide:check-square', action: () => handleAction('selectAll') });
    actions.push({ id: 'resetZoom', label: 'Reset View', icon: 'lucide:maximize', action: () => handleAction('resetZoom') });
    actions.push({ id: 'grid', label: 'Lưới', icon: 'mdi:grid', action: () => handleAction('grid') });
  }
  
  return actions;
});

// Calculate (x, y) for each item in a circle
const items = computed(() => {
  const total = menuActions.value.length;
  if (total === 0) return [];
  
  return menuActions.value.map((action, i) => {
    // Start at -90deg (top)
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    return {
      ...action,
      x: state.value.x + Math.cos(angle) * radius,
      y: state.value.y + Math.sin(angle) * radius,
      angle
    };
  });
});

// Helper functions for actions
const handleConstruct = (cons: ConstructionDefinition, objects: any[]) => {
  const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const command = cons.createCommand(objects, generateId);
  store.executeCommand(command);
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
    case 'duplicate':
      {
        const idsToCopy = store.selectedIds.size > 0 
          ? Array.from(store.selectedIds) 
          : state.value.targetObject ? [state.value.targetObject.id] : [];
        if (idsToCopy.length > 0) {
          ClipboardManager.copy(store.rawState, idsToCopy).then(() => {
            ClipboardManager.paste(store.rawState).then(cmd => {
              if (cmd) store.executeCommand(cmd);
            });
          });
        }
      }
      break;
    case 'paste':
      ClipboardManager.paste(store.rawState).then(cmd => {
        if (cmd) store.executeCommand(cmd);
      });
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
  }
};

const executeItem = (item: any) => {
  if (item && item.action) {
    item.action();
  }
  hideMenu();
};

// --- Spatial Pointer Tracking ---
watch(
  () => [gestureStore.cursorX, gestureStore.cursorY, state.value.visible, gestureStore.currentState],
  () => {
    const cx = gestureStore.cursorX;
    const cy = gestureStore.cursorY;
    const visible = state.value.visible;
    const gestureState = gestureStore.currentState;

    if (!visible || !gestureStore.isGestureActive) return;
    
    // Check if user released the pinch -> Execute active item
    if (gestureState === 'PINCH_RELEASE' || gestureState === 'HOVER') {
      if (activeIndex.value !== -1 && items.value[activeIndex.value]) {
        executeItem(items.value[activeIndex.value]);
      } else {
        hideMenu();
      }
      return;
    }
    
    // Calculate distance and angle from center
    const dx = cx - state.value.x;
    const dy = cy - state.value.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 30) {
      activeIndex.value = -1; // Deadzone in the center
      return;
    }
    
    let cursorAngle = Math.atan2(dy, dx);
    if (cursorAngle < 0) cursorAngle += Math.PI * 2;
    
    // Find closest item by angle
    let minDiff = Infinity;
    let bestIndex = -1;
    
    items.value.forEach((item, i) => {
      let itemAngle = item.angle;
      if (itemAngle < 0) itemAngle += Math.PI * 2;
      
      let diff = Math.abs(cursorAngle - itemAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = i;
      }
    });
    
    // If the angular difference is small enough, select it
    if (minDiff < Math.PI / items.value.length + 0.1) {
      activeIndex.value = bestIndex;
    } else {
      activeIndex.value = -1;
    }
  }
);

// Global click listener to close menu when clicking outside (for mouse users)
const onGlobalPointerUp = (e: PointerEvent) => {
  if (!state.value.visible) return;
  // Let the gesture tracker handle gesture clicks. This is for mouse.
  if (e.pointerType === 'mouse') {
    // Delay slightly so executeItem can run if they clicked a button
    setTimeout(() => {
      hideMenu();
    }, 100);
  }
};

const onGlobalScroll = () => {
  hideMenu();
};

onMounted(() => {
  window.addEventListener('pointerup', onGlobalPointerUp);
  window.addEventListener('resize', onGlobalScroll);
});

onUnmounted(() => {
  window.removeEventListener('pointerup', onGlobalPointerUp);
  window.removeEventListener('resize', onGlobalScroll);
});
</script>
