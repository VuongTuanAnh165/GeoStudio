import { ref, watch, onUnmounted } from 'vue';
import { JSXGraphRenderer } from '../../core/renderer/JSXGraphRenderer';
import { useGeometryStore } from '../stores/geometry';
import { MouseHandler } from '../../core/ui/MouseHandler';
import { PointTool } from '../../core/ui/tools/PointTool';
import { SegmentTool } from '../../core/ui/tools/SegmentTool';
import { LineTool } from '../../core/ui/tools/LineTool';
import { RayTool } from '../../core/ui/tools/RayTool';
import { CircleTool } from '../../core/ui/tools/CircleTool';
import { PolygonTool } from '../../core/ui/tools/PolygonTool';
import { TriangleTool } from '../../core/ui/tools/TriangleTool';
import { SelectTool } from '../../core/ui/tools/SelectTool';
import { DeleteTool } from '../../core/ui/tools/DeleteTool';
import { ConstructionTool } from '../../core/ui/tools/ConstructionTool';
import type { Tool } from '../../core/ui/tools/Tool';

export function useCanvas() {
  const containerId = ref<string>('jxgbox');
  const renderer = new JSXGraphRenderer();
  const store = useGeometryStore();
  let initialized = false;
  
  let mouseHandler: MouseHandler | null = null;
  const tools = new Map<string, Tool>();
  tools.set('point', new PointTool());
  tools.set('segment', new SegmentTool());
  tools.set('line', new LineTool());
  tools.set('ray', new RayTool());
  tools.set('circle', new CircleTool());
  tools.set('polygon', new PolygonTool());
  tools.set('triangle', new TriangleTool());
  tools.set('select', new SelectTool());
  tools.set('delete', new DeleteTool());
  
  const constructionTypes = ['midpoint', 'perpendicular', 'parallel', 'angle_bisector', 'perpendicular_bisector', 'intersection', 'circumcircle', 'incircle', 'tangent'];
  constructionTypes.forEach(c => {
    tools.set(`construct_${c}`, new ConstructionTool(c));
  });

  const init = (id: string) => {
    containerId.value = id;
    renderer.init(id);
    initialized = true;

    mouseHandler = new MouseHandler({
      renderer,
      executeCommand: (cmd) => store.executeCommand(cmd),
      getObject: (id) => store.objects.get(id),
      getObjects: () => Array.from(store.objects.values()),
      generateId: (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      selectObject: store.selectObject
    });
    
    // Sync active tool from store
    watch(() => store.activeToolType, (toolId) => {
      if (mouseHandler) {
        if (!toolId) mouseHandler.setActiveTool(null);
        else mouseHandler.setActiveTool(tools.get(toolId) || null);
      }
    }, { immediate: true });
    
    // Initial full render
    syncToRenderer();

    // Track cursor coordinates
    renderer.on('move', (e: any) => {
      const pos = renderer.getMathPositionFromEvent(e);
      store.cursorCoords.x = pos.x;
      store.cursorCoords.y = pos.y;
    });

    renderer.on('boundingbox', () => {
      // @ts-ignore - we added getZoom
      if (typeof renderer.getZoom === 'function') {
        // @ts-ignore
        store.zoomLevel = renderer.getZoom();
      }
    });
  };

  const clear = () => {
    renderer.clear();
    initialized = false;
  };

  const zoomIn = () => {
    // @ts-ignore
    if (renderer.zoomIn) renderer.zoomIn();
  };

  const zoomOut = () => {
    // @ts-ignore
    if (renderer.zoomOut) renderer.zoomOut();
  };

  const resetZoom = () => {
    // @ts-ignore
    if (renderer.resetZoom) renderer.resetZoom();
  };

  const syncToRenderer = () => {
    if (!initialized) return;

    const currentIds = new Set<string>();

    // 1. Render or Update existing objects
    for (const [id, obj] of store.objects.entries()) {
      currentIds.add(id);
      const isSelected = store.selectedIds.has(id);
      renderer.updateObject(id, obj, isSelected);
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

  watch(
    () => store.selectedIds,
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
    syncToRenderer,
    zoomIn,
    zoomOut,
    resetZoom
  };
}
