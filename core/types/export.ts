import { z } from 'zod';
import { GeoDocumentSchema, type GeoDocument } from './document';
import { LessonSchema, type Lesson } from './lesson';
import { AnnotationSchema, type Annotation } from './annotation';
import { GridConfigSchema, AxisConfigSchema, type GridConfig, type AxisConfig } from './coordinate';

export const GeoPackageMetadataSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  author: z.string().optional(),
  grade: z.number().int().min(1).max(12).optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type GeoPackageMetadata = z.infer<typeof GeoPackageMetadataSchema>;

export const GeoPackageSchema = z.object({
  format: z.literal('geostudio').default('geostudio'),
  version: z.string().default('1.0.0'),
  type: z.enum(['lesson', 'geometry']),
  metadata: GeoPackageMetadataSchema,
  document: z.custom<GeoDocument>((val) => Boolean(val && typeof val === 'object' && 'objects' in (val as any)), {
    message: 'GeoDocument không hợp lệ'
  }),
  lesson: LessonSchema.optional(),
  annotations: z.array(AnnotationSchema).optional(),
  coordinate: z.object({
    grid: GridConfigSchema.optional(),
    axis: AxisConfigSchema.optional()
  }).optional()
});

export type GeoPackage = z.infer<typeof GeoPackageSchema>;

export const ShareableStateSchema = z.object({
  format: z.literal('geostudio').default('geostudio'),
  version: z.string().default('1.0.0'),
  type: z.enum(['lesson', 'geometry']),
  title: z.string().default('Chia sẻ hình học'),
  grade: z.number().int().min(1).max(12).optional(),
  document: z.custom<GeoDocument>((val) => Boolean(val && typeof val === 'object' && 'objects' in (val as any)), {
    message: 'GeoDocument không hợp lệ'
  }),
  lesson: LessonSchema.optional(),
  annotations: z.array(AnnotationSchema).optional(),
  coordinate: z.object({
    grid: GridConfigSchema.optional(),
    axis: AxisConfigSchema.optional()
  }).optional()
});

export type ShareableState = z.infer<typeof ShareableStateSchema>;

export interface PdfExportOptions {
  title?: string;
  author?: string;
  grade?: number;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
  includeLessonSteps?: boolean;
  includeAnnotations?: boolean;
  notes?: string;
}
