import type { Template } from '../../core/types/template';

export const BASIC_SHAPES_TEMPLATES: Template[] = [
  {
    id: 'tpl-acute-triangle',
    title: 'Tam giác nhọn ABC',
    description: 'Tam giác nhọn với 3 góc đều nhỏ hơn 90 độ, gồm 3 đỉnh A, B, C và 3 cạnh AB, BC, CA.',
    category: 'basic_shapes',
    grade: 6,
    tags: ['tam giác', 'tam giác nhọn', 'đa giác', '2D'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-acute-triangle',
        title: 'Tam giác nhọn ABC',
        description: 'Mẫu tam giác nhọn ABC',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        grade: 6,
        tags: ['tam giác']
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -6, xMax: 6, yMin: -4, yMax: 6 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0.5, y: 4 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -4, y: -1 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 4.5, y: -1 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, metadata: { label: 'c' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, metadata: { label: 'a' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, metadata: { label: 'b' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'poly_ABC', type: 'polygon', dimension: 2, parents: ['A', 'B', 'C'], definition: { kind: 'polygon', vertices: ['A', 'B', 'C'] }, style: { color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.15 } }
      ]
    }
  },
  {
    id: 'tpl-right-triangle',
    title: 'Tam giác vuông tại A',
    description: 'Tam giác vuông với góc vuông tại đỉnh A (định lý Pythagore: BC² = AB² + AC²).',
    category: 'basic_shapes',
    grade: 7,
    tags: ['tam giác vuông', 'pythagore', 'góc vuông'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-right-triangle',
        title: 'Tam giác vuông tại A',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        grade: 7
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -3, xMax: 8, yMin: -2, yMax: 6 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 0 } }, metadata: { label: 'A' }, style: { color: '#ef4444', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 4 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 5, y: 0 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_AC', type: 'segment', dimension: 2, parents: ['A', 'C'], definition: { kind: 'segment', point1: 'A', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#10b981', strokeWidth: 2.5 } },
        { id: 'poly_ABC', type: 'polygon', dimension: 2, parents: ['A', 'B', 'C'], definition: { kind: 'polygon', vertices: ['A', 'B', 'C'] }, style: { color: '#3b82f6', fillColor: '#a7f3d0', fillOpacity: 0.15 } }
      ]
    }
  },
  {
    id: 'tpl-equilateral-triangle',
    title: 'Tam giác đều ABC',
    description: 'Tam giác đều có 3 cạnh bằng nhau và 3 góc bằng 60 độ.',
    category: 'basic_shapes',
    grade: 6,
    tags: ['tam giác đều', 'góc 60 độ', 'cạnh bằng nhau'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-equilateral-triangle',
        title: 'Tam giác đều ABC',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        grade: 6
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -5, xMax: 5, yMin: -2, yMax: 6 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 4.33 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -2.5, y: 0 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 2.5, y: 0 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'poly_ABC', type: 'polygon', dimension: 2, parents: ['A', 'B', 'C'], definition: { kind: 'polygon', vertices: ['A', 'B', 'C'] }, style: { color: '#3b82f6', fillColor: '#fed7aa', fillOpacity: 0.2 } }
      ]
    }
  },
  {
    id: 'tpl-rectangle',
    title: 'Hình chữ nhật ABCD',
    description: 'Tứ giác có 4 góc vuông, hai đường chéo bằng nhau và cắt nhau tại trung điểm mỗi đường.',
    category: 'basic_shapes',
    grade: 8,
    tags: ['hình chữ nhật', 'tứ giác', 'góc vuông', 'đường chéo'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-rectangle',
        title: 'Hình chữ nhật ABCD',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        grade: 8
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -6, xMax: 6, yMin: -4, yMax: 4 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -4, y: -2 } }, metadata: { label: 'A' } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 4, y: -2 } }, metadata: { label: 'B' } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 4, y: 2 } }, metadata: { label: 'C' } },
        { id: 'D', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -4, y: 2 } }, metadata: { label: 'D' } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CD', type: 'segment', dimension: 2, parents: ['C', 'D'], definition: { kind: 'segment', point1: 'C', point2: 'D' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_DA', type: 'segment', dimension: 2, parents: ['D', 'A'], definition: { kind: 'segment', point1: 'D', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_AC', type: 'segment', dimension: 2, parents: ['A', 'C'], definition: { kind: 'segment', point1: 'A', point2: 'C' }, style: { color: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4,4' } },
        { id: 'seg_BD', type: 'segment', dimension: 2, parents: ['B', 'D'], definition: { kind: 'segment', point1: 'B', point2: 'D' }, style: { color: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4,4' } },
        { id: 'poly_ABCD', type: 'polygon', dimension: 2, parents: ['A', 'B', 'C', 'D'], definition: { kind: 'polygon', vertices: ['A', 'B', 'C', 'D'] }, style: { color: '#3b82f6', fillColor: '#bae6fd', fillOpacity: 0.15 } }
      ]
    }
  },
  {
    id: 'tpl-parallelogram',
    title: 'Hình bình hành ABCD',
    description: 'Tứ giác có hai cặp cạnh đối song song và bằng nhau, hai đường chéo cắt nhau tại trung điểm.',
    category: 'basic_shapes',
    grade: 8,
    tags: ['hình bình hành', 'tứ giác', 'song song'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-parallelogram',
        title: 'Hình bình hành ABCD',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        grade: 8
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -5, xMax: 7, yMin: -4, yMax: 4 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -3, y: -2 } }, metadata: { label: 'A' } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3, y: -2 } }, metadata: { label: 'B' } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 5, y: 2 } }, metadata: { label: 'C' } },
        { id: 'D', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -1, y: 2 } }, metadata: { label: 'D' } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CD', type: 'segment', dimension: 2, parents: ['C', 'D'], definition: { kind: 'segment', point1: 'C', point2: 'D' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_DA', type: 'segment', dimension: 2, parents: ['D', 'A'], definition: { kind: 'segment', point1: 'D', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'poly_ABCD', type: 'polygon', dimension: 2, parents: ['A', 'B', 'C', 'D'], definition: { kind: 'polygon', vertices: ['A', 'B', 'C', 'D'] }, style: { color: '#3b82f6', fillColor: '#ddd6fe', fillOpacity: 0.15 } }
      ]
    }
  },
  {
    id: 'tpl-circle-radius',
    title: 'Đường tròn tâm O và bán kính R',
    description: 'Đường tròn tâm O đi qua điểm A với bán kính R = OA.',
    category: 'basic_shapes',
    grade: 6,
    tags: ['đường tròn', 'tâm O', 'bán kính', 'hình tròn'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-circle-radius',
        title: 'Đường tròn tâm O và bán kính R',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        grade: 6
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
        { id: 'O', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 0 } }, metadata: { label: 'O' }, style: { color: '#ef4444', size: 5 } },
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3, y: 0 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'c_O', type: 'circle', dimension: 2, parents: ['O', 'A'], definition: { kind: 'circle', center: 'O', pointOnCircle: 'A' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        { id: 'seg_OA', type: 'segment', dimension: 2, parents: ['O', 'A'], definition: { kind: 'segment', point1: 'O', point2: 'A' }, metadata: { label: 'R' }, style: { color: '#ef4444', strokeWidth: 2, strokeDasharray: '4,4' } }
      ]
    }
  }
];
