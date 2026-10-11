import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCurriculumStore } from '../../../../app/stores/curriculum';

describe('useCurriculumStore', () => {
  let store: ReturnType<typeof useCurriculumStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCurriculumStore();
  });

  describe('Initial State', () => {
    it('initializes with default free mode values', () => {
      expect(store.selectedGrade).toBeNull();
      expect(store.searchQuery).toBe('');
      expect(store.activeConceptId).toBeNull();
      expect(store.isBrowserOpen).toBe(false);
      expect(store.currentCurriculum).toBeNull();
      expect(store.activeConcept).toBeNull();
      expect(store.gradeLabel).toBe('Tất cả lớp');
      expect(store.allowedToolIds).toBeNull();
    });

    it('has all curricula and all concepts available', () => {
      expect(store.allCurricula).toHaveLength(12);
      expect(store.filteredConcepts.length).toBeGreaterThanOrEqual(25);
    });
  });

  describe('setGrade', () => {
    it('sets valid grade between 1 and 12', () => {
      store.setGrade(7);
      expect(store.selectedGrade).toBe(7);
      expect(store.gradeLabel).toBe('Lớp 7');
      expect(store.currentCurriculum?.name).toContain('Lớp 7');
      expect(store.allowedToolIds).toBeInstanceOf(Set);
    });

    it('sets grade back to null when passing null or invalid numbers', () => {
      store.setGrade(8);
      expect(store.selectedGrade).toBe(8);

      store.setGrade(null);
      expect(store.selectedGrade).toBeNull();
      expect(store.gradeLabel).toBe('Tất cả lớp');

      store.setGrade(15);
      expect(store.selectedGrade).toBeNull();

      store.setGrade(-1);
      expect(store.selectedGrade).toBeNull();
    });

    it('resets activeConceptId if active concept belongs to a different grade', () => {
      // Select concept in Grade 6
      store.selectConcept('g6_midpoint');
      expect(store.activeConceptId).toBe('g6_midpoint');
      expect(store.selectedGrade).toBe(6);

      // Change grade to 7
      store.setGrade(7);
      expect(store.selectedGrade).toBe(7);
      expect(store.activeConceptId).toBeNull();
    });

    it('keeps activeConceptId if new grade matches concept grade', () => {
      store.selectConcept('g6_midpoint');
      expect(store.activeConceptId).toBe('g6_midpoint');

      store.setGrade(6);
      expect(store.activeConceptId).toBe('g6_midpoint');
    });
  });

  describe('selectConcept', () => {
    it('selects concept by ID and updates selectedGrade', () => {
      store.selectConcept('g10_vectors');
      expect(store.activeConceptId).toBe('g10_vectors');
      expect(store.selectedGrade).toBe(10);
      expect(store.activeConcept?.name).toContain('Vectơ');
    });

    it('selects concept by object', () => {
      const concept = store.filteredConcepts[0];
      if (concept) {
        store.selectConcept(concept);
        expect(store.activeConceptId).toBe(concept.id);
        expect(store.selectedGrade).toBe(concept.grade);
      }
    });

    it('clears active concept when passing null', () => {
      store.selectConcept('g6_midpoint');
      expect(store.activeConceptId).toBe('g6_midpoint');

      store.selectConcept(null);
      expect(store.activeConceptId).toBeNull();
    });
  });

  describe('searchQuery & filteredConcepts', () => {
    it('updates search query and filters concepts reactively', () => {
      const initialCount = store.filteredConcepts.length;
      store.setSearchQuery('tam giác');
      expect(store.searchQuery).toBe('tam giác');
      expect(store.filteredConcepts.length).toBeLessThan(initialCount);
      expect(store.filteredConcepts.every(c => 
        c.name.toLowerCase().includes('tam giác') ||
        c.description.toLowerCase().includes('tam giác') ||
        c.category.toLowerCase().includes('tam giác') ||
        (c.keywords && c.keywords.some(k => k.toLowerCase().includes('tam giác')))
      )).toBe(true);
    });

    it('filters concepts by selected grade as well', () => {
      store.setGrade(8);
      store.setSearchQuery('hình');
      expect(store.filteredConcepts.every(c => c.grade === 8)).toBe(true);
    });
  });

  describe('Browser Modal Controls', () => {
    it('opens, closes and toggles browser state', () => {
      expect(store.isBrowserOpen).toBe(false);

      store.openBrowser();
      expect(store.isBrowserOpen).toBe(true);

      store.closeBrowser();
      expect(store.isBrowserOpen).toBe(false);

      store.toggleBrowser();
      expect(store.isBrowserOpen).toBe(true);

      store.toggleBrowser(false);
      expect(store.isBrowserOpen).toBe(false);

      store.toggleBrowser(true);
      expect(store.isBrowserOpen).toBe(true);
    });
  });

  describe('isToolVisible', () => {
    it('returns true for any tool when no grade is selected', () => {
      expect(store.selectedGrade).toBeNull();
      expect(store.isToolVisible('point')).toBe(true);
      expect(store.isToolVisible('construct_perpendicular')).toBe(true);
      expect(store.isToolVisible('cube')).toBe(true);
    });

    it('returns true/false based on selected grade curriculum', () => {
      store.setGrade(2);
      expect(store.isToolVisible('point')).toBe(true);
      expect(store.isToolVisible('segment')).toBe(true);
      expect(store.isToolVisible('construct_perpendicular')).toBe(false);
      expect(store.isToolVisible('cube')).toBe(false);

      store.setGrade(7);
      expect(store.isToolVisible('construct_perpendicular')).toBe(true);
      expect(store.isToolVisible('construct_parallel')).toBe(true);
      expect(store.isToolVisible('cube')).toBe(false);

      store.setGrade(11);
      expect(store.isToolVisible('cube')).toBe(true);
      expect(store.isToolVisible('view_3d')).toBe(true);
    });
  });
});
