import { describe, it, expect } from 'vitest';
import { GeoPackageService } from '../../../../core/export/GeoPackageService';
import type { GeoDocument } from '../../../../core/types/document';
import type { Lesson } from '../../../../core/types/lesson';
import type { Annotation } from '../../../../core/types/annotation';

describe('GeoPackageService', () => {
  const mockDoc: GeoDocument = {
    version: '1.0.0',
    schemaVersion: 1,
    metadata: {
      id: 'doc-001',
      title: 'Tam giác đều ABC',
      description: 'Dựng tam giác đều nội tiếp',
      author: 'Thầy Hưng',
      grade: 9,
      tags: ['hinh-hoc-phang', 'tam-giac'],
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
    viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
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
        definition: { kind: 'free_point', x: 4, y: 0 },
        metadata: { label: 'B' }
      },
      {
        id: 'seg_AB',
        type: 'segment',
        dimension: 2,
        parents: ['p_A', 'p_B'],
        definition: { kind: 'segment', point1Id: 'p_A', point2Id: 'p_B' }
      }
    ],
    constraints: []
  };

  const mockLesson: Lesson = {
    id: 'lesson-001',
    title: 'Bài giảng Tam giác đều',
    grade: 9,
    description: 'Các bước dựng tam giác đều',
    tags: ['tam-giac-deu'],
    document: mockDoc,
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        objectIds: ['p_A', 'p_B'],
        title: 'Chấm 2 điểm A và B',
        description: 'Vẽ 2 điểm cơ sở',
        duration: 2000
      },
      {
        id: 'step-2',
        stepNumber: 2,
        objectIds: ['seg_AB'],
        title: 'Nối đoạn thẳng AB',
        description: 'Dùng thước nối A và B',
        duration: 2000
      }
    ],
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z'
  };

  const mockAnnotations: Annotation[] = [
    {
      id: 'anno-1',
      type: 'formula',
      content: 'AB = 4\\text{cm}',
      position: { x: 2, y: -0.5 },
      style: { color: '#2563eb' },
      visible: true
    }
  ];

  it('creates a standard geometry package from a document', () => {
    const pkg = GeoPackageService.createGeoPackage({
      document: mockDoc,
      annotations: mockAnnotations
    });

    expect(pkg.format).toBe('geostudio');
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.type).toBe('geometry');
    expect(pkg.metadata.title).toBe('Tam giác đều ABC');
    expect(pkg.metadata.grade).toBe(9);
    expect(pkg.document.objects.length).toBe(3);
    expect(pkg.annotations?.length).toBe(1);
    expect(pkg.lesson).toBeUndefined();
  });

  it('creates a lesson package when a lesson is provided', () => {
    const pkg = GeoPackageService.createGeoPackage({
      document: mockDoc,
      lesson: mockLesson,
      annotations: mockAnnotations
    });

    expect(pkg.type).toBe('lesson');
    expect(pkg.metadata.title).toBe('Bài giảng Tam giác đều');
    expect(pkg.lesson).toBeDefined();
    expect(pkg.lesson?.steps.length).toBe(2);
  });

  it('serializes and parses a GeoPackage successfully', () => {
    const pkg = GeoPackageService.createGeoPackage({
      document: mockDoc,
      lesson: mockLesson
    });

    const serialized = GeoPackageService.serializeGeoPackage(pkg);
    const parseRes = GeoPackageService.parseGeoPackage(serialized);

    expect(parseRes.success).toBe(true);
    expect(parseRes.data).toBeDefined();
    expect(parseRes.data?.metadata.title).toBe('Bài giảng Tam giác đều');
    expect(parseRes.data?.type).toBe('lesson');
  });

  it('handles backward compatibility for raw GeoDocument JSON', () => {
    const rawDocJson = JSON.stringify(mockDoc);
    const parseRes = GeoPackageService.parseGeoPackage(rawDocJson);

    expect(parseRes.success).toBe(true);
    expect(parseRes.data?.type).toBe('geometry');
    expect(parseRes.data?.metadata.title).toBe('Tam giác đều ABC');
    expect(parseRes.data?.document.objects.length).toBe(3);
  });

  it('handles backward compatibility for raw Lesson JSON', () => {
    const rawLessonJson = JSON.stringify(mockLesson);
    const parseRes = GeoPackageService.parseGeoPackage(rawLessonJson);

    expect(parseRes.success).toBe(true);
    expect(parseRes.data?.type).toBe('lesson');
    expect(parseRes.data?.lesson?.steps.length).toBe(2);
  });

  it('rejects invalid or corrupted JSON gracefully', () => {
    const parseRes1 = GeoPackageService.parseGeoPackage('{ corrupt: json');
    expect(parseRes1.success).toBe(false);
    expect(parseRes1.error).toContain('JSON');

    const parseRes2 = GeoPackageService.parseGeoPackage('{"randomKey": "randomValue"}');
    expect(parseRes2.success).toBe(false);
    expect(parseRes2.error).toContain('không tương thích');
  });

  it('merges an incoming package into a current document without ID collisions', () => {
    const incomingDoc: GeoDocument = {
      ...mockDoc,
      metadata: { ...mockDoc.metadata, id: 'incoming-doc' },
      objects: [
        {
          id: 'p_A', // Colliding ID with mockDoc!
          type: 'point',
          dimension: 2,
          definition: { kind: 'free_point', x: 5, y: 5 },
          metadata: { label: 'A_new' }
        },
        {
          id: 'p_C',
          type: 'point',
          dimension: 2,
          definition: { kind: 'free_point', x: 2, y: 3.46 },
          metadata: { label: 'C' }
        }
      ]
    };

    const incomingAnnotations: Annotation[] = [
      {
        id: 'anno-1', // Colliding annotation ID!
        type: 'text',
        content: 'Tam giác đều',
        position: { x: 2, y: 2 },
        visible: true
      }
    ];

    const mergeRes = GeoPackageService.mergeGeoPackageIntoDocument(
      mockDoc,
      incomingDoc,
      mockAnnotations,
      incomingAnnotations
    );

    // Total objects should be 3 + 2 = 5
    expect(mergeRes.document.objects.length).toBe(5);
    // Total annotations should be 1 + 1 = 2
    expect(mergeRes.annotations.length).toBe(2);

    // Verify all object IDs in mergedDoc are distinct
    const ids = mergeRes.document.objects.map((o) => o.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify all annotation IDs are distinct
    const annoIds = mergeRes.annotations.map((a) => a.id);
    const uniqueAnnoIds = new Set(annoIds);
    expect(uniqueAnnoIds.size).toBe(annoIds.length);
  });
});
