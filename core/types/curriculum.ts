import { z } from 'zod';

export type GradeLevel = 'primary' | 'secondary' | 'high';

export const CurriculumConceptSchema = z.object({
  id: z.string(),
  grade: z.number().min(1).max(12),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  requiredTools: z.array(z.string()),
  dimension: z.union([z.literal(2), z.literal(3)]).default(2),
  keywords: z.array(z.string()).optional()
});

export type CurriculumConcept = z.infer<typeof CurriculumConceptSchema>;

export const GradeCurriculumSchema = z.object({
  grade: z.number().min(1).max(12),
  name: z.string(),
  level: z.enum(['primary', 'secondary', 'high']),
  description: z.string(),
  allowedTools: z.array(z.string()),
  concepts: z.array(CurriculumConceptSchema)
});

export type GradeCurriculum = z.infer<typeof GradeCurriculumSchema>;
