<template>
  <div v-if="isVisible" class="absolute top-16 right-4 z-40 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-64 flex flex-col transition-all">
    <!-- Header Controls -->
    <div class="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-2">
        <Icon name="lucide:camera" class="w-4 h-4 text-slate-500" />
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">{{ $t('gesture.camera') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <button 
          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors tooltip-trigger" 
          :title="$t('gesture.calibration')"
          @click="gestureStore.showCalibration = true"
        >
          <Icon name="lucide:settings-2" class="w-3.5 h-3.5" />
        </button>
        <button 
          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors tooltip-trigger" 
          :title="$t('gesture.mirror_camera')"
          @click="isMirrored = !isMirrored"
        >
          <Icon name="lucide:flip-horizontal" class="w-3.5 h-3.5" :class="{ 'text-blue-500': isMirrored }" />
        </button>
        <button 
          class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors tooltip-trigger" 
          :title="$t('gesture.close_camera')"
          @click="closeCamera"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Camera Feed -->
    <div class="relative bg-black aspect-[4/3] flex items-center justify-center">
      <video 
        ref="videoRef"
        class="w-full h-full object-cover"
        :class="{ 'scale-x-[-1]': isMirrored }"
        autoplay
        playsinline
        muted
      ></video>
      <canvas
        ref="canvasRef"
        class="absolute inset-0 w-full h-full object-cover pointer-events-none"
        :class="{ 'scale-x-[-1]': isMirrored }"
      ></canvas>
      
      <!-- Overlays for loading/errors -->
      <div v-if="isRequesting" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm text-white">
        <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin mb-2" />
        <span class="text-xs">{{ $t('gesture.starting') }}</span>
      </div>
      
      <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/80 text-red-400">
        <Icon name="lucide:alert-circle" class="w-6 h-6 mb-2" />
        <span class="text-xs">{{ error }}</span>
        <button @click="retryCamera" class="mt-2 text-xs text-white bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/40">{{ $t('gesture.retry') }}</button>
      </div>
      
      <div v-else-if="!stream" class="absolute inset-0 flex items-center justify-center">
        <button @click="startCamera" class="flex flex-col items-center text-slate-400 hover:text-white transition-colors">
          <Icon name="lucide:play-circle" class="w-8 h-8 mb-2" />
          <span class="text-xs font-medium">{{ $t('gesture.click_to_start') }}</span>
        </button>
      </div>
    </div>

    <!-- Camera Selector -->
    <div class="p-2 bg-slate-50 dark:bg-slate-800/50" v-if="cameras.length > 1 && stream">
      <select 
        v-model="activeCameraId" 
        @change="onCameraChange"
        class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
      >
        <option v-for="cam in cameras" :key="cam.deviceId" :value="cam.deviceId">
          {{ cam.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useCamera } from '../composables/useCamera';
import { useGestureStore } from '../stores/gesture';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'video-ready', video: HTMLVideoElement): void;
}>();

const { stream, error, isRequesting, cameras, activeCameraId, start, stop } = useCamera();
const gestureStore = useGestureStore();


const isVisible = ref(props.modelValue);
const isMirrored = ref(true);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number;

const drawSkeleton = () => {
  const canvas = canvasRef.value;
  const video = videoRef.value;
  if (!canvas || !video) return;

  // Sync canvas size with video
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const detections = gestureStore.lastDetections;
  if (!detections || detections.length === 0) {
    animationFrameId = requestAnimationFrame(drawSkeleton);
    return;
  }

  // Mediapipe Hand Connections
  const HAND_CONNECTIONS: [number, number][] = [
    [0,1],[1,2],[2,3],[3,4], // Thumb
    [0,5],[5,6],[6,7],[7,8], // Index
    [5,9],[9,10],[10,11],[11,12], // Middle
    [9,13],[13,14],[14,15],[15,16], // Ring
    [13,17],[0,17],[17,18],[18,19],[19,20] // Pinky & Palm
  ];

  detections.forEach((detection: any) => {
    const landmarks = detection.landmarks;
    if (!landmarks) return;

    // Determine color based on state (for right hand)
    let color = '#3b82f6'; // Blue for idle/hover
    if (gestureStore.currentState === 'PINCH_START' || gestureStore.currentState === 'DRAGGING') {
      color = '#22c55e'; // Green for interaction
    }

    // Draw connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.beginPath();
    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx]!;
      const end = landmarks[endIdx]!;
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
      ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    });
    ctx.stroke();

    // Draw landmarks
    ctx.fillStyle = '#ffffff';
    landmarks.forEach((lm: any) => {
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  });

  animationFrameId = requestAnimationFrame(drawSkeleton);
};

watch(() => props.modelValue, (val) => {
  isVisible.value = val;
  if (val) {
    // If opened and no stream, auto start
    if (!stream.value && !error.value) {
      startCamera();
    }
  } else {
    // Stop camera when closed
    stop();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  }
});

watch(stream, (newStream) => {
  if (videoRef.value && newStream) {
    videoRef.value.srcObject = newStream;
    // Notify parent that video is ready for MediaPipe
    emit('video-ready', videoRef.value);
    
    // Start drawing loop
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    drawSkeleton();
  }
});

const startCamera = async () => {
  await start();
};

const retryCamera = () => {
  start();
};

const closeCamera = () => {
  emit('update:modelValue', false);
};

const onCameraChange = () => {
  start(activeCameraId.value);
};

onUnmounted(() => {
  stop();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>
