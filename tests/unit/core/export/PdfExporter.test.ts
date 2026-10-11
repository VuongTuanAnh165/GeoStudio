import { describe, it, expect } from 'vitest';
import { PdfExporter } from '../../../../core/export/PdfExporter';
import type { GeoDocument } from '../../../../core/types/document';
import type { Lesson } from '../../../../core/types/lesson';
import type { Annotation } from '../../../../core/types/annotation';

describe('PdfExporter', () => {
  const mockDoc: GeoDocument = {
    version: '1.0.0',
    schemaVersion: 1,
    metadata: {
      id: 'doc-pdf-01',
      title: 'Hệ thức lượng trong tam giác vuông',
      description: 'Định lý Pythagoras và các hệ thức lượng',
      author: 'Cô Mai',
      grade: 9,
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-10T10:00:00.000Z'
    },
    settings: {
      theme: 'light',
      gridVisible: true,
      axisVisible: true,
      snapEnabled: true,
      dimension: 2
    },
    viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
    objects: [
      {
        id: 'p_A',
        type: 'point',
        dimension: 2,
        definition: { kind: 'free_point', x: 0, y: 0 },
        metadata: { label: 'A' }
      },
      {
        id: 'p_B',
        type: 'point',
        dimension: 2,
        definition: { kind: 'free_point', x: 3, y: 0 },
        metadata: { label: 'B' }
      },
      {
        id: 'p_C',
        type: 'point',
        dimension: 2,
        definition: { kind: 'free_point', x: 0, y: 4 },
        metadata: { label: 'C' }
      },
      {
        id: 'seg_AB',
        type: 'segment',
        dimension: 2,
        definition: { kind: 'segment', point1Id: 'p_A', point2Id: 'p_B' }
      },
      {
        id: 'seg_AC',
        type: 'segment',
        dimension: 2,
        definition: { kind: 'segment', point1Id: 'p_A', point2Id: 'p_C' }
      },
      {
        id: 'seg_BC',
        type: 'segment',
        dimension: 2,
        definition: { kind: 'segment', point1Id: 'p_B', point2Id: 'p_C' }
      }
    ]
  };

  const mockLesson: Lesson = {
    id: 'lesson-pythagoras',
    title: 'Định lý Pythagoras',
    grade: 9,
    description: 'Chứng minh hình học trực quan',
    tags: ['pythagoras', 'hinh-hoc'],
    document: mockDoc,
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        objectIds: ['p_A', 'p_B', 'p_C'],
        title: 'Dựng tam giác vuông ABC tại A',
        description: 'AB = 3cm, AC = 4cm',
        formula: 'BC^2 = AB^2 + AC^2',
        duration: 2500
      }
    ],
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z'
  };

  const mockAnnotations: Annotation[] = [
    {
      id: 'anno-1',
      type: 'formula',
      content: 'a^2 = b^2 + c^2',
      position: { x: 1.5, y: 2 },
      style: { color: '#2563eb' },
      visible: true
    }
  ];

  it('exports a valid PDF blob for a standalone document', async () => {
    const blob = await PdfExporter.exportToPdf({
      document: mockDoc,
      options: {
        title: 'Tam giác vuông',
        author: 'Cô Mai',
        orientation: 'portrait',
        pageSize: 'a4'
      }
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('exports a multi-page PDF blob when lesson steps and annotations are included', async () => {
    const blob = await PdfExporter.exportToPdf({
      document: mockDoc,
      lesson: mockLesson,
      annotations: mockAnnotations,
      options: {
        orientation: 'landscape',
        includeLessonSteps: true,
        includeAnnotations: true
      }
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});
