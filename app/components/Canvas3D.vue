<template>
  <div class="canvas-3d-wrapper relative w-full h-full bg-slate-900 overflow-hidden select-none">
    <!-- JSXGraph 3D Container -->
    <div id="jxgbox3d" class="jxgbox w-full h-full cursor-grab active:cursor-grabbing" />

    <!-- 3D Viewport Controls (Top Right Overlay) -->
    <div class="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <!-- Rendering & Mode Toolbar -->
      <div class="flex items-center gap-1.5 bg-slate-800/85 backdrop-blur-xl shadow-xl rounded-2xl p-2 border border-slate-700/60 text-slate-200">
        <!-- Wireframe / Solid Toggle -->
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          :class="renderer.renderMode === 'wireframe' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/70 text-slate-300'"
          title="Toggle Wireframe Mode"
          @click="toggleWireframe"
        >
          <Icon name="lucide:box" class="w-4 h-4" />
          <span>{{ renderer.renderMode === 'wireframe' ? 'Wireframe' : 'Solid' }}</span>
        </button>

        <div class="w-px h-5 bg-slate-700 my-auto mx-0.5" />

        <!-- Cross-section Toggle -->
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          :class="isCrossSectionActive ? 'bg-rose-600 text-white shadow-md' : 'hover:bg-slate-700/70 text-slate-300'"
          title="Toggle Cross Section"
          @click="toggleCrossSection"
        >
          <Icon name="lucide:scissors" class="w-4 h-4" />
          <span>Thiết diện</span>
        </button>

        <!-- Net / Flatten Toggle -->
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          :class="isNetActive ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-700/70 text-slate-300'"
          title="Toggle 3D Net / Flattening"
          @click="toggleNet"
        >
          <Icon name="lucide:layers" class="w-4 h-4" />
          <span>Khai triển (Net)</span>
        </button>
      </div>

      <!-- Net Fold Slider Panel (Khi mở Net mode) -->
      <div
        v-if="isNetActive"
        class="flex flex-col gap-1.5 bg-slate-800/90 backdrop-blur-xl shadow-xl rounded-2xl p-3 border border-purple-500/40 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div class="flex justify-between items-center text-xs font-semibold text-purple-300">
          <span>Gập / Mở hình (Fold):</span>
          <span>{{ Math.round(netFoldRatio * 100) }}%</span>
        </div>
        <input
          v-model.number="netFoldRatio"
          type="range"
          min="0"
          max="1"
          step="0.02"
          class="w-48 accent-purple-500 cursor-pointer"
          @input="onNetFoldChange"
        />
        <div class="flex justify-between text-[10px] text-slate-400">
          <span>2D Phẳng (0%)</span>
          <span>3D Khép kín (100%)</span>
        </div>
      </div>

      <!-- Plane Transparency Slider Panel -->
      <div
        class="flex items-center gap-2 bg-slate-800/85 backdrop-blur-xl shadow-xl rounded-2xl px-3 py-2 border border-slate-700/60 text-xs text-slate-300"
      >
        <Icon name="lucide:eye" class="w-4 h-4 text-indigo-400" />
        <span class="text-[11px] font-medium">Độ mờ mặt phẳng:</span>
        <input
          v-model.number="planeOpacityValue"
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          class="w-24 accent-indigo-500 cursor-pointer"
          @input="onPlaneOpacityChange"
        />
        <span class="w-7 text-right text-[11px] font-mono text-slate-400">
          {{ Math.round(planeOpacityValue * 100) }}%
        </span>
      </div>
    </div>

    <!-- Orbit Camera Controls (Bottom Right Overlay) -->
    <div class="absolute bottom-6 right-6 flex items-center gap-1.5 bg-slate-800/85 backdrop-blur-xl shadow-xl rounded-2xl p-1.5 border border-slate-700/60 text-slate-200 z-10">
      <button
        class="p-2 rounded-xl hover:bg-slate-700/70 transition-colors text-slate-300 hover:text-white"
        title="Rotate Left"
        @click="() => renderer.rotateCamera(0.2, 0)"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
      </button>
      <button
        class="p-2 rounded-xl hover:bg-slate-700/70 transition-colors text-slate-300 hover:text-white"
        title="Rotate Right"
        @click="() => renderer.rotateCamera(-0.2, 0)"
      >
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </button>
      <button
        class="p-2 rounded-xl hover:bg-slate-700/70 transition-colors text-slate-300 hover:text-white"
        title="Rotate Up"
        @click="() => renderer.rotateCamera(0, 0.15)"
      >
        <Icon name="lucide:arrow-up" class="w-4 h-4" />
      </button>
      <button
        class="p-2 rounded-xl hover:bg-slate-700/70 transition-colors text-slate-300 hover:text-white"
        title="Rotate Down"
        @click="() => renderer.rotateCamera(0, -0.15)"
      >
        <Icon name="lucide:arrow-down" class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-slate-700 my-auto mx-0.5" />

      <button
        class="p-2 rounded-xl hover:bg-slate-700/70 transition-colors text-slate-300 hover:text-white"
        title="Zoom In"
        @click="() => renderer.zoomCamera(1)"
      >
        <Icon name="lucide:zoom-in" class="w-4 h-4" />
      </button>
      <button
        class="p-2 rounded-xl hover:bg-slate-700/70 transition-colors text-slate-300 hover:text-white"
        title="Zoom Out"
        @click="() => renderer.zoomCamera(-1)"
      >
        <Icon name="lucide:zoom-out" class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-slate-700 my-auto mx-0.5" />

      <button
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-700/70 transition-colors text-xs font-medium text-slate-300 hover:text-white"
        title="Reset Camera (Isometric View)"
        @click="() => renderer.resetCamera()"
      >
        <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
        <span>Góc nhìn chuẩn</span>
      </button>
    </div>

    <!-- Info Overlay (Bottom Left) -->
    <div class="absolute bottom-6 left-6 flex items-center gap-2 bg-slate-800/80 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-700/40 text-[11px] text-slate-400 select-none pointer-events-none">
      <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>Kéo chuột để xoay 3D • Lăn chuột để phóng to/thu nhỏ</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { JSXGraph3DRenderer } from '../../core/renderer/JSXGraph3DRenderer';
import { Cube, Pyramid } from '../../core/geometry/3d/Solids';
import { Plane } from '../../core/geometry/primitives/3d';

const renderer = reactive(new JSXGraph3DRenderer());

const isCrossSectionActive = ref(false);
const isNetActive = ref(false);
const netFoldRatio = ref(0.2);
const planeOpacityValue = ref(0.35);

// Demo 3D sample objects for initial interactive visualization
const demoCube = new Cube({ x: -1.5, y: -1.5, z: -1.5 }, 3, 'demo_cube');
const demoPlane = Plane.fromEquation(1, 1, 1, 0, 'demo_plane');

onMounted(() => {
  renderer.init('jxgbox3d', {
    renderMode: 'solid',
    planeOpacity: planeOpacityValue.value,
    solidOpacity: 0.7,
    boxSize: 5
  });

  // Render initial solids
  renderer.renderObject(demoCube);
});

onUnmounted(() => {
  renderer.destroy();
});

const toggleWireframe = () => {
  const nextMode = renderer.renderMode === 'wireframe' ? 'solid' : 'wireframe';
  renderer.setRenderMode(nextMode);
};

const onPlaneOpacityChange = () => {
  renderer.setPlaneOpacity(planeOpacityValue.value);
};

const toggleCrossSection = () => {
  isCrossSectionActive.value = !isCrossSectionActive.value;
  if (isCrossSectionActive.value) {
    renderer.renderObject(demoPlane);
    renderer.renderCrossSection(demoCube, demoPlane);
  } else {
    renderer.removeObject(demoPlane.id);
    renderer.clearCrossSection();
  }
};

const toggleNet = () => {
  isNetActive.value = !isNetActive.value;
  if (isNetActive.value) {
    renderer.clear();
    renderer.renderNet(demoCube, netFoldRatio.value);
  } else {
    renderer.clearNet();
    renderer.renderObject(demoCube);
    if (isCrossSectionActive.value) {
      renderer.renderObject(demoPlane);
      renderer.renderCrossSection(demoCube, demoPlane);
    }
  }
};

const onNetFoldChange = () => {
  if (isNetActive.value) {
    renderer.renderNet(demoCube, netFoldRatio.value);
  }
};

defineExpose({
  renderer,
  toggleWireframe,
  toggleCrossSection,
  toggleNet
});
</script>

<style scoped>
.canvas-3d-wrapper :deep(.jxgbox) {
  position: relative;
  overflow: hidden;
  background-color: transparent !important;
}
</style>
