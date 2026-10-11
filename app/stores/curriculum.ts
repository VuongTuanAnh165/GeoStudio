import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { defaultCurriculumEngine } from '../../core/curriculum/CurriculumEngine';
import type { CurriculumConcept } from '../../core/types/curriculum';

export const useCurriculumStore = defineStore('curriculum', () => {
  const engine = defaultCurriculumEngine;

  // Reactive State
  const selectedGrade = ref<number | null>(null); // null = "Tất cả lớp"
  const searchQuery = ref<string>('');
  const activeConceptId = ref<string | null>(null);
  const isBrowserOpen = ref<boolean>(false);

  // Getters
  const currentCurriculum = computed(() => {
    return selectedGrade.value !== null ? engine.getCurriculum(selectedGrade.value) || null : null;
  });

  const activeConcept = computed<CurriculumConcept | null>(() => {
    return activeConceptId.value ? engine.getConcept(activeConceptId.value) || null : null;
  });

  const allCurricula = computed(() => {
    return engine.getAllCurricula();
  });

  const filteredConcepts = computed(() => {
    return engine.searchConcepts(searchQuery.value, selectedGrade.value);
  });

  const allowedToolIds = computed(() => {
    return engine.getAllowedToolsForGrade(selectedGrade.value);
  });

  const gradeLabel = computed(() => {
    return selectedGrade.value !== null ? `Lớp ${selectedGrade.value}` : 'Tất cả lớp';
  });

  // Actions
  const setGrade = (grade: number | null) => {
    selectedGrade.value = (grade !== null && grade >= 1 && grade <= 12) ? grade : null;
    // Nếu chuyển lớp mà concept hiện tại không thuộc lớp mới thì reset active concept
    if (activeConcept.value && selectedGrade.value !== null && activeConcept.value.grade !== selectedGrade.value) {
      activeConceptId.value = null;
    }
  };

  const selectConcept = (conceptOrId: CurriculumConcept | string | null) => {
    if (!conceptOrId) {
      activeConceptId.value = null;
      return;
    }
    const id = typeof conceptOrId === 'string' ? conceptOrId : conceptOrId.id;
    const concept = engine.getConcept(id);
    if (concept) {
      activeConceptId.value = id;
      selectedGrade.value = concept.grade;
    }
  };

  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };

  const openBrowser = () => {
    isBrowserOpen.value = true;
  };

  const closeBrowser = () => {
    isBrowserOpen.value = false;
  };

  const toggleBrowser = (open?: boolean) => {
    isBrowserOpen.value = typeof open === 'boolean' ? open : !isBrowserOpen.value;
  };

  const isToolVisible = (toolId: string): boolean => {
    return engine.isToolAllowed(toolId, selectedGrade.value);
  };

  return {
    // State
    selectedGrade,
    searchQuery,
    activeConceptId,
    isBrowserOpen,

    // Getters
    currentCurriculum,
    activeConcept,
    allCurricula,
    filteredConcepts,
    allowedToolIds,
    gradeLabel,

    // Actions
    setGrade,
    selectConcept,
    setSearchQuery,
    openBrowser,
    closeBrowser,
    toggleBrowser,
    isToolVisible,
    engine
  };
});
