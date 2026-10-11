import { describe, it, expect } from 'vitest';
import { LessonSchema, LessonStepSchema } from '../../../../core/types/lesson';
import type { GeoDocument } from '../../../../core/types/document';

describe('LessonSchema and LessonStepSchema', () => {
  const dummyDoc: GeoDocument = {
    version: '1.0.0',
    schemaVersion: 1,
    metadata: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Tam giác ABC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    settings: {
      theme: 'light',
      gridVisible: true,
      axisVisible: true,
      snapEnabled: true,
      dimension: 2
    },
    viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    objects: []
  };

  it('validates a valid lesson step', () => {
    const validStep = {
      id: 'step_1',
      stepNumber: 1,
      objectIds: ['p1', 'p2'],
      title: 'Dựng đoạn thẳng AB',
      description: 'Nối điểm A với điểm B',
      annotation: 'Chú ý sử dụng thước thẳng',
      formula: 'AB = 5\\text{cm}',
      duration: 2500
    };

    const res = LessonStepSchema.safeParse(validStep);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.stepNumber).toBe(1);
      expect(res.data.formula).toBe('AB = 5\\text{cm}');
    }
  });

  it('rejects an invalid step number (< 1)', () => {
    const invalidStep = {
      id: 'step_0',
      stepNumber: 0,
      objectIds: [],
      title: 'Bước không hợp lệ'
    };

    const res = LessonStepSchema.safeParse(invalidStep);
    expect(res.success).toBe(false);
  });

  it('validates a complete Lesson object', () => {
    const validLesson = {
      id: 'lesson-altitude-001',
      title: 'Đường cao tam giác',
      grade: 7,
      description: 'Dựng 3 đường cao trong tam giác nhọn ABC',
      tags: ['tam giác', 'đường cao', 'trực tâm'],
      document: dummyDoc,
      steps: [
        {
          id: 'step_1',
          stepNumber: 1,
          objectIds: ['A', 'B', 'C'],
          title: 'Tạo 3 đỉnh A, B, C',
          description: 'Đặt ba điểm không thẳng hàng trên mặt phẳng',
          annotation: 'Tam giác nhọn',
          formula: ''
        },
        {
          id: 'step_2',
          stepNumber: 2,
          objectIds: ['H'],
          title: 'Dựng trực tâm H',
          description: 'Giao điểm của hai đường cao',
          annotation: 'Trực tâm nằm trong tam giác',
          formula: 'AH \\perp BC'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = LessonSchema.safeParse(validLesson);
    expect(res.success).toBe(true);
  });

  it('rejects a lesson with empty title or grade out of range', () => {
    const emptyTitle = {
      id: 'lesson-1',
      title: '',
      grade: 7,
      document: dummyDoc,
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(LessonSchema.safeParse(emptyTitle).success).toBe(false);

    const invalidGrade = {
      id: 'lesson-2',
      title: 'Bài học',
      grade: 15, // Grade must be between 1 and 12
      document: dummyDoc,
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(LessonSchema.safeParse(invalidGrade).success).toBe(false);
  });
});
