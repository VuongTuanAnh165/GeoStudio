import { ref, watch, onUnmounted } from 'vue';
import { JSXGraphRenderer } from '../../core/renderer/JSXGraphRenderer';
import { useGeometryStore } from '../stores/geometry';

export function useCanvas() {
  const containerId = ref<string>('jxgbox');
  const renderer = new JSXGraphRenderer();
  const store = useGeometryStore();
  let initialized = false;

  const init = (id: string) => {
    containerId.value = id;
    renderer.init(id);
    initialized = true;
    
    // Initial full render
    syncToRenderer();
  };

  const clear = () => {
    renderer.clear();
    initialized = false;
  };

  const syncToRenderer = () => {
    if (!initialized) return;

    const currentIds = new Set<string>();

    // 1. Render or Update existing objects
    for (const [id, obj] of store.objects.entries()) {
      currentIds.add(id);
      renderer.updateObject(id, obj);
    }

    // 2. Remove deleted objects
    const renderedIds = renderer.getRenderedIds();
    for (const id of renderedIds) {
      if (!currentIds.has(id)) {
        renderer.removeObject(id);
      }
    }
  };

  // Watch the store objects map for reference changes.
  // Our geometry store creates a new Map on every state change.
  watch(
    () => store.objects,
    () => {
      syncToRenderer();
    },
    { deep: true }
  );

  onUnmounted(() => {
    clear();
  });

  return {
    init,
    clear,
    renderer,
    syncToRenderer
  };
}
