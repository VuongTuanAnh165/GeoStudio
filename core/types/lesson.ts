import { z } from 'zod';
import type { GeoDocument } from './document';

export const LessonStepSchema = z.object({
  id: z.string(),
  stepNumber: z.number().int().min(1),
  objectIds: z.array(z.string()).default([]),
  title: z.string().default(''),
  description: z.string().default(''),
  annotation: z.string().optional(),
  formula: z.string().optional(),
  duration: z.number().int().min(500).max(10000).default(2000)
});

export type LessonStep = z.infer<typeof LessonStepSchema>;

export const LessonMetadataSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Tiêu đề bài giảng không được để trống'),
  grade: z.number().int().min(1).max(12),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type LessonMetadata = z.infer<typeof LessonMetadataSchema>;

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Tiêu đề bài giảng không được để trống'),
  grade: z.number().int().min(1).max(12),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  document: z.custom<GeoDocument>(),
  steps: z.array(LessonStepSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Lesson = z.infer<typeof LessonSchema>;
