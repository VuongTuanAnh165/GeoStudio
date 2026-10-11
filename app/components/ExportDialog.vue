<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/80">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Icon name="lucide:share-2" class="w-4 h-4" />
          </div>
          <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">{{ $t('export.title') }}</h3>
        </div>
        <button @click="close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Tabs Header -->
      <div class="flex border-b border-slate-200 dark:border-slate-700/60 px-6 pt-2 bg-slate-50/30 dark:bg-slate-800/40">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5"
          :class="activeTab === tab.id
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
        >
          <Icon :name="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>
      
      <!-- Tab Contents -->
      <div class="p-6 overflow-y-auto flex-1">
        <!-- Tab 1: Export Files -->
        <div v-if="activeTab === 'export'" class="space-y-4">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('export.export_desc', 'Chọn định dạng tài liệu bạn muốn tải xuống:') }}
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <!-- GeoPackage (.geo) -->
            <button 
              @click="handleExport('geo')" 
              class="flex flex-col items-center justify-center p-3.5 border border-indigo-200 dark:border-indigo-800/60 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 transition-all group relative overflow-hidden"
              :disabled="isExporting"
            >
              <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-2">
                <Icon name="lucide:package" class="w-5 h-5" />
              </div>
              <span class="font-semibold text-xs">{{ $t('export.geo_package', 'Gói .geo') }}</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5">{{ $t('export.geo_desc', 'Bản vẽ + Bài giảng') }}</span>
              <span class="absolute top-1.5 right-1.5 px-1 py-0.2 text-[9px] bg-indigo-500 text-white rounded font-medium">Chuẩn</span>
            </button>

            <!-- PDF -->
            <button 
              @click="handleExport('pdf')" 
              class="flex flex-col items-center justify-center p-3.5 border border-rose-200 dark:border-rose-800/60 rounded-xl hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 text-slate-700 dark:text-slate-200 transition-all group"
              :disabled="isExporting"
            >
              <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform mb-2">
                <Icon name="lucide:file-text" class="w-5 h-5" />
              </div>
              <span class="font-semibold text-xs">PDF</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5">{{ $t('export.pdf_desc', 'In ấn & Giáo án') }}</span>
            </button>

            <!-- PNG -->
            <button 
              @click="handleExport('png')" 
              class="flex flex-col items-center justify-center p-3.5 border border-blue-200 dark:border-blue-800/60 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-200 transition-all group"
              :disabled="isExporting"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform mb-2">
                <Icon name="lucide:image" class="w-5 h-5" />
              </div>
              <span class="font-semibold text-xs">{{ $t('export.png') }}</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5">{{ $t('export.png_desc', 'Ảnh sắc nét 2x') }}</span>
            </button>

            <!-- SVG -->
            <button 
              @click="handleExport('svg')" 
              class="flex flex-col items-center justify-center p-3.5 border border-amber-200 dark:border-amber-800/60 rounded-xl hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 transition-all group"
              :disabled="isExporting"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform mb-2">
                <Icon name="lucide:code-2" class="w-5 h-5" />
              </div>
              <span class="font-semibold text-xs">{{ $t('export.svg') }}</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5">{{ $t('export.svg_desc', 'Vector không vỡ nét') }}</span>
            </button>

            <!-- JSON -->
            <button 
              @click="handleExport('json')" 
              class="flex flex-col items-center justify-center p-3.5 border border-emerald-200 dark:border-emerald-800/60 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-200 transition-all group"
              :disabled="isExporting"
            >
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform mb-2">
                <Icon name="lucide:file-json" class="w-5 h-5" />
              </div>
              <span class="font-semibold text-xs">{{ $t('export.json') }}</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5">{{ $t('export.json_desc', 'Tệp GeoDocument') }}</span>
            </button>

            <!-- Print -->
            <button 
              @click="handleExport('print')" 
              class="flex flex-col items-center justify-center p-3.5 border border-purple-200 dark:border-purple-800/60 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 text-slate-700 dark:text-slate-200 transition-all group"
              :disabled="isExporting"
            >
              <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform mb-2">
                <Icon name="lucide:printer" class="w-5 h-5" />
              </div>
              <span class="font-semibold text-xs">{{ $t('export.print') }}</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5">{{ $t('export.print_desc', 'In ra giấy / Máy in') }}</span>
            </button>
          </div>
        </div>

        <!-- Tab 2: Share Link -->
        <div v-else-if="activeTab === 'share'" class="space-y-4">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('export.share_desc', 'Tạo liên kết trực tiếp chứa toàn bộ hình vẽ, chú thích và bài giảng để gửi cho học sinh hoặc đồng nghiệp:') }}
          </p>

          <div class="space-y-2">
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300">
              {{ $t('export.share_link_label', 'Đường dẫn chia sẻ (URL)') }}
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                readonly
                :value="shareUrl"
                class="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 select-all font-mono"
              />
              <button
                @click="handleCopyLink"
                class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Icon :name="copySuccess ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
                <span>{{ copySuccess ? $t('export.copied', 'Đã sao chép!') : $t('export.copy_btn', 'Sao chép') }}</span>
              </button>
            </div>
          </div>

          <!-- Payload info card -->
          <div class="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div class="flex justify-between">
              <span>{{ $t('export.objects_count', 'Số đối tượng hình học:') }}</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">{{ geometryStore.objects.size }}</span>
            </div>
            <div class="flex justify-between" v-if="lessonStore.currentLesson">
              <span>{{ $t('export.lesson_steps_count', 'Số bước bài giảng:') }}</span>
              <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ lessonStore.steps.length }} bước</span>
            </div>
            <div class="flex justify-between">
              <span>{{ $t('export.compression_status', 'Tối ưu nén URL:') }}</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-medium">LZ-String URL-safe</span>
            </div>
          </div>
        </div>

        <!-- Tab 3: Import .geo -->
        <div v-else-if="activeTab === 'import'" class="space-y-4">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('export.import_desc', 'Tải tệp .geo hoặc .json từ máy tính của bạn để mở bảng vẽ hoặc bài giảng:') }}
          </p>

          <!-- Drop zone -->
          <div
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            class="border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer"
            :class="isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/30'"
            @click="triggerFileInput"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept=".geo,.json"
              class="hidden"
              @change="handleFileInputChange"
            />
            <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2.5">
              <Icon name="lucide:upload-cloud" class="w-6 h-6" />
            </div>
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {{ selectedFile ? selectedFile.name : $t('export.drop_or_browse', 'Kéo thả tệp .geo vào đây hoặc nhấn để chọn') }}
            </p>
            <p class="text-[11px] text-slate-400">
              Hỗ trợ định dạng .geo (Gói bài giảng GeoStudio) và .json (Tài liệu hình học)
            </p>
          </div>

          <!-- File preview if selected -->
          <div v-if="parsedPreview" class="p-3.5 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 text-xs">
            <div class="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-300">
              <Icon name="lucide:check-circle-2" class="w-4 h-4 text-emerald-500" />
              <span>{{ parsedPreview.metadata.title }}</span>
            </div>
            <div class="text-slate-600 dark:text-slate-400 space-y-1 text-[11px]">
              <div>Loại gói: <span class="font-medium text-slate-800 dark:text-slate-200">{{ parsedPreview.type === 'lesson' ? 'Bài giảng hoàn chỉnh' : 'Bản vẽ hình học' }}</span></div>
              <div>Số lượng đối tượng: <span class="font-medium text-slate-800 dark:text-slate-200">{{ parsedPreview.document.objects.length }}</span></div>
              <div v-if="parsedPreview.lesson">Số bước bài giảng: <span class="font-medium text-slate-800 dark:text-slate-200">{{ parsedPreview.lesson.steps.length }} bước</span></div>
            </div>

            <!-- Import Mode Selection -->
            <div class="pt-2 border-t border-blue-200/60 dark:border-blue-800/60 space-y-1.5">
              <span class="font-medium text-slate-700 dark:text-slate-300 block">Chế độ mở:</span>
              <div class="flex gap-4">
                <label class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                  <input type="radio" value="replace" v-model="importMode" class="text-blue-600" />
                  <span>Thay thế bảng vẽ hiện tại</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                  <input type="radio" value="merge" v-model="importMode" class="text-blue-600" />
                  <span>Ghép thêm vào bảng vẽ</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="importError" class="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0" />
            <span>{{ importError }}</span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center border-t border-slate-100 dark:border-slate-700/60">
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <Icon v-if="isExporting" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span v-if="isExporting">{{ $t('export.processing', 'Đang xử lý xuất tệp...') }}</span>
        </div>

        <div class="flex gap-2.5">
          <button
            @click="close"
            class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {{ $t('workspace.cancel') }}
          </button>
          
          <button
            v-if="activeTab === 'import' && parsedPreview"
            @click="confirmImport"
            class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Icon name="lucide:file-input" class="w-3.5 h-3.5" />
            <span>{{ $t('export.confirm_import', 'Tiến hành nạp tệp') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useExport } from '../composables/useExport';
import { useGeometryStore } from '../stores/geometry';
import { useLessonStore } from '../stores/lesson';
import { GeoPackageService } from '../../core/export/GeoPackageService';
import type { GeoPackage } from '../../core/types/export';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'imported']);

const {
  exportPNG,
  exportSVG,
  exportJSON,
  exportPDF,
  exportGeoPackage,
  importGeoFile,
  generateShareUrl,
  copyShareLink,
  printDocument
} = useExport();

const geometryStore = useGeometryStore();
const lessonStore = useLessonStore();

type TabType = 'export' | 'share' | 'import';

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'export', label: 'Xuất tệp', icon: 'lucide:download' },
  { id: 'share', label: 'Chia sẻ liên kết', icon: 'lucide:share-2' },
  { id: 'import', label: 'Nhập tệp (.geo)', icon: 'lucide:upload' }
];

const activeTab = ref<TabType>('export');
const isExporting = ref(false);
const copySuccess = ref(false);

// Import State
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const parsedPreview = ref<GeoPackage | null>(null);
const importMode = ref<'replace' | 'merge'>('replace');
const importError = ref<string | null>(null);
const isDragging = ref(false);

const shareUrl = computed(() => {
  if (!props.modelValue) return '';
  return generateShareUrl();
});

const close = () => {
  if (isExporting.value) return;
  emit('update:modelValue', false);
};

const handleExport = async (type: 'png' | 'svg' | 'json' | 'pdf' | 'geo' | 'print') => {
  isExporting.value = true;
  try {
    switch (type) {
      case 'png':
        await exportPNG();
        break;
      case 'svg':
        exportSVG();
        break;
      case 'json':
        exportJSON();
        break;
      case 'pdf':
        await exportPDF();
        break;
      case 'geo':
        exportGeoPackage();
        break;
      case 'print':
        printDocument();
        break;
    }
    close();
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    isExporting.value = false;
  }
};

const handleCopyLink = async () => {
  const res = await copyShareLink();
  if (res.success) {
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2500);
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileInputChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    await processSelectedFile(target.files[0]);
  }
};

const handleFileDrop = async (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    await processSelectedFile(e.dataTransfer.files[0]);
  }
};

const processSelectedFile = async (file: File) => {
  selectedFile.value = file;
  importError.value = null;
  parsedPreview.value = null;

  try {
    const text = await file.text();
    const result = GeoPackageService.parseGeoPackage(text);
    if (result.success && result.data) {
      parsedPreview.value = result.data;
    } else {
      importError.value = result.error || 'Tệp không đúng định dạng .geo hoặc .json';
    }
  } catch {
    importError.value = 'Không thể đọc tệp đã chọn.';
  }
};

const confirmImport = async () => {
  if (!selectedFile.value) return;

  const res = await importGeoFile(selectedFile.value, importMode.value);
  if (res.success) {
    emit('imported', res.data);
    close();
  } else {
    importError.value = res.error || 'Nhập tệp thất bại.';
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      selectedFile.value = null;
      parsedPreview.value = null;
      importError.value = null;
      copySuccess.value = false;
    }
  }
);
</script>
