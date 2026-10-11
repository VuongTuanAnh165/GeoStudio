import { z } from 'zod';
import type { GeoDocument } from './document';

export type TemplateCategory =
  | 'basic_shapes'
  | 'triangle_constructions'
  | 'circle_theorems'
  | '3d_solids'
  | 'user';

export const TemplateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  category: z.enum(['basic_shapes', 'triangle_constructions', 'circle_theorems', '3d_solids', 'user']),
  grade: z.number().optional(),
  tags: z.array(z.string()).default([]),
  thumbnail: z.string().optional(),
  isUserCreated: z.boolean().default(false),
  document: z.any(),
  createdAt: z.union([z.string(), z.number()]),
  updatedAt: z.union([z.string(), z.number()])
});

export interface Template {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  grade?: number;
  tags: string[];
  thumbnail?: string;
  isUserCreated: boolean;
  document: GeoDocument;
  createdAt: string | number;
  updatedAt: string | number;
}
