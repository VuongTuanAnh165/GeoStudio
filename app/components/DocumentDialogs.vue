<template>
  <div>
    <!-- Save Document Modal -->
    <div v-if="showSaveModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ $t('document.save_title') }}</h3>
          <button @click="closeSave" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{{ $t('document.name_label') }}</label>
            <input 
              v-model="saveInputTitle"
              type="text" 
              class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{{ $t('document.desc_label') }}</label>
            <textarea 
              v-model="saveInputDesc"
              rows="3"
              class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
            ></textarea>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
          <button @click="closeSave" class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">{{ $t('workspace.cancel') }}</button>
          <button @click="confirmSave" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shadow-blue-500/20 flex items-center gap-2" :disabled="isSaving">
            <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            {{ $t('workspace.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Open Document Modal -->
    <div v-if="showOpenModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[70vh]">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ $t('document.open_title') }}</h3>
          <button @click="closeOpen" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
          <div v-if="isLoadingList" class="flex justify-center items-center h-32">
            <Icon name="lucide:loader-2" class="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <div v-else-if="documentList.length === 0" class="flex flex-col items-center justify-center h-48 text-slate-400">
            <Icon name="lucide:file-question" class="w-12 h-12 mb-3 opacity-50" />
            <p>{{ $t('document.no_documents') }}</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="doc in documentList" 
              :key="doc.metadata.id"
              class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all shadow-sm hover:shadow-md flex flex-col group"
              @click="loadDocument(doc.metadata.id)"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-slate-800 dark:text-slate-100 truncate pr-2">{{ doc.metadata.title || $t('workspace.untitled') }}</h4>
                <button @click.stop="deleteDocument(doc.metadata.id)" class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-1">{{ doc.metadata.description || $t('document.no_desc') }}</p>
              <div class="text-xs text-slate-400 dark:text-slate-500 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-between">
                <span>{{ formatDate(doc.metadata.updatedAt) }}</span>
                <span>{{ doc.objects.length }} {{ $t('document.objects_count') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useDocument } from '../composables/useDocument';
import { useGeometryStore } from '../stores/geometry';
import type { GeoDocument } from '../../core/types/document';

const props = defineProps<{
  modelValue?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'document-loaded']);

const { save, load, list, deleteDoc, isSaving } = useDocument();
const store = useGeometryStore();

const showSaveModal = ref(false);
const showOpenModal = ref(false);
const saveInputTitle = ref('');
const saveInputDesc = ref('');
const documentList = ref<GeoDocument[]>([]);
const isLoadingList = ref(false);

const openSaveDialog = () => {
  const currentMeta = store.rawState.document.metadata;
  saveInputTitle.value = currentMeta.title || '';
  saveInputDesc.value = currentMeta.description || '';
  showSaveModal.value = true;
};

const openLoadDialog = async () => {
  showOpenModal.value = true;
  isLoadingList.value = true;
  documentList.value = await list();
  isLoadingList.value = false;
};

const closeSave = () => { showSaveModal.value = false; };
const closeOpen = () => { showOpenModal.value = false; };

const confirmSave = async () => {
  await save({ 
    title: saveInputTitle.value.trim() || 'Untitled Document',
    description: saveInputDesc.value.trim()
  });
  closeSave();
};

const loadDocument = async (id: string) => {
  const success = await load(id);
  if (success) {
    emit('document-loaded');
    closeOpen();
  }
};

const deleteDocument = async (id: string) => {
  if (confirm('Are you sure you want to delete this document?')) {
    await deleteDoc(id);
    documentList.value = await list(); // Refresh
  }
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString();
  } catch (e) {
    return dateStr;
  }
};

// Expose open methods to parent
defineExpose({
  openSaveDialog,
  openLoadDialog
});
</script>
