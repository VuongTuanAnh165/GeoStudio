import { z } from 'zod';
import type { GeometryObject } from './geometry';

// Zod schemas for validation
export const GeoDocumentMetadataSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  grade: z.number().optional(),
  tags: z.array(z.string()).optional(),
  locale: z.string().optional()
});

import { AnimationConfigSchema, DEFAULT_ANIMATION_CONFIG, type AnimationConfig } from './animation';

export const GeoDocumentSettingsSchema = z.object({
  theme: z.string().default('light'),
  gridVisible: z.boolean().default(true),
  axisVisible: z.boolean().default(true),
  snapEnabled: z.boolean().default(true),
  dimension: z.union([z.literal(2), z.literal(3)]).default(2),
  animation: AnimationConfigSchema.optional()
});

export const GeoDocumentViewportSchema = z.object({
  xMin: z.number(),
  xMax: z.number(),
  yMin: z.number(),
  yMax: z.number()
});

export const GeometryConstraintSchema = z.object({
  id: z.string(),
  type: z.string(),
  objectIds: z.array(z.string()),
  parameters: z.record(z.string(), z.unknown()).optional()
});

export const GeometryObjectSchema = z.object({
  id: z.string(),
  type: z.string(),
  dimension: z.union([z.literal(2), z.literal(3)]).optional(),
  parents: z.array(z.string()).optional(),
  definition: z.record(z.string(), z.unknown()),
  constraints: z.array(z.string()).optional(),
  style: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const GeoDocumentSchema = z.object({
  version: z.string(),
  schemaVersion: z.number(),
  metadata: GeoDocumentMetadataSchema,
  settings: GeoDocumentSettingsSchema,
  viewport: GeoDocumentViewportSchema,
  objects: z.array(GeometryObjectSchema),
  constraints: z.array(GeometryConstraintSchema).optional(),
  sliders: z.array(z.any()).optional(),
  annotations: z.array(z.any()).optional(),
  constructionSteps: z.array(z.any()).optional()
});

// Export inferred types
export type GeoDocumentMetadata = z.infer<typeof GeoDocumentMetadataSchema>;
export type GeoDocumentSettings = z.infer<typeof GeoDocumentSettingsSchema>;
export type GeoDocumentViewport = z.infer<typeof GeoDocumentViewportSchema>;
export type { AnimationConfig, AnimationEasing } from './animation';

// Full interface mapping to the schema
import type { GeometryConstraint } from './geometry';

export interface GeoDocument {
  version: string;
  schemaVersion: number;
  metadata: GeoDocumentMetadata;
  settings: GeoDocumentSettings;
  viewport: GeoDocumentViewport;
  objects: GeometryObject[];
  constraints?: GeometryConstraint[];
  sliders?: unknown[];
  annotations?: unknown[];
  constructionSteps?: unknown[];
}
