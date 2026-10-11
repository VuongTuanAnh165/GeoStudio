<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="templateStore.isBrowserOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
        @click.self="templateStore.closeBrowser()"
      >
        <div 
          class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-browser-title"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Icon name="lucide:layout-template" class="w-5 h-5" />
              </div>
              <div>
                <h2 id="template-browser-title" class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{{ $t('template.browser_title', 'Thư viện mẫu dựng hình học') }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                    {{ templateStore.filteredTemplates.length }} mẫu
                  </span>
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ $t('template.browser_subtitle', 'Mẫu dựng chuẩn toán học: Hình cơ bản, dựng tam giác, định lý đường tròn và không gian 3D') }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="templateStore.openSaveModal()" 
                class="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shadow-indigo-500/20"
                :title="$t('template.save_current_btn', 'Lưu bảng vẽ hiện tại thành mẫu')"
              >
                <Icon name="lucide:plus" class="w-4 h-4" />
                <span class="hidden sm:inline">{{ $t('template.save_current_btn', 'Lưu hình hiện tại thành mẫu') }}</span>
              </button>

              <button 
                @click="templateStore.closeBrowser()" 
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng"
              >
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Controls Bar (Search & Category Filter) -->
          <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 shrink-0 bg-white dark:bg-slate-900">
            <!-- Search Input -->
            <div class="relative">
              <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                v-model="templateStore.searchQuery" 
                class="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                :placeholder="$t('template.search_placeholder', 'Tìm kiếm mẫu dựng (tam giác, trực tâm, tiếp tuyến, lập phương...)')"
              />
              <button 
                v-if="templateStore.searchQuery" 
                @click="templateStore.searchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Icon name="lucide:x" class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Category Filter Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button 
                v-for="cat in categories" 
                :key="cat.id"
                @click="templateStore.selectedCategory = cat.id as any"
                class="px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0"
                :class="templateStore.selectedCategory === cat.id 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold' 
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
              >
                <Icon :name="cat.icon" class="w-3.5 h-3.5" />
                <span>{{ cat.label }}</span>
                <span 
                  class="text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5"
                  :class="templateStore.selectedCategory === cat.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
                >
                  {{ getCountForCategory(cat.id) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Notification Toast -->
          <div 
            v-if="templateStore.notificationMessage" 
            class="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <Icon name="lucide:check-circle-2" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{{ templateStore.notificationMessage }}</span>
            </div>
            <button @click="templateStore.notificationMessage = null" class="text-emerald-500 hover:text-emerald-700">
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Main Grid of Templates -->
          <div class="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-slate-900/40">
            <!-- Empty state -->
            <div 
              v-if="templateStore.filteredTemplates.length === 0" 
              class="text-center py-16 bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center gap-3"
            >
              <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                <Icon name="lucide:folder-search" class="w-6 h-6" />
              </div>
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {{ $t('template.no_templates_found', 'Không tìm thấy mẫu dựng phù hợp') }}
              </p>
              <p class="text-xs text-slate-400 max-w-sm">
                Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
              </p>
              <button 
                @click="resetFilter" 
                class="mt-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Xem tất cả mẫu
              </button>
            </div>

            <!-- Templates Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="tpl in templateStore.filteredTemplates" 
                :key="tpl.id"
                class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <div>
                  <!-- Top Badges -->
                  <div class="flex items-center justify-between gap-2 mb-2.5">
                    <div class="flex items-center gap-1.5">
                      <span 
                        class="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        :class="tpl.document.settings?.dimension === 3 
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'"
                      >
                        {{ tpl.document.settings?.dimension === 3 ? '3D' : '2D' }}
                      </span>
                      <span 
                        v-if="tpl.grade" 
                        class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                      >
                        Lớp {{ tpl.grade }}
                      </span>
                      <span 
                        v-if="tpl.isUserCreated" 
                        class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        Cá nhân
                      </span>
                    </div>

                    <span class="text-[11px] text-slate-400 flex items-center gap-1">
                      <Icon name="lucide:shapes" class="w-3 h-3" />
                      {{ tpl.document.objects.length }} đối tượng
                    </span>
                  </div>

                  <!-- Title -->
                  <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {{ tpl.title }}
                  </h3>

                  <!-- Description -->
                  <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {{ tpl.description || 'Mẫu hình học chuẩn' }}
                  </p>

                  <!-- Tags -->
                  <div class="flex flex-wrap gap-1 mb-3">
                    <span 
                      v-for="tag in tpl.tags.slice(0, 3)" 
                      :key="tag"
                      class="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                </div>

                <!-- Actions Footer -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <button 
                      @click="templateStore.applyTemplate(tpl, 'replace')"
                      class="px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1 shadow-indigo-500/20"
                      :title="$t('template.apply_replace_title', 'Mở mẫu này (thay thế bảng vẽ hiện tại)')"
                    >
                      <Icon name="lucide:folder-open" class="w-3.5 h-3.5" />
                      <span>{{ $t('template.apply_btn', 'Sử dụng') }}</span>
                    </button>

                    <button 
                      @click="templateStore.applyTemplate(tpl, 'insert')"
                      class="px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
                      :title="$t('template.insert_btn_title', 'Chèn thêm mẫu này vào bảng vẽ hiện tại')"
                    >
                      <Icon name="lucide:copy-plus" class="w-3.5 h-3.5" />
                      <span class="hidden sm:inline">{{ $t('template.insert_btn', 'Chèn') }}</span>
                    </button>
                  </div>

                  <button 
                    v-if="tpl.isUserCreated"
                    @click="templateStore.deleteUserTemplate(tpl.id)"
                    class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    :title="$t('template.delete_btn', 'Xóa mẫu cá nhân')"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL: Lưu bản vẽ hiện tại thành mẫu mới -->
        <div 
          v-if="templateStore.isSaveModalOpen" 
          class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          @click.self="templateStore.closeSaveModal()"
        >
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Icon name="lucide:save" class="w-4 h-4 text-indigo-500" />
                {{ $t('template.save_modal_title', 'Lưu bảng vẽ thành mẫu dựng') }}
              </h3>
              <button @click="templateStore.closeSaveModal()" class="text-slate-400 hover:text-slate-600">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div v-if="templateStore.errorMessage" class="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-200">
                {{ templateStore.errorMessage }}
              </div>

              <!-- Tên mẫu -->
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {{ $t('template.name_label', 'Tên mẫu dựng') }} *
                </label>
                <input 
                  type="text" 
                  v-model="saveForm.title" 
                  class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Ví dụ: Hình bình hành có 2 đường cao"
                />
              </div>

              <!-- Mô tả -->
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {{ $t('template.desc_label', 'Mô tả tóm tắt') }}
                </label>
                <textarea 
                  v-model="saveForm.description" 
                  rows="2"
                  class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Mô tả ý nghĩa toán học hoặc cách dùng của mẫu này..."
                />
              </div>

              <!-- Danh mục & Khối lớp -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {{ $t('template.category_label', 'Danh mục') }}
                  </label>
                  <select 
                    v-model="saveForm.category"
                    class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option value="user">Mẫu cá nhân</option>
                    <option value="basic_shapes">Hình cơ bản</option>
                    <option value="triangle_constructions">Dựng tam giác</option>
                    <option value="circle_theorems">Định lý đường tròn</option>
                    <option value="3d_solids">Không gian 3D</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {{ $t('template.grade_label', 'Khối lớp') }}
                  </label>
                  <select 
                    v-model="saveForm.grade"
                    class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option :value="undefined">Không chọn</option>
                    <option v-for="g in 12" :key="g" :value="g">Lớp {{ g }}</option>
                  </select>
                </div>
              </div>

              <!-- Tags -->
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {{ $t('template.tags_label', 'Thẻ phân loại (cách nhau bằng dấu phẩy)') }}
                </label>
                <input 
                  type="text" 
                  v-model="saveForm.tagsString" 
                  class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="hình vuông, đường cao, bài tập 1"
                />
              </div>
            </div>

            <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-2">
              <button 
                @click="templateStore.closeSaveModal()"
                class="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>

              <button 
                @click="handleSaveTemplate"
                :disabled="templateStore.isSaving"
                class="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Icon v-if="templateStore.isSaving" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
                <Icon v-else name="lucide:check" class="w-3.5 h-3.5" />
                <span>{{ $t('template.save_confirm_btn', 'Lưu mẫu') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useTemplateStore } from '../stores/template';
import type { TemplateCategory } from '../../core/types/template';

const templateStore = useTemplateStore();

const categories = [
  { id: 'all', label: 'Tất cả', icon: 'lucide:grid' },
  { id: 'basic_shapes', label: 'Hình cơ bản', icon: 'lucide:shapes' },
  { id: 'triangle_constructions', label: 'Dựng tam giác', icon: 'lucide:triangle' },
  { id: 'circle_theorems', label: 'Định lý đường tròn', icon: 'lucide:circle' },
  { id: '3d_solids', label: 'Không gian 3D', icon: 'lucide:box' },
  { id: 'user', label: 'Mẫu của tôi', icon: 'lucide:user' }
];

const saveForm = reactive({
  title: '',
  description: '',
  category: 'user' as TemplateCategory,
  grade: undefined as number | undefined,
  tagsString: ''
});

const getCountForCategory = (catId: string): number => {
  return (templateStore.categoryCounts as any)[catId] || 0;
};

const resetFilter = () => {
  templateStore.searchQuery = '';
  templateStore.selectedCategory = 'all';
};

const handleSaveTemplate = async () => {
  const tags = saveForm.tagsString
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const success = await templateStore.saveCurrentAsTemplate({
    title: saveForm.title,
    description: saveForm.description,
    category: saveForm.category,
    grade: saveForm.grade,
    tags
  });

  if (success) {
    saveForm.title = '';
    saveForm.description = '';
    saveForm.tagsString = '';
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
