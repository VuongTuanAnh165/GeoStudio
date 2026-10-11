import { describe, it, expect, beforeEach } from 'vitest';
import { CurriculumEngine } from '../../../../core/curriculum/CurriculumEngine';

describe('CurriculumEngine', () => {
  let engine: CurriculumEngine;

  beforeEach(() => {
    engine = new CurriculumEngine();
  });

  describe('Curriculum Data Loading', () => {
    it('loads all 12 grade curricula', () => {
      const all = engine.getAllCurricula();
      expect(all).toHaveLength(12);

      for (let g = 1; g <= 12; g++) {
        const cur = engine.getCurriculum(g);
        expect(cur).toBeDefined();
        expect(cur?.grade).toBe(g);
        expect(cur?.name).toBeTruthy();
        expect(cur?.allowedTools.length).toBeGreaterThan(0);
        expect(cur?.concepts.length).toBeGreaterThan(0);
      }
    });

    it('returns undefined for non-existent grade numbers', () => {
      expect(engine.getCurriculum(0)).toBeUndefined();
      expect(engine.getCurriculum(13)).toBeUndefined();
      expect(engine.getCurriculum(-5)).toBeUndefined();
    });

    it('loads and aggregates concepts across all grades', () => {
      const allConcepts = engine.getAllConcepts();
      expect(allConcepts.length).toBeGreaterThanOrEqual(25);

      const grade6Concepts = engine.getConceptsByGrade(6);
      expect(grade6Concepts.length).toBeGreaterThan(0);
      expect(grade6Concepts.every(c => c.grade === 6)).toBe(true);

      const invalidGradeConcepts = engine.getConceptsByGrade(99);
      expect(invalidGradeConcepts).toEqual([]);
    });

    it('finds a concept by ID', () => {
      const concept = engine.getConcept('g6_points_lines');
      expect(concept).toBeDefined();
      expect(concept?.name).toContain('đoạn thẳng');
      expect(concept?.grade).toBe(6);

      expect(engine.getConcept('non_existent_concept')).toBeUndefined();
    });
  });

  describe('searchConcepts', () => {
    it('returns all concepts when search query is empty', () => {
      const results = engine.searchConcepts('');
      expect(results.length).toBe(engine.getAllConcepts().length);
    });

    it('searches concepts by name or keyword', () => {
      const results = engine.searchConcepts('trung điểm');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(c => c.name.toLowerCase().includes('trung điểm'))).toBe(true);
    });

    it('searches concepts filtered by grade', () => {
      const allMidpoints = engine.searchConcepts('trung điểm');
      const grade6Midpoints = engine.searchConcepts('trung điểm', 6);
      expect(grade6Midpoints.length).toBeGreaterThan(0);
      expect(grade6Midpoints.every(c => c.grade === 6)).toBe(true);
      expect(allMidpoints.length).toBeGreaterThanOrEqual(grade6Midpoints.length);
    });

    it('searches concepts by description and keywords', () => {
      const results = engine.searchConcepts('tọa độ');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(c => c.grade >= 10)).toBe(true);
    });

    it('returns empty array when query does not match anything', () => {
      const results = engine.searchConcepts('xyz-unmatched-query-12345');
      expect(results).toEqual([]);
    });
  });

  describe('normalizeToolId', () => {
    it('normalizes construct_ prefixes', () => {
      expect(engine.normalizeToolId('construct_midpoint')).toBe('midpoint');
      expect(engine.normalizeToolId('construct_perpendicular')).toBe('perpendicular');
      expect(engine.normalizeToolId('construct_parallel')).toBe('parallel');
    });

    it('normalizes construct_measure_ prefixes', () => {
      expect(engine.normalizeToolId('construct_measure_distance')).toBe('measure_distance');
      expect(engine.normalizeToolId('construct_measure_angle')).toBe('measure_angle');
    });

    it('normalizes transform_ prefixes', () => {
      expect(engine.normalizeToolId('transform_rotate')).toBe('rotate');
      expect(engine.normalizeToolId('transform_reflect')).toBe('reflect');
      expect(engine.normalizeToolId('transform_translate')).toBe('translate');
    });

    it('normalizes 3d tool id to view_3d', () => {
      expect(engine.normalizeToolId('3d')).toBe('view_3d');
    });

    it('keeps standard tool ids unchanged', () => {
      expect(engine.normalizeToolId('point')).toBe('point');
      expect(engine.normalizeToolId('segment')).toBe('segment');
      expect(engine.normalizeToolId('select')).toBe('select');
      expect(engine.normalizeToolId('delete')).toBe('delete');
    });
  });

  describe('isToolAllowed and getAllowedToolsForGrade', () => {
    it('allows all tools when grade is null (free mode)', () => {
      expect(engine.isToolAllowed('point', null)).toBe(true);
      expect(engine.isToolAllowed('construct_perpendicular', null)).toBe(true);
      expect(engine.isToolAllowed('cube', null)).toBe(true);
      expect(engine.isToolAllowed('transform_rotate', null)).toBe(true);
      expect(engine.getAllowedToolsForGrade(null)).toBeNull();
    });

    it('allows basic manipulation tools (select, delete) for any grade', () => {
      for (let g = 1; g <= 12; g++) {
        expect(engine.isToolAllowed('select', g)).toBe(true);
        expect(engine.isToolAllowed('delete', g)).toBe(true);
      }
    });

    it('enforces Grade 1 capability matrix (point, segment, polygon)', () => {
      expect(engine.isToolAllowed('point', 1)).toBe(true);
      expect(engine.isToolAllowed('segment', 1)).toBe(true);
      expect(engine.isToolAllowed('polygon', 1)).toBe(true);

      // Advanced tools should be disallowed in Grade 1
      expect(engine.isToolAllowed('circle', 1)).toBe(false);
      expect(engine.isToolAllowed('construct_perpendicular', 1)).toBe(false);
      expect(engine.isToolAllowed('transform_rotate', 1)).toBe(false);
      expect(engine.isToolAllowed('cube', 1)).toBe(false);
    });

    it('enforces Grade 6 capability matrix', () => {
      expect(engine.isToolAllowed('point', 6)).toBe(true);
      expect(engine.isToolAllowed('segment', 6)).toBe(true);
      expect(engine.isToolAllowed('line', 6)).toBe(true);
      expect(engine.isToolAllowed('ray', 6)).toBe(true);
      expect(engine.isToolAllowed('construct_midpoint', 6)).toBe(true);
      expect(engine.isToolAllowed('construct_measure_angle', 6)).toBe(true);

      // 3D solid construction not yet in grade 6
      expect(engine.isToolAllowed('cube', 6)).toBe(false);
    });

    it('enforces Grade 11 capability matrix with 3D tools', () => {
      expect(engine.isToolAllowed('view_3d', 11)).toBe(true);
      expect(engine.isToolAllowed('cube', 11)).toBe(true);
      expect(engine.isToolAllowed('cylinder', 11)).toBe(true);
      expect(engine.isToolAllowed('transform_rotate', 11)).toBe(true);
      expect(engine.isToolAllowed('transform_translate', 11)).toBe(true);
    });

    it('returns a set of allowed tool names for a specific grade', () => {
      const allowedGrade3 = engine.getAllowedToolsForGrade(3);
      expect(allowedGrade3).toBeInstanceOf(Set);
      expect(allowedGrade3?.has('point')).toBe(true);
      expect(allowedGrade3?.has('circle')).toBe(true);
      expect(allowedGrade3?.has('cube')).toBe(false);
    });

    it('handles non-existent grade gracefully by returning true', () => {
      expect(engine.isToolAllowed('point', 999)).toBe(true);
    });
  });
});
