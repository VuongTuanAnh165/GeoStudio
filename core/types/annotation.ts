import { z } from 'zod';

export type AnnotationType = 'text' | 'formula' | 'arrow' | 'step_label' | 'highlight';

export const AnnotationStyleSchema = z.object({
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.string().optional(),
  arrowHead: z.boolean().optional(),
  highlightColor: z.string().optional(),
  padding: z.number().optional(),
  borderRadius: z.number().optional()
});

export const AnnotationSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'formula', 'arrow', 'step_label', 'highlight']),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  targetPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  targetObjectId: z.string().optional(),
  content: z.string(),
  stepNumber: z.number().optional(),
  style: AnnotationStyleSchema.optional(),
  visible: z.boolean().default(true),
  createdAt: z.union([z.string(), z.number()]).optional(),
  updatedAt: z.union([z.string(), z.number()]).optional()
});

export type AnnotationStyle = z.infer<typeof AnnotationStyleSchema>;
export type Annotation = z.infer<typeof AnnotationSchema>;
