import { ref } from 'vue';
import type { GeometryObject } from '../../core/types/geometry';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetObject: GeometryObject | null;
}

const state = ref<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  targetObject: null
});

export function useContextMenu() {
  const showMenu = (x: number, y: number, obj: GeometryObject | null) => {
    state.value = { visible: true, x, y, targetObject: obj };
  };
  
  const hideMenu = () => {
    if (state.value.visible) {
      state.value.visible = false;
    }
  };

  return { state, showMenu, hideMenu };
}
