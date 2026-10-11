import { describe, it, expect } from 'vitest';
import {
  ALL_PREBUILT_TEMPLATES,
  PREBUILT_TEMPLATES_BY_ID,
  BASIC_SHAPES_TEMPLATES,
  TRIANGLE_CONSTRUCTIONS_TEMPLATES,
  CIRCLE_THEOREMS_TEMPLATES,
  THREE_D_SOLIDS_TEMPLATES,
  getPrebuiltTemplate,
  getPrebuiltTemplatesByCategory
} from '../../../../content/templates';
import { TemplateSchema } from '../../../../core/types/template';

describe('Pre-built Template Library', () => {
  it('contains templates in all required categories', () => {
    expect(BASIC_SHAPES_TEMPLATES.length).toBeGreaterThan(0);
    expect(TRIANGLE_CONSTRUCTIONS_TEMPLATES.length).toBeGreaterThan(0);
    expect(CIRCLE_THEOREMS_TEMPLATES.length).toBeGreaterThan(0);
    expect(THREE_D_SOLIDS_TEMPLATES.length).toBeGreaterThan(0);
    expect(ALL_PREBUILT_TEMPLATES.length).toBe(
      BASIC_SHAPES_TEMPLATES.length +
      TRIANGLE_CONSTRUCTIONS_TEMPLATES.length +
      CIRCLE_THEOREMS_TEMPLATES.length +
      THREE_D_SOLIDS_TEMPLATES.length
    );
  });

  it('validates every prebuilt template against TemplateSchema', () => {
    for (const tpl of ALL_PREBUILT_TEMPLATES) {
      const parseResult = TemplateSchema.safeParse(tpl);
      expect(parseResult.success, `Template ${tpl.id} failed schema validation: ${JSON.stringify(parseResult)}`).toBe(true);
      expect(tpl.document.objects.length).toBeGreaterThan(0);
      expect(tpl.document.version).toBe('1.0.0');
      expect(tpl.document.schemaVersion).toBe(1);
    }
  });

  it('correctly maps 3D solids templates with dimension = 3', () => {
    for (const tpl of THREE_D_SOLIDS_TEMPLATES) {
      expect(tpl.category).toBe('3d_solids');
      expect(tpl.document.settings.dimension).toBe(3);
    }
  });

  it('correctly maps 2D templates with dimension = 2', () => {
    const twoDTemplates = [
      ...BASIC_SHAPES_TEMPLATES,
      ...TRIANGLE_CONSTRUCTIONS_TEMPLATES,
      ...CIRCLE_THEOREMS_TEMPLATES
    ];
    for (const tpl of twoDTemplates) {
      expect(tpl.document.settings.dimension).toBe(2);
    }
  });

  it('retrieves templates by ID and Category correctly', () => {
    const firstTpl = ALL_PREBUILT_TEMPLATES[0]!;
    expect(getPrebuiltTemplate(firstTpl.id)).toEqual(firstTpl);
    expect(PREBUILT_TEMPLATES_BY_ID.get(firstTpl.id)).toEqual(firstTpl);

    const triangleTemplates = getPrebuiltTemplatesByCategory('triangle_constructions');
    expect(triangleTemplates.length).toBe(TRIANGLE_CONSTRUCTIONS_TEMPLATES.length);
    for (const tpl of triangleTemplates) {
      expect(tpl.category).toBe('triangle_constructions');
    }
  });
});
