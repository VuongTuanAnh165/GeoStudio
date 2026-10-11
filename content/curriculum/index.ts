import type { GradeCurriculum, CurriculumConcept } from '../../core/types/curriculum';
import grade1 from './grade-1.json';
import grade2 from './grade-2.json';
import grade3 from './grade-3.json';
import grade4 from './grade-4.json';
import grade5 from './grade-5.json';
import grade6 from './grade-6.json';
import grade7 from './grade-7.json';
import grade8 from './grade-8.json';
import grade9 from './grade-9.json';
import grade10 from './grade-10.json';
import grade11 from './grade-11.json';
import grade12 from './grade-12.json';

export const ALL_GRADE_CURRICULA: GradeCurriculum[] = [
  grade1 as GradeCurriculum,
  grade2 as GradeCurriculum,
  grade3 as GradeCurriculum,
  grade4 as GradeCurriculum,
  grade5 as GradeCurriculum,
  grade6 as GradeCurriculum,
  grade7 as GradeCurriculum,
  grade8 as GradeCurriculum,
  grade9 as GradeCurriculum,
  grade10 as GradeCurriculum,
  grade11 as GradeCurriculum,
  grade12 as GradeCurriculum
];

export const CURRICULUM_BY_GRADE: Map<number, GradeCurriculum> = new Map(
  ALL_GRADE_CURRICULA.map(c => [c.grade, c])
);

export const ALL_CONCEPTS: CurriculumConcept[] = ALL_GRADE_CURRICULA.flatMap(c => c.concepts);

export const CONCEPTS_BY_ID: Map<string, CurriculumConcept> = new Map(
  ALL_CONCEPTS.map(concept => [concept.id, concept])
);
