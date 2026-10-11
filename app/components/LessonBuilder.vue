<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="lessonStore.isBuilderOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
        @click.self="lessonStore.closeBuilder()"
      >
        <div 
          class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-builder-title"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Icon name="lucide:presentation" class="w-5 h-5" />
              </div>
              <div>
                <h2 id="lesson-builder-title" class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{{ $t('lesson.builder_title', 'Soạn thảo bài giảng') }}</span>
                  <span 
                    v-if="lessonStore.currentLesson" 
                    class="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
                  >
                    Lớp {{ lessonStore.currentLesson.grade }}
                  </span>
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ $t('lesson.builder_subtitle', 'Xây dựng bài học tương tác với các bước dựng hình, giải thích và công thức') }}
                </p>
              </div>
            </div>

            <!-- Tab Switcher & Close -->
            <div class="flex items-center gap-3">
              <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  @click="activeTab = 'steps'" 
                  class="px-3 py-1 text-xs font-medium rounded-lg transition-all"
                  :class="activeTab === 'steps' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                >
                  <Icon name="lucide:list-ordered" class="w-3.5 h-3.5 inline mr-1" />
                  {{ $t('lesson.steps_tab', 'Soạn các bước') }}
                </button>
                <button 
                  @click="switchToPreview" 
                  class="px-3 py-1 text-xs font-medium rounded-lg transition-all"
                  :class="activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                >
                  <Icon name="lucide:play" class="w-3.5 h-3.5 inline mr-1" />
                  {{ $t('lesson.preview_tab', 'Xem trước') }}
                </button>
                <button 
                  @click="activeTab = 'saved'" 
                  class="px-3 py-1 text-xs font-medium rounded-lg transition-all"
                  :class="activeTab === 'saved' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                >
                  <Icon name="lucide:folder" class="w-3.5 h-3.5 inline mr-1" />
                  {{ $t('lesson.saved_tab', 'Bài giảng đã lưu') }}
                  <span v-if="lessonStore.savedLessons.length > 0" class="ml-1 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-600 rounded-full text-[10px]">
                    {{ lessonStore.savedLessons.length }}
                  </span>
                </button>
              </div>

              <button 
                @click="lessonStore.closeBuilder()" 
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng"
              >
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Main Body -->
          <div class="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-slate-900/40 space-y-5">
            <!-- TAB 1: STEPS EDITOR -->
            <div v-if="activeTab === 'steps'" class="space-y-5">
              <!-- Lesson Metadata Form -->
              <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <!-- Title -->
                  <div class="md:col-span-3">
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {{ $t('lesson.lesson_title', 'Tiêu đề bài giảng') }} *
                    </label>
                    <input 
                      type="text" 
                      v-if="lessonStore.currentLesson"
                      v-model="lessonStore.currentLesson.title"
                      class="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="Ví dụ: Dựng 3 đường cao và trực tâm tam giác"
                    />
                  </div>

                  <!-- Grade -->
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {{ $t('lesson.grade', 'Khối lớp') }}
                    </label>
                    <select 
                      v-if="lessonStore.currentLesson"
                      v-model.number="lessonStore.currentLesson.grade"
                      class="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option v-for="g in 12" :key="g" :value="g">Lớp {{ g }}</option>
                    </select>
                  </div>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {{ $t('lesson.description', 'Mô tả bài giảng') }}
                  </label>
                  <textarea 
                    v-if="lessonStore.currentLesson"
                    v-model="lessonStore.currentLesson.description"
                    rows="2"
                    class="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="Mục tiêu bài học, định lý hoặc bài tập cần học sinh thực hiện..."
                  ></textarea>
                </div>
              </div>

              <!-- Action Bar for Steps -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {{ $t('lesson.steps_tab', 'Các bước dựng hình') }} ({{ lessonStore.steps.length }})
                  </h3>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    @click="lessonStore.generateStepsFromCanvas()"
                    class="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Cập nhật danh sách bước từ các đối tượng hiện có trên bảng vẽ"
                  >
                    <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5 text-indigo-500" />
                    {{ $t('lesson.sync_from_canvas', 'Lấy từ hình vẽ hiện tại') }}
                  </button>
                  <button 
                    @click="lessonStore.addStep()"
                    class="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                    {{ $t('lesson.add_step', 'Thêm bước') }}
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div 
                v-if="lessonStore.steps.length === 0" 
                class="bg-white dark:bg-slate-800 rounded-xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center"
              >
                <div class="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <Icon name="lucide:list-plus" class="w-6 h-6" />
                </div>
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {{ $t('lesson.no_steps', 'Chưa có bước dựng nào') }}
                </p>
                <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {{ $t('lesson.no_steps_hint', 'Nhấn \'Lấy từ hình vẽ hiện tại\' hoặc \'Thêm bước\' để bắt đầu soạn bài.') }}
                </p>
              </div>

              <!-- Steps List Cards -->
              <div v-else class="space-y-3">
                <div 
                  v-for="(step, index) in lessonStore.steps" 
                  :key="step.id"
                  class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-all space-y-3"
                >
                  <!-- Step Card Header -->
                  <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                        {{ step.stepNumber }}
                      </span>
                      <input 
                        type="text" 
                        v-model="step.title"
                        class="text-sm font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
                        placeholder="Tên bước dựng..."
                      />
                      <span 
                        v-if="step.objectIds.length > 0" 
                        class="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono"
                      >
                        {{ step.objectIds.join(', ') }}
                      </span>
                    </div>

                    <!-- Reorder & Delete Actions -->
                    <div class="flex items-center gap-1">
                      <button 
                        @click="lessonStore.moveStep(index, 'up')" 
                        :disabled="index === 0"
                        class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Di chuyển lên"
                      >
                        <Icon name="lucide:chevron-up" class="w-4 h-4" />
                      </button>
                      <button 
                        @click="lessonStore.moveStep(index, 'down')" 
                        :disabled="index === lessonStore.steps.length - 1"
                        class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Di chuyển xuống"
                      >
                        <Icon name="lucide:chevron-down" class="w-4 h-4" />
                      </button>
                      <button 
                        @click="lessonStore.removeStep(step.id)" 
                        class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                        title="Xóa bước này"
                      >
                        <Icon name="lucide:trash-2" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Step Description -->
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {{ $t('lesson.step_desc', 'Mô tả / Thao tác thực hiện') }}
                    </label>
                    <input 
                      type="text" 
                      v-model="step.description"
                      class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ví dụ: Kẻ đường thẳng d vuông góc với đoạn thẳng BC tại điểm H"
                    />
                  </div>

                  <!-- Pedagogical Annotation & KaTeX Formula Row -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <!-- Annotation -->
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Icon name="lucide:message-square-quote" class="w-3.5 h-3.5 text-blue-500" />
                        {{ $t('lesson.step_annotation', 'Chú thích sư phạm') }}
                      </label>
                      <textarea 
                        v-model="step.annotation"
                        rows="2"
                        class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Ghi chú cho học sinh, lưu ý khi vẽ..."
                      ></textarea>
                    </div>

                    <!-- Formula with Live Preview -->
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Icon name="lucide:variable" class="w-3.5 h-3.5 text-amber-500" />
                        {{ $t('lesson.step_formula', 'Công thức KaTeX') }}
                      </label>
                      <input 
                        type="text" 
                        v-model="step.formula"
                        class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Ví dụ: AH \perp BC hoặc S = \frac{1}{2}ah"
                      />

                      <!-- Live Formula Preview -->
                      <div 
                        v-if="step.formula" 
                        class="mt-1 px-3 py-1 bg-amber-50/60 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800/50 flex items-center gap-2"
                      >
                        <span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">Xem trước:</span>
                        <FormulaDisplay :formula="step.formula" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 2: PREVIEW MODE -->
            <div v-else-if="activeTab === 'preview'" class="space-y-4">
              <div class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <!-- Preview Header -->
                <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
                  <div>
                    <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">
                      {{ lessonStore.currentLesson?.title || 'Xem trước bài giảng' }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      {{ lessonStore.currentLesson?.description }}
                    </p>
                  </div>
                  <div class="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    Bước {{ lessonStore.previewStepIndex }} / {{ lessonStore.totalSteps }}
                  </div>
                </div>

                <!-- Current Step Display -->
                <div v-if="lessonStore.currentPreviewStep" class="space-y-4">
                  <div class="flex items-start gap-3">
                    <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {{ lessonStore.currentPreviewStep.stepNumber }}
                    </span>
                    <div class="flex-1">
                      <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {{ lessonStore.currentPreviewStep.title }}
                      </h4>
                      <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {{ lessonStore.currentPreviewStep.description }}
                      </p>
                    </div>
                  </div>

                  <!-- Teacher Annotation Callout -->
                  <div 
                    v-if="lessonStore.currentPreviewStep.annotation" 
                    class="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3"
                  >
                    <Icon name="lucide:info" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div class="text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                        Chú thích bài học:
                      </div>
                      <p class="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                        {{ lessonStore.currentPreviewStep.annotation }}
                      </p>
                    </div>
                  </div>

                  <!-- Formula Display in Preview -->
                  <div 
                    v-if="lessonStore.currentPreviewStep.formula" 
                    class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col items-center justify-center gap-2"
                  >
                    <div class="text-xs font-semibold text-amber-900 dark:text-amber-200 self-start">
                      Công thức toán học áp dụng:
                    </div>
                    <div class="text-base py-2">
                      <FormulaDisplay :formula="lessonStore.currentPreviewStep.formula" :display-mode="true" />
                    </div>
                  </div>
                </div>

                <!-- Empty preview -->
                <div v-else class="text-center py-12 text-slate-400 text-xs">
                  Không có bước dựng nào để xem trước.
                </div>

                <!-- Navigation Controls -->
                <div class="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700 mt-6">
                  <button 
                    @click="lessonStore.prevPreviewStep()"
                    :disabled="lessonStore.previewStepIndex <= 1"
                    class="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    <Icon name="lucide:arrow-left" class="w-4 h-4" />
                    Bước trước
                  </button>

                  <div class="flex items-center gap-1">
                    <button 
                      v-for="step in lessonStore.steps" 
                      :key="step.id"
                      @click="lessonStore.goToPreviewStep(step.stepNumber)"
                      class="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                      :class="lessonStore.previewStepIndex === step.stepNumber
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
                    >
                      {{ step.stepNumber }}
                    </button>
                  </div>

                  <button 
                    @click="lessonStore.nextPreviewStep()"
                    :disabled="lessonStore.previewStepIndex >= lessonStore.totalSteps"
                    class="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
                  >
                    Bước tiếp theo
                    <Icon name="lucide:arrow-right" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- TAB 3: SAVED LESSONS IN INDEXEDDB -->
            <div v-else-if="activeTab === 'saved'" class="space-y-4">
              <div v-if="lessonStore.savedLessons.length === 0" class="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8">
                <Icon name="lucide:folder-open" class="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p class="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {{ $t('lesson.no_saved_lessons', 'Chưa có bài giảng nào được lưu trong máy.') }}
                </p>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="lesson in lessonStore.savedLessons" 
                  :key="lesson.id"
                  class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                      <span class="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Lớp {{ lesson.grade }}
                      </span>
                      <span class="text-[11px] text-slate-400">
                        {{ new Date(lesson.updatedAt).toLocaleDateString() }}
                      </span>
                    </div>

                    <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                      {{ lesson.title }}
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {{ lesson.description || 'Không có mô tả' }}
                    </p>
                  </div>

                  <div class="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      {{ lesson.steps.length }} bước dựng
                    </span>
                    <div class="flex items-center gap-2">
                      <button 
                        @click="lessonStore.startPlayer(lesson.id)"
                        class="px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                        :title="$t('lesson.player_title', 'Trình chiếu bài giảng')"
                      >
                        <Icon name="lucide:play" class="w-3.5 h-3.5" />
                        <span>{{ $t('lesson.play_btn', 'Phát') }}</span>
                      </button>
                      <button 
                        @click="handleLoadLesson(lesson.id)"
                        class="px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        {{ $t('lesson.load_lesson', 'Mở') }}
                      </button>
                      <button 
                        @click="lessonStore.deleteLesson(lesson.id)"
                        class="px-2 py-1 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
                        title="Xóa bài giảng"
                      >
                        <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
            <!-- Status message -->
            <div class="text-xs flex items-center gap-2">
              <span v-if="lessonStore.successMessage" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Icon name="lucide:check-circle-2" class="w-4 h-4" />
                {{ lessonStore.successMessage }}
              </span>
              <span v-else-if="lessonStore.errorMessage" class="text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">
                <Icon name="lucide:alert-circle" class="w-4 h-4" />
                {{ lessonStore.errorMessage }}
              </span>
              <span v-else class="text-slate-400">
                GeoStudio Lesson Builder — Section 46
              </span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button 
                @click="lessonStore.startPlayer()"
                class="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1.5"
                :title="$t('lesson.player_title', 'Trình chiếu bài giảng')"
              >
                <Icon name="lucide:presentation" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{{ $t('lesson.play_presentation', 'Trình chiếu') }}</span>
              </button>
              <button 
                @click="handleSave"
                :disabled="lessonStore.isSaving"
                class="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Icon v-if="lessonStore.isSaving" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
                <Icon v-else name="lucide:save" class="w-3.5 h-3.5" />
                <span>{{ $t('lesson.save_btn', 'Lưu bài giảng') }}</span>
              </button>
              <button 
                @click="lessonStore.closeBuilder()"
                class="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {{ $t('replay.close', 'Đóng') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLessonStore } from '../stores/lesson';
import FormulaDisplay from './FormulaDisplay.vue';

const lessonStore = useLessonStore();
const activeTab = ref<'steps' | 'preview' | 'saved'>('steps');

const switchToPreview = () => {
  activeTab.value = 'preview';
  lessonStore.startPreview();
};

const handleSave = async () => {
  await lessonStore.saveLesson();
};

const handleLoadLesson = async (id: string) => {
  const success = await lessonStore.loadLesson(id);
  if (success) {
    activeTab.value = 'steps';
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
</style>
