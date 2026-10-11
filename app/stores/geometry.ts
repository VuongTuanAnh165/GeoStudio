import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CommandEngine } from '../../core/commands';
import { ConstructionGraph } from '../../core/geometry/graph/ConstructionGraph';
import type { GeometryObject, GeometryConstraint } from '../../core/types/geometry';
import type { GeometryCommand } from '../../core/types/commands';
import type { SnapSettings } from '../../core/engine/SnapEngine';
import { DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from '../../core/types/animation';

export const useGeometryStore = defineStore('geometry', () => {
  const engine = new CommandEngine({
    document: {
      version: '1.0',
      schemaVersion: 1,
      metadata: { 
        id: crypto.randomUUID(), 
        title: 'Untitled Document', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      },
      settings: { 
        theme: 'light', 
        gridVisible: true, 
        axisVisible: true, 
        snapEnabled: true, 
        dimension: 2,
        animation: { ...DEFAULT_ANIMATION_CONFIG }
      },
      viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      objects: [],
      constraints: []
    },
    selection: []
  });

  // Reactive State
  const objects = ref<Map<string, GeometryObject>>(new Map());
  const constraints = ref<Map<string, GeometryConstraint>>(new Map());
  let constructionGraph = new ConstructionGraph();
  const selectedIds = ref<Set<string>>(new Set());
  const activeToolType = ref<string | null>(null);
  const cursorCoords = ref<{x: number, y: number}>({ x: 0, y: 0 });
  const settings = ref(engine.currentState.document.settings);
  const snapSettings = ref<SnapSettings>({
    point: true,
    intersection: true,
    midpoint: true,
    line: true,
    grid: true,
    perpendicular: true
  });

  const canUndo = ref(false);
  const canRedo = ref(false);
  const lastModified = ref(0);

  // Sync logic: Pulls immutable state from Engine into Pinia's reactive refs
  const syncState = () => {
    const state = engine.currentState;
    
    // 1. Sync objects map
    const newObjectsMap = new Map<string, GeometryObject>();
    state.document.objects.forEach(obj => {
      newObjectsMap.set(obj.id, obj);
    });
    objects.value = newObjectsMap;

    // 1b. Sync constraints
    const newConstraintsMap = new Map<string, GeometryConstraint>();
    if (state.document.constraints) {
      state.document.constraints.forEach(c => {
        newConstraintsMap.set(c.id, c);
      });
    }
    constraints.value = newConstraintsMap;

    // 2. Sync selection
    selectedIds.value = new Set(state.selection);

    // 3. Rebuild Construction Graph
    // In a fully optimized system, we would incrementally update the graph.
    // For now, rebuilding guarantees correctness based on the document's truth.
    const graph = new ConstructionGraph();
    state.document.objects.forEach(obj => {
      graph.addNode(obj);
    });
    
    constructionGraph = graph;

    // 4. Sync settings
    settings.value = state.document.settings;

    // 5. Sync history flags
    canUndo.value = engine.historyManager.undoStack.length > 0;
    canRedo.value = engine.historyManager.redoStack.length > 0;
    
    lastModified.value++;
  };

  // Initial Sync
  syncState();

  // Getters
  const selectedObjects = computed(() => {
    return Array.from(selectedIds.value)
      .map(id => objects.value.get(id))
      .filter((obj): obj is GeometryObject => obj !== undefined);
  });

  // Actions
  const executeCommand = (command: GeometryCommand) => {
    const result = engine.validate(command);
    if (!result.valid) {
      console.warn('Command validation failed:', result.error);
      return result;
    }

    const execResult = engine.execute(command);
    if (execResult.valid) {
      syncState();
    } else {
      console.error('Command execution failed:', execResult.error);
    }
    return execResult;
  };

  const undo = () => {
    if (engine.undo()) {
      syncState();
      return true;
    }
    return false;
  };

  const redo = () => {
    if (engine.redo()) {
      syncState();
      return true;
    }
    return false;
  };

  const clearHistory = () => {
    engine.clearHistory();
    syncState(); 
  };

  const loadDocument = (doc: import('../../core/types/document').GeoDocument) => {
    engine.loadState({ document: JSON.parse(JSON.stringify(doc)), selection: [] });
    syncState();
  };

  const currentDocument = computed(() => engine.currentState.document);

  const beginBatch = (label: string) => {
    engine.historyManager.beginBatch(label);
  };

  const endBatch = () => {
    engine.historyManager.endBatch();
    syncState();
  };

  const selectObject = (id: string | null) => {
    if (id) {
      engine.currentState.selection = [id];
      selectedIds.value = new Set([id]);
    } else {
      engine.currentState.selection = [];
      selectedIds.value = new Set();
    }
  };

  const selectObjects = (ids: string[]) => {
    engine.currentState.selection = [...ids];
    selectedIds.value = new Set(ids);
  };

  return {
    // State
    objects,
    constraints,
    get constructionGraph() { return constructionGraph; },
    selectedIds,
    activeToolType,
    cursorCoords,
    zoomLevel: ref(100),
    settings,
    snapSettings,
    
    // Getters
    selectedObjects,
    canUndo,
    canRedo,
    lastModified,
    
    // Actions
    executeCommand,
    selectObject,
    selectObjects,
    undo,
    redo,
    clearHistory,
    loadDocument,
    beginBatch,
    endBatch,
    updateAnimationConfig: (config: Partial<AnimationConfig>) => {
      if (!settings.value.animation) {
        settings.value.animation = { ...DEFAULT_ANIMATION_CONFIG };
      }
      settings.value.animation = {
        ...settings.value.animation,
        ...config
      };
      engine.currentState.document.settings.animation = { ...settings.value.animation };
      lastModified.value++;
    },
    
    // Expose engine current state directly if components need raw doc
    currentDocument,
    get rawState() {
      return engine.currentState;
    }
  };
});
