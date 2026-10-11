import type { Template, TemplateCategory } from '../../core/types/template';
import { BASIC_SHAPES_TEMPLATES } from './basic-shapes';
import { TRIANGLE_CONSTRUCTIONS_TEMPLATES } from './triangle-constructions';
import { CIRCLE_THEOREMS_TEMPLATES } from './circle-theorems';
import { THREE_D_SOLIDS_TEMPLATES } from './3d-solids';

export {
  BASIC_SHAPES_TEMPLATES,
  TRIANGLE_CONSTRUCTIONS_TEMPLATES,
  CIRCLE_THEOREMS_TEMPLATES,
  THREE_D_SOLIDS_TEMPLATES
};

export const ALL_PREBUILT_TEMPLATES: Template[] = [
  ...BASIC_SHAPES_TEMPLATES,
  ...TRIANGLE_CONSTRUCTIONS_TEMPLATES,
  ...CIRCLE_THEOREMS_TEMPLATES,
  ...THREE_D_SOLIDS_TEMPLATES
];

export const PREBUILT_TEMPLATES_BY_ID = new Map<string, Template>(
  ALL_PREBUILT_TEMPLATES.map(t => [t.id, t])
);

export function getPrebuiltTemplate(id: string): Template | undefined {
  return PREBUILT_TEMPLATES_BY_ID.get(id);
}

export function getPrebuiltTemplatesByCategory(category: TemplateCategory): Template[] {
  if (category === 'user') return [];
  return ALL_PREBUILT_TEMPLATES.filter(t => t.category === category);
}
