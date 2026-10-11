import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type {
  GridConfig,
  AxisConfig,
  GridStyle,
  ParsedEquation,
  GeometryEquationInfo
} from '../../core/types/coordinate';
import { EquationParser } from '../../core/geometry/coordinate/EquationParser';
import { EquationFormatter } from '../../core/geometry/coordinate/EquationFormatter';
import {
  CreateLineCommand,
  CreateCircleCommand,
  CreateFunctionGraphCommand
} from '../../core/commands/primitives';
import { useGeometryStore } from './geometry';

export const useCoordinateStore = defineStore('coordinate', () => {
  const geometryStore = useGeometryStore();

  // 1. Reactive State
  const gridConfig = ref<GridConfig>({
    visible: true,
    size: 1,
    style: 'lines',
    color: '#cbd5e1',
    opacity: 0.6
  });

  const axisConfig = ref<AxisConfig>({
    visible: true,
    showLabels: true,
    showArrows: true,
    color: '#64748b'
  });

  const isPanelOpen = ref(false);
  const activeTab = ref<'input' | 'selected' | 'grid'>('input');
  const inputEquation = ref('y = 2x - 1');
  const inputError = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  // Sync with geometryStore settings
  watch(
    () => geometryStore.settings.gridVisible,
    (val) => {
      gridConfig.value.visible = val;
    },
    { immediate: true }
  );

  watch(
    () => geometryStore.settings.axisVisible,
    (val) => {
      axisConfig.value.visible = val;
    },
    { immediate: true }
  );

  // 2. Getters
  const parsedInputEquation = computed<ParsedEquation | null>(() => {
    if (!inputEquation.value || !inputEquation.value.trim()) return null;
    try {
      return EquationParser.parse(inputEquation.value);
    } catch {
      return null;
    }
  });

  const selectedEquation = computed<GeometryEquationInfo | null>(() => {
    const selected = geometryStore.selectedObjects;
    if (!selected || selected.length === 0) return null;
    // Format the first selected geometric object
    const first = selected[0];
    if (!first) return null;
    return EquationFormatter.format(first);
  });

  // 3. Actions
  const openPanel = (tab: 'input' | 'selected' | 'grid' = 'input') => {
    activeTab.value = tab;
    isPanelOpen.value = true;
    inputError.value = null;
    successMessage.value = null;
  };

  const closePanel = () => {
    isPanelOpen.value = false;
  };

  const togglePanel = (tab?: 'input' | 'selected' | 'grid') => {
    if (tab && activeTab.value !== tab) {
      openPanel(tab);
    } else {
      isPanelOpen.value = !isPanelOpen.value;
    }
  };

  const toggleGrid = () => {
    gridConfig.value.visible = !gridConfig.value.visible;
    geometryStore.settings.gridVisible = gridConfig.value.visible;
  };

  const toggleAxis = () => {
    axisConfig.value.visible = !axisConfig.value.visible;
    geometryStore.settings.axisVisible = axisConfig.value.visible;
  };

  const setGridSize = (size: number) => {
    if (size > 0) {
      gridConfig.value.size = size;
    }
  };

  const setGridStyle = (style: GridStyle) => {
    gridConfig.value.style = style;
  };

  const setAxisLabels = (show: boolean) => {
    axisConfig.value.showLabels = show;
  };

  const setAxisArrows = (show: boolean) => {
    axisConfig.value.showArrows = show;
  };

  const plotFromEquation = (customStr?: string): boolean => {
    const eqStr = customStr || inputEquation.value;
    inputError.value = null;
    successMessage.value = null;

    if (!eqStr || !eqStr.trim()) {
      inputError.value = 'Vui lòng nhập phương trình toán học.';
      return false;
    }

    try {
      const parsed = EquationParser.parse(eqStr);

      if (parsed.type === 'line') {
        const dx = parsed.point2.x - parsed.point1.x;
        const dy = parsed.point2.y - parsed.point1.y;
        const cmd = new CreateLineCommand(parsed.point1, { x: dx, y: dy });
        geometryStore.executeCommand(cmd);
        successMessage.value = `Đã vẽ đường thẳng ${parsed.raw}`;
        return true;
      }

      if (parsed.type === 'circle') {
        const cmd = new CreateCircleCommand(parsed.center, parsed.radius);
        geometryStore.executeCommand(cmd);
        successMessage.value = `Đã vẽ đường tròn tâm (${parsed.center.x}, ${parsed.center.y}), R = ${parsed.radius}`;
        return true;
      }

      if (parsed.type === 'function') {
        const cmd = new CreateFunctionGraphCommand(parsed.expression);
        geometryStore.executeCommand(cmd);
        successMessage.value = `Đã vẽ đồ thị hàm số y = ${parsed.expression}`;
        return true;
      }

      return false;
    } catch (err: any) {
      inputError.value = err?.message || 'Phương trình không hợp lệ';
      return false;
    }
  };

  return {
    // State
    gridConfig,
    axisConfig,
    isPanelOpen,
    activeTab,
    inputEquation,
    inputError,
    successMessage,

    // Getters
    parsedInputEquation,
    selectedEquation,

    // Actions
    openPanel,
    closePanel,
    togglePanel,
    toggleGrid,
    toggleAxis,
    setGridSize,
    setGridStyle,
    setAxisLabels,
    setAxisArrows,
    plotFromEquation
  };
});
