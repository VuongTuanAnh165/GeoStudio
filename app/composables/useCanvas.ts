import { ref, watch, onUnmounted, getCurrentInstance } from 'vue';
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
import { SliderTool } from '../../core/ui/tools/SliderTool';
import { ConstructionTool } from '../../core/ui/tools/ConstructionTool';
import { TransformTool } from '../../core/ui/tools/TransformTool';
import type { Tool } from '../../core/ui/tools/Tool';
import { SnapEngine } from '../../core/engine/SnapEngine';
import type { SnapResult } from '../../core/engine/SnapEngine';
import { UpdateSliderValueCommand } from '../../core/commands/mutations';
import { useReplayStore } from '../stores/replay';

export function useCanvas() {
  const containerId = ref<string>('jxgbox');
  const renderer = new JSXGraphRenderer();
  const store = useGeometryStore();
  const replayStore = useReplayStore();
  let initialized = false;
  
  const snapEngine = new SnapEngine(renderer);
  const currentSnapResult = ref<SnapResult | null>(null);
  
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
  tools.set('slider', new SliderTool());
  
  const constructionTypes = ['midpoint', 'perpendicular', 'parallel', 'angle_bisector', 'perpendicular_bisector', 'intersection', 'circumcircle', 'incircle', 'tangent', 'locus'];
  constructionTypes.forEach(c => {
    tools.set(`construct_${c}`, new ConstructionTool(c));
  });

  const measurementTypes = ['measure_distance', 'measure_angle', 'measure_area', 'measure_perimeter'];
  measurementTypes.forEach(m => {
    tools.set(`construct_${m}`, new ConstructionTool(m));
  });

  const transformTypes: Array<'translate' | 'rotate' | 'reflect' | 'homothety'> = ['translate', 'rotate', 'reflect', 'homothety'];
  transformTypes.forEach(t => {
    const tool = new TransformTool(t);
    tools.set(`transform_${t}`, tool);
    tools.set(`construct_${t}`, tool);
  });

  const init = (id: string) => {
    containerId.value = id;
    renderer.init(id);
    initialized = true;

    if (typeof renderer.setAnimationConfig === 'function' && store.settings.animation) {
      renderer.setAnimationConfig(store.settings.animation);
    }
    
    // Expose renderer to window for components that need to query JSXGraph state directly (like MeasurementPanel)
    (window as any).__geostudio_renderer = renderer;

    mouseHandler = new MouseHandler({
      renderer,
      executeCommand: (cmd) => store.executeCommand(cmd),
      getObject: (id) => store.objects.get(id),
      getObjects: () => Array.from(store.objects.values()),
      generateId: (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      selectObject: store.selectObject,
      snapEngine,
      getSnapSettings: () => store.snapSettings,
      setSnapResult: (res) => { currentSnapResult.value = res; }
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

    // Listen to native JSXGraph slider drag events
    renderer.onSliderChange = (sliderId: string, val: number) => {
      store.executeCommand(new UpdateSliderValueCommand(sliderId, val));
    };
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
    const isReplay = replayStore.isActive;
    const visibleIds = replayStore.visibleObjectIds;

    // 1. Render or Update existing objects
    for (const [id, obj] of store.objects.entries()) {
      currentIds.add(id);
      const isSelected = store.selectedIds.has(id);

      if (isReplay) {
        const isVisibleInStep = visibleIds.has(id);
        const projectedObj = {
          ...obj,
          style: {
            ...obj.style,
            visible: isVisibleInStep && obj.style?.visible !== false
          }
        };
        renderer.updateObject(id, projectedObj, isSelected);
      } else {
        renderer.updateObject(id, obj, isSelected);
      }
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

  watch(
    () => [replayStore.isActive, replayStore.currentStepIndex],
    () => {
      syncToRenderer();
    }
  );

  watch(
    () => store.settings.animation,
    (animConfig) => {
      if (animConfig && typeof renderer.setAnimationConfig === 'function') {
        renderer.setAnimationConfig(animConfig);
      }
    },
    { deep: true }
  );

  if (getCurrentInstance()) {
    onUnmounted(() => {
      clear();
    });
  }

  const clearTraces = () => {
    if (typeof renderer.clearTraces === 'function') {
      renderer.clearTraces();
    }
  };

  const animateObjectMove = (id: string, targetCoords: any, duration?: number) => {
    if (typeof renderer.animateObjectMove === 'function') {
      return renderer.animateObjectMove(id, targetCoords, duration);
    }
    return Promise.resolve();
  };

  return {
    init,
    clear,
    renderer,
    syncToRenderer,
    zoomIn,
    zoomOut,
    resetZoom,
    clearTraces,
    animateObjectMove,
    currentSnapResult
  };
}
