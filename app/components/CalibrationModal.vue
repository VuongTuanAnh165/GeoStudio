<template>
  <div v-if="gestureStore.showCalibration" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-opacity">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Icon name="lucide:settings-2" class="w-6 h-6 text-blue-500" />
          {{ $t('gesture.calibration') }}
        </h3>
        <button @click="close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 flex flex-col gap-6 relative">
        <!-- Steps Indicator -->
        <div class="flex items-center justify-between mb-4">
          <div v-for="step in 2" :key="step" class="flex-1 flex flex-col items-center relative">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 transition-colors"
              :class="currentStep === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (currentStep > step ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')"
            >
              <Icon v-if="currentStep > step" name="lucide:check" class="w-5 h-5" />
              <span v-else>{{ step }}</span>
            </div>
            <span class="mt-2 text-xs font-medium" :class="currentStep >= step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'">
              {{ step === 1 ? $t('gesture.step_1') : $t('gesture.step_2') }}
            </span>
            <div v-if="step === 1" class="absolute top-5 left-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-0">
              <div class="h-full bg-blue-500 transition-all duration-300" :style="{ width: currentStep > 1 ? '100%' : '0%' }"></div>
            </div>
          </div>
        </div>

        <!-- Step 1: Pinch Threshold -->
        <div v-if="currentStep === 1" class="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
          <p class="text-slate-600 dark:text-slate-300 text-center mb-6">
            {{ $t('gesture.step_1_desc') }}
          </p>
          
          <div class="relative w-48 h-48 rounded-full border-4 flex items-center justify-center transition-colors mb-4"
            :class="isPinching ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'">
            <Icon :name="isPinching ? 'lucide:check-circle-2' : 'lucide:hand'" 
                  class="w-20 h-20 transition-colors" 
                  :class="isPinching ? 'text-green-500' : 'text-blue-500'" />
                  
            <div class="absolute -bottom-4 bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-mono border border-slate-200 dark:border-slate-700 shadow-sm">
              Dist: {{ gestureStore.rawPinchDistance.toFixed(3) }}
            </div>
          </div>

          <p class="text-sm font-medium mt-4" :class="isPinching ? 'text-green-600 dark:text-green-400' : 'text-slate-500'">
            {{ isPinching ? $t('gesture.great_hold_it') : $t('gesture.waiting_for_pinch') }}
          </p>
          
          <div class="w-full mt-6 flex flex-col gap-2">
            <div class="flex justify-between text-xs text-slate-500">
              <span>{{ $t('gesture.sensitivity') }}</span>
              <span>{{ localCalibration.pinchThreshold.toFixed(3) }}</span>
            </div>
            <input type="range" min="0.01" max="0.1" step="0.005" v-model.number="localCalibration.pinchThreshold" class="w-full accent-blue-600" />
            <p class="text-xs text-slate-400 text-center mt-1">{{ $t('gesture.sensitivity_desc') }}</p>
          </div>
        </div>

        <!-- Step 2: Workspace Padding -->
        <div v-if="currentStep === 2" class="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
          <p class="text-slate-600 dark:text-slate-300 text-center mb-6">
            {{ $t('gesture.step_2_desc') }}
          </p>
          
          <div class="relative w-64 h-48 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center">
            <!-- Simulated Camera Frame -->
            <div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiM5OTkiLz48L3N2Zz4=')]"></div>
            
            <!-- Safe Area -->
            <div class="absolute border-2 border-blue-500 bg-blue-500/20 rounded shadow-[0_0_0_999px_rgba(0,0,0,0.4)] transition-all"
                 :style="{
                   left: `${localCalibration.workspacePadding.x * 100}%`,
                   right: `${localCalibration.workspacePadding.x * 100}%`,
                   top: `${localCalibration.workspacePadding.y * 100}%`,
                   bottom: `${localCalibration.workspacePadding.y * 100}%`
                 }">
               <div class="w-full h-full flex items-center justify-center">
                  <span class="text-white text-xs font-bold drop-shadow-md">{{ $t('gesture.active_area') }}</span>
               </div>
            </div>
          </div>

          <div class="w-full mt-6 flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs text-slate-500">
                <span>{{ $t('gesture.horizontal_padding') }}</span>
                <span>{{ Math.round(localCalibration.workspacePadding.x * 100) }}%</span>
              </div>
              <input type="range" min="0" max="0.4" step="0.05" v-model.number="localCalibration.workspacePadding.x" class="w-full accent-blue-600" />
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs text-slate-500">
                <span>{{ $t('gesture.vertical_padding') }}</span>
                <span>{{ Math.round(localCalibration.workspacePadding.y * 100) }}%</span>
              </div>
              <input type="range" min="0" max="0.4" step="0.05" v-model.number="localCalibration.workspacePadding.y" class="w-full accent-blue-600" />
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center mt-auto">
        <button 
          v-if="currentStep > 1" 
          @click="currentStep--" 
          class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {{ $t('gesture.back') }}
        </button>
        <div v-else></div> <!-- Spacer -->
        
        <button 
          @click="nextStep" 
          class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shadow-blue-500/20 flex items-center gap-2"
        >
          {{ currentStep === 2 ? $t('gesture.save_finish') : $t('gesture.next_step') }}
          <Icon v-if="currentStep === 1" name="lucide:arrow-right" class="w-4 h-4" />
          <Icon v-else name="lucide:check" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useGestureStore, type GestureCalibration } from '../stores/gesture';

const gestureStore = useGestureStore();
const currentStep = ref(1);

const localCalibration = ref<GestureCalibration>({
  pinchThreshold: 0.04,
  workspacePadding: { x: 0.1, y: 0.1 }
});

const isPinching = computed(() => {
  return gestureStore.rawPinchDistance > 0 && gestureStore.rawPinchDistance < localCalibration.value.pinchThreshold;
});

// Sync local with store when modal opens
watch(() => gestureStore.showCalibration, (show) => {
  if (show) {
    currentStep.value = 1;
    localCalibration.value = JSON.parse(JSON.stringify(gestureStore.calibration));
    
    // Auto calibrate pinch if user pinches while on step 1
    const unwatch = watch(() => gestureStore.rawPinchDistance, (val) => {
      if (currentStep.value === 1 && val > 0 && val < 0.1) {
         // Optionally, we could auto-adjust, but manual slider is safer. 
         // Here we just provide visual feedback through `isPinching` computed.
      }
    });
    
    // Cleanup watch when modal closes
    watch(() => gestureStore.showCalibration, (newShow) => {
      if (!newShow) unwatch();
    });
  }
});

const close = () => {
  gestureStore.showCalibration = false;
};

const nextStep = () => {
  if (currentStep.value === 1) {
    currentStep.value = 2;
  } else {
    // Save and close
    gestureStore.saveCalibration(localCalibration.value);
    close();
  }
};
</script>
