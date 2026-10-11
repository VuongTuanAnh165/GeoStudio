import { z } from 'zod';

export const ReplaySpeedSchema = z.union([
  z.literal(0.5),
  z.literal(1),
  z.literal(1.5),
  z.literal(2)
]);

export type ReplaySpeed = z.infer<typeof ReplaySpeedSchema>;

export const ConstructionStepItemSchema = z.object({
  index: z.number().int().min(1),
  id: z.string(),
  objectIds: z.array(z.string()),
  label: z.string(),
  type: z.string(),
  description: z.string(),
  annotation: z.string().optional()
});

export type ConstructionStepItem = z.infer<typeof ConstructionStepItemSchema>;

export interface ConstructionReplayState {
  isActive: boolean;
  isPresentationMode: boolean;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: ReplaySpeed;
}
