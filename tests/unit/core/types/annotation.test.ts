import { describe, it, expect } from 'vitest';
import { AnnotationSchema, AnnotationStyleSchema } from '../../../../core/types/annotation';

describe('AnnotationSchema and AnnotationStyleSchema', () => {
  it('validates a valid text annotation', () => {
    const textAnn = {
      id: 'ann_text_1',
      type: 'text',
      position: { x: 2, y: 3 },
      content: 'Tam giác vuông tại A',
      style: {
        color: '#1e293b',
        fontSize: 14
      },
      visible: true
    };

    const res = AnnotationSchema.safeParse(textAnn);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.type).toBe('text');
      expect(res.data.content).toBe('Tam giác vuông tại A');
      expect(res.data.position.x).toBe(2);
    }
  });

  it('validates a valid formula annotation (KaTeX)', () => {
    const formulaAnn = {
      id: 'ann_formula_1',
      type: 'formula',
      position: { x: -1, y: 4 },
      content: 'a^2 + b^2 = c^2',
      style: {
        color: '#2563eb',
        fontSize: 16
      },
      visible: true
    };

    const res = AnnotationSchema.safeParse(formulaAnn);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.type).toBe('formula');
      expect(res.data.content).toBe('a^2 + b^2 = c^2');
    }
  });

  it('validates a valid arrow annotation with targetPosition', () => {
    const arrowAnn = {
      id: 'ann_arrow_1',
      type: 'arrow',
      position: { x: 0, y: 0 },
      targetPosition: { x: 3, y: 4 },
      content: 'Góc vuông',
      style: {
        color: '#ef4444',
        arrowHead: true
      },
      visible: true
    };

    const res = AnnotationSchema.safeParse(arrowAnn);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.type).toBe('arrow');
      expect(res.data.targetPosition?.x).toBe(3);
      expect(res.data.targetPosition?.y).toBe(4);
    }
  });

  it('validates a valid step_label annotation with stepNumber', () => {
    const stepLabelAnn = {
      id: 'ann_step_1',
      type: 'step_label',
      position: { x: 5, y: -2 },
      content: 'Dựng đường cao AH',
      stepNumber: 1,
      style: {
        color: '#4f46e5',
        backgroundColor: '#e0e7ff'
      },
      visible: true
    };

    const res = AnnotationSchema.safeParse(stepLabelAnn);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.type).toBe('step_label');
      expect(res.data.stepNumber).toBe(1);
      expect(res.data.content).toBe('Dựng đường cao AH');
    }
  });

  it('validates a valid highlight annotation with targetObjectId', () => {
    const highlightAnn = {
      id: 'ann_highlight_1',
      type: 'highlight',
      position: { x: 1, y: 1 },
      targetObjectId: 'p_orthocenter',
      content: 'Trực tâm H',
      style: {
        highlightColor: '#f59e0b'
      },
      visible: true
    };

    const res = AnnotationSchema.safeParse(highlightAnn);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.type).toBe('highlight');
      expect(res.data.targetObjectId).toBe('p_orthocenter');
    }
  });

  it('rejects an annotation with an invalid type', () => {
    const invalidType = {
      id: 'ann_invalid',
      type: 'unknown_type',
      position: { x: 0, y: 0 },
      content: 'Test'
    };

    const res = AnnotationSchema.safeParse(invalidType);
    expect(res.success).toBe(false);
  });

  it('rejects an annotation missing an id or position', () => {
    const missingId = {
      type: 'text',
      position: { x: 0, y: 0 },
      content: 'Test'
    };
    expect(AnnotationSchema.safeParse(missingId).success).toBe(false);

    const missingPos = {
      id: 'ann_1',
      type: 'text',
      content: 'Test'
    };
    expect(AnnotationSchema.safeParse(missingPos).success).toBe(false);
  });
});
