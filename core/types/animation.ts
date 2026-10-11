import { z } from 'zod';

export const AnimationEasingSchema = z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']);
export type AnimationEasing = z.infer<typeof AnimationEasingSchema>;

export const AnimationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  duration: z.number().min(0).max(5000).default(300),
  easing: AnimationEasingSchema.default('easeInOut'),
  constructionFadeIn: z.boolean().default(true),
  transformTransition: z.boolean().default(true),
  deleteFadeOut: z.boolean().default(true)
});

export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  enabled: true,
  duration: 300,
  easing: 'easeInOut',
  constructionFadeIn: true,
  transformTransition: true,
  deleteFadeOut: true
};

export const EasingFunctions: Record<AnimationEasing, (t: number) => number> = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
};
