import type { Template } from '../../core/types/template';

export const TRIANGLE_CONSTRUCTIONS_TEMPLATES: Template[] = [
  {
    id: 'tpl-orthocenter-altitudes',
    title: 'Trực tâm và 3 đường cao tam giác',
    description: 'Ba đường cao của tam giác cùng đi qua một điểm gọi là trực tâm H của tam giác.',
    category: 'triangle_constructions',
    grade: 7,
    tags: ['đường cao', 'trực tâm', 'tam giác', 'đồng quy'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-orthocenter',
        title: 'Trực tâm và 3 đường cao tam giác',
        grade: 7,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -6, xMax: 6, yMin: -3, yMax: 6 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0.5, y: 4.5 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -4, y: -1 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 4, y: -1 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        // Chân đường cao D on BC, E on CA, F on AB
        { id: 'D', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0.5, y: -1 } }, metadata: { label: 'D' }, style: { color: '#64748b', size: 3 } },
        { id: 'E', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 2.7, y: 1.05 } }, metadata: { label: 'E' }, style: { color: '#64748b', size: 3 } },
        { id: 'F', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -2.3, y: 1.05 } }, metadata: { label: 'F' }, style: { color: '#64748b', size: 3 } },
        // Trực tâm H
        { id: 'H', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0.5, y: 0.3 } }, metadata: { label: 'H' }, style: { color: '#ef4444', size: 5 } },
        // 3 đường cao
        { id: 'seg_AD', type: 'segment', dimension: 2, parents: ['A', 'D'], definition: { kind: 'segment', point1: 'A', point2: 'D' }, style: { color: '#ef4444', strokeWidth: 1.5, strokeDasharray: '3,3' } },
        { id: 'seg_BE', type: 'segment', dimension: 2, parents: ['B', 'E'], definition: { kind: 'segment', point1: 'B', point2: 'E' }, style: { color: '#ef4444', strokeWidth: 1.5, strokeDasharray: '3,3' } },
        { id: 'seg_CF', type: 'segment', dimension: 2, parents: ['C', 'F'], definition: { kind: 'segment', point1: 'C', point2: 'F' }, style: { color: '#ef4444', strokeWidth: 1.5, strokeDasharray: '3,3' } }
      ]
    }
  },
  {
    id: 'tpl-centroid-medians',
    title: 'Trọng tâm và 3 đường trung tuyến',
    description: 'Ba đường trung tuyến của tam giác cắt nhau tại một điểm gọi là trọng tâm G (AG = 2/3 AM).',
    category: 'triangle_constructions',
    grade: 7,
    tags: ['trung tuyến', 'trọng tâm', 'tam giác', 'tỉ lệ 2/3'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-centroid',
        title: 'Trọng tâm và 3 đường trung tuyến',
        grade: 7,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -6, xMax: 6, yMin: -3, yMax: 6 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 4 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -4, y: -2 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 4, y: -2 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        // 3 trung điểm M, N, P
        { id: 'M', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: -2 } }, metadata: { label: 'M' }, style: { color: '#10b981', size: 3.5 } },
        { id: 'N', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 2, y: 1 } }, metadata: { label: 'N' }, style: { color: '#10b981', size: 3.5 } },
        { id: 'P', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -2, y: 1 } }, metadata: { label: 'P' }, style: { color: '#10b981', size: 3.5 } },
        // Trọng tâm G
        { id: 'G', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 0 } }, metadata: { label: 'G' }, style: { color: '#8b5cf6', size: 5 } },
        // 3 trung tuyến
        { id: 'seg_AM', type: 'segment', dimension: 2, parents: ['A', 'M'], definition: { kind: 'segment', point1: 'A', point2: 'M' }, style: { color: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '4,4' } },
        { id: 'seg_BN', type: 'segment', dimension: 2, parents: ['B', 'N'], definition: { kind: 'segment', point1: 'B', point2: 'N' }, style: { color: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '4,4' } },
        { id: 'seg_CP', type: 'segment', dimension: 2, parents: ['C', 'P'], definition: { kind: 'segment', point1: 'C', point2: 'P' }, style: { color: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '4,4' } }
      ]
    }
  },
  {
    id: 'tpl-incenter-bisectors',
    title: 'Tâm đường tròn nội tiếp và 3 phân giác',
    description: 'Ba đường phân giác trong của tam giác đồng quy tại tâm I của đường tròn nội tiếp tiếp xúc 3 cạnh.',
    category: 'triangle_constructions',
    grade: 7,
    tags: ['phân giác', 'tâm nội tiếp', 'đường tròn nội tiếp'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-incenter',
        title: 'Tâm đường tròn nội tiếp và 3 phân giác',
        grade: 7,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
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
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 4.5 } }, metadata: { label: 'A' } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -3.5, y: 0 } }, metadata: { label: 'B' } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3.5, y: 0 } }, metadata: { label: 'C' } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'I', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 1.34 } }, metadata: { label: 'I' }, style: { color: '#f59e0b', size: 5 } },
        { id: 'c_I', type: 'circle', dimension: 2, parents: ['I'], definition: { kind: 'circle', center: 'I', radius: 1.34 }, style: { color: '#f59e0b', strokeWidth: 2 } },
        { id: 'seg_AI', type: 'segment', dimension: 2, parents: ['A', 'I'], definition: { kind: 'segment', point1: 'A', point2: 'I' }, style: { color: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '3,3' } },
        { id: 'seg_BI', type: 'segment', dimension: 2, parents: ['B', 'I'], definition: { kind: 'segment', point1: 'B', point2: 'I' }, style: { color: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '3,3' } },
        { id: 'seg_CI', type: 'segment', dimension: 2, parents: ['C', 'I'], definition: { kind: 'segment', point1: 'C', point2: 'I' }, style: { color: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '3,3' } }
      ]
    }
  },
  {
    id: 'tpl-circumcenter',
    title: 'Tâm đường tròn ngoại tiếp và 3 trung trực',
    description: 'Ba đường trung trực của tam giác đồng quy tại tâm O của đường tròn ngoại tiếp đi qua 3 đỉnh.',
    category: 'triangle_constructions',
    grade: 7,
    tags: ['trung trực', 'tâm ngoại tiếp', 'đường tròn ngoại tiếp'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-circumcenter',
        title: 'Tâm đường tròn ngoại tiếp và 3 trung trực',
        grade: 7,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
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
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 3.5 } }, metadata: { label: 'A' } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -3, y: -1 } }, metadata: { label: 'B' } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3.5, y: -0.5 } }, metadata: { label: 'C' } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'O', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0.17, y: 0.85 } }, metadata: { label: 'O' }, style: { color: '#0ea5e9', size: 5 } },
        { id: 'c_O', type: 'circle', dimension: 2, parents: ['O', 'A'], definition: { kind: 'circle', center: 'O', pointOnCircle: 'A' }, style: { color: '#0ea5e9', strokeWidth: 2 } }
      ]
    }
  },
  {
    id: 'tpl-mid-segment',
    title: 'Đường trung bình của tam giác',
    description: 'Đoạn nối trung điểm hai cạnh tam giác thì song song với cạnh thứ ba và bằng nửa cạnh đó (MN // BC, MN = 1/2 BC).',
    category: 'triangle_constructions',
    grade: 8,
    tags: ['đường trung bình', 'song song', 'tỉ lệ 1/2'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-mid-segment',
        title: 'Đường trung bình của tam giác',
        grade: 8,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 2
      },
      viewport: { xMin: -6, xMax: 6, yMin: -3, yMax: 6 },
      objects: [
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 4 } }, metadata: { label: 'A' } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -4, y: -1 } }, metadata: { label: 'B' } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 4, y: -1 } }, metadata: { label: 'C' } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'M', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -2, y: 1.5 } }, metadata: { label: 'M' }, style: { color: '#10b981', size: 4 } },
        { id: 'N', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 2, y: 1.5 } }, metadata: { label: 'N' }, style: { color: '#10b981', size: 4 } },
        { id: 'seg_MN', type: 'segment', dimension: 2, parents: ['M', 'N'], definition: { kind: 'segment', point1: 'M', point2: 'N' }, style: { color: '#10b981', strokeWidth: 2.5 } }
      ]
    }
  }
];
