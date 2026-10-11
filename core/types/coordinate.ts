import { z } from 'zod';
import type { Coords2D } from './geometry';

export type GridStyle = 'lines' | 'dots' | 'polar';

export const GridConfigSchema = z.object({
  visible: z.boolean().default(true),
  size: z.number().positive().default(1),
  style: z.enum(['lines', 'dots', 'polar']).default('lines'),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional()
});

export const AxisConfigSchema = z.object({
  visible: z.boolean().default(true),
  showLabels: z.boolean().default(true),
  showArrows: z.boolean().default(true),
  color: z.string().optional()
});

export type GridConfig = z.infer<typeof GridConfigSchema>;
export type AxisConfig = z.infer<typeof AxisConfigSchema>;

export type ParsedEquationType = 'line' | 'circle' | 'function';

export interface ParsedLineEquation {
  type: 'line';
  raw: string;
  // Ax + By + C = 0
  a: number;
  b: number;
  c: number;
  // Two representative points on the line for geometric construction
  point1: Coords2D;
  point2: Coords2D;
  slope?: number;
  yIntercept?: number;
}

export interface ParsedCircleEquation {
  type: 'circle';
  raw: string;
  center: Coords2D;
  radius: number;
  radiusSquared: number;
}

export interface ParsedFunctionEquation {
  type: 'function';
  raw: string;
  expression: string; // The mathematical formula f(x)
  variable: string; // 'x'
}

export type ParsedEquation = ParsedLineEquation | ParsedCircleEquation | ParsedFunctionEquation;

export interface LineEquationInfo {
  type: 'line';
  generalForm: string; // "2x - 3y + 6 = 0"
  slopeInterceptForm?: string; // "y = 0.67x + 2" or "x = 3"
  katexGeneral: string;
  katexSlopeIntercept?: string;
  a: number;
  b: number;
  c: number;
  slope?: number;
  intercept?: number;
}

export interface CircleEquationInfo {
  type: 'circle';
  standardForm: string; // "(x - 2)^2 + (y + 1)^2 = 9"
  generalForm: string; // "x^2 + y^2 - 4x + 2y - 4 = 0"
  katexStandard: string;
  katexGeneral: string;
  center: Coords2D;
  radius: number;
}

export interface FunctionEquationInfo {
  type: 'function';
  expression: string;
  formula: string; // "y = x^2 - 4"
  katexFormula: string;
}

export type GeometryEquationInfo = LineEquationInfo | CircleEquationInfo | FunctionEquationInfo;
