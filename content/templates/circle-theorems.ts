import type { Template } from '../../core/types/template';

export const CIRCLE_THEOREMS_TEMPLATES: Template[] = [
  {
    id: 'tpl-inscribed-central-angle',
    title: 'Góc nội tiếp và góc ở tâm',
    description: 'Trong một đường tròn, số đo góc nội tiếp bằng nửa số đo của góc ở tâm cùng chắn một cung (góc ACB = 1/2 góc AOB).',
    category: 'circle_theorems',
    grade: 9,
    tags: ['đường tròn', 'góc nội tiếp', 'góc ở tâm', 'định lý'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-inscribed-angle',
        title: 'Góc nội tiếp và góc ở tâm cùng chắn cung',
        grade: 9,
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
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        { id: 'O', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 0 } }, metadata: { label: 'O' }, style: { color: '#ef4444', size: 5 } },
        { id: 'R_pt', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3.5, y: 0 } }, metadata: { label: 'R' }, style: { color: '#94a3b8', size: 3 } },
        { id: 'c_O', type: 'circle', dimension: 2, parents: ['O', 'R_pt'], definition: { kind: 'circle', center: 'O', pointOnCircle: 'R_pt' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        // 2 điểm A, B trên đường tròn chắn cung AB
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -2.47, y: -2.47 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 2.47, y: -2.47 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        // Điểm C trên đường tròn (cung lớn)
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 3.5 } }, metadata: { label: 'C' }, style: { color: '#10b981', size: 4.5 } },
        // Góc ở tâm AOB
        { id: 'seg_OA', type: 'segment', dimension: 2, parents: ['O', 'A'], definition: { kind: 'segment', point1: 'O', point2: 'A' }, style: { color: '#ef4444', strokeWidth: 2 } },
        { id: 'seg_OB', type: 'segment', dimension: 2, parents: ['O', 'B'], definition: { kind: 'segment', point1: 'O', point2: 'B' }, style: { color: '#ef4444', strokeWidth: 2 } },
        // Góc nội tiếp ACB
        { id: 'seg_CA', type: 'segment', dimension: 2, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#10b981', strokeWidth: 2 } },
        { id: 'seg_CB', type: 'segment', dimension: 2, parents: ['C', 'B'], definition: { kind: 'segment', point1: 'C', point2: 'B' }, style: { color: '#10b981', strokeWidth: 2 } }
      ]
    }
  },
  {
    id: 'tpl-thales-circle',
    title: 'Góc nội tiếp chắn nửa đường tròn',
    description: 'Góc nội tiếp chắn nửa đường tròn là góc vuông (tam giác nội tiếp có một cạnh là đường kính thì vuông tại đỉnh đối diện).',
    category: 'circle_theorems',
    grade: 9,
    tags: ['nửa đường tròn', 'góc vuông', 'đường kính', 'tam giác vuông'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-thales-circle',
        title: 'Góc nội tiếp chắn nửa đường tròn',
        grade: 9,
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
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        { id: 'O', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 0 } }, metadata: { label: 'O' }, style: { color: '#64748b', size: 4 } },
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -3.5, y: 0 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3.5, y: 0 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'c_O', type: 'circle', dimension: 2, parents: ['O', 'B'], definition: { kind: 'circle', center: 'O', pointOnCircle: 'B' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, metadata: { label: 'Đường kính AB' }, style: { color: '#1e293b', strokeWidth: 2.5 } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 1.75, y: 3.03 } }, metadata: { label: 'C' }, style: { color: '#ef4444', size: 4.5 } },
        { id: 'seg_AC', type: 'segment', dimension: 2, parents: ['A', 'C'], definition: { kind: 'segment', point1: 'A', point2: 'C' }, style: { color: '#ef4444', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#ef4444', strokeWidth: 2 } }
      ]
    }
  },
  {
    id: 'tpl-circle-tangent',
    title: 'Tiếp tuyến của đường tròn',
    description: 'Đường thẳng vuông góc với bán kính tại tiếp điểm là tiếp tuyến của đường tròn (d ⊥ OM tại M).',
    category: 'circle_theorems',
    grade: 9,
    tags: ['tiếp tuyến', 'tiếp điểm', 'vuông góc bán kính'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-circle-tangent',
        title: 'Tiếp tuyến của đường tròn',
        grade: 9,
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
      viewport: { xMin: -5, xMax: 6, yMin: -5, yMax: 5 },
      objects: [
        { id: 'O', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 0 } }, metadata: { label: 'O' }, style: { color: '#64748b', size: 4 } },
        { id: 'M', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3, y: 0 } }, metadata: { label: 'M (tiếp điểm)' }, style: { color: '#ef4444', size: 5 } },
        { id: 'c_O', type: 'circle', dimension: 2, parents: ['O', 'M'], definition: { kind: 'circle', center: 'O', pointOnCircle: 'M' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        { id: 'seg_OM', type: 'segment', dimension: 2, parents: ['O', 'M'], definition: { kind: 'segment', point1: 'O', point2: 'M' }, metadata: { label: 'R' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        // Tiếp tuyến d qua M vuông góc OM
        { id: 'T1', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3, y: -4 } }, metadata: { label: '' }, style: { visible: false } },
        { id: 'T2', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3, y: 4 } }, metadata: { label: '' }, style: { visible: false } },
        { id: 'line_tangent', type: 'segment', dimension: 2, parents: ['T1', 'T2'], definition: { kind: 'segment', point1: 'T1', point2: 'T2' }, metadata: { label: 'Tiếp tuyến d' }, style: { color: '#ef4444', strokeWidth: 2.5 } }
      ]
    }
  },
  {
    id: 'tpl-cyclic-quadrilateral',
    title: 'Tứ giác nội tiếp đường tròn',
    description: 'Tứ giác có 4 đỉnh cùng nằm trên một đường tròn, tổng hai góc đối diện bằng 180 độ.',
    category: 'circle_theorems',
    grade: 9,
    tags: ['tứ giác nội tiếp', 'đường tròn', 'tổng 2 góc 180'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-cyclic-quad',
        title: 'Tứ giác nội tiếp đường tròn',
        grade: 9,
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
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        { id: 'O', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 0, y: 0 } }, metadata: { label: 'O' }, style: { color: '#94a3b8', size: 4 } },
        { id: 'R_pt', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3.5, y: 0 } }, metadata: { label: '' }, style: { visible: false } },
        { id: 'c_O', type: 'circle', dimension: 2, parents: ['O', 'R_pt'], definition: { kind: 'circle', center: 'O', pointOnCircle: 'R_pt' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        { id: 'A', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -2.47, y: 2.47 } }, metadata: { label: 'A' }, style: { color: '#10b981', size: 4 } },
        { id: 'B', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 2.47, y: 2.47 } }, metadata: { label: 'B' }, style: { color: '#10b981', size: 4 } },
        { id: 'C', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: 3.03, y: -1.75 } }, metadata: { label: 'C' }, style: { color: '#10b981', size: 4 } },
        { id: 'D', type: 'point', dimension: 2, definition: { kind: 'point', coords: { x: -1.75, y: -3.03 } }, metadata: { label: 'D' }, style: { color: '#10b981', size: 4 } },
        { id: 'seg_AB', type: 'segment', dimension: 2, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 2, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CD', type: 'segment', dimension: 2, parents: ['C', 'D'], definition: { kind: 'segment', point1: 'C', point2: 'D' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_DA', type: 'segment', dimension: 2, parents: ['D', 'A'], definition: { kind: 'segment', point1: 'D', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'poly_ABCD', type: 'polygon', dimension: 2, parents: ['A', 'B', 'C', 'D'], definition: { kind: 'polygon', vertices: ['A', 'B', 'C', 'D'] }, style: { color: '#10b981', fillColor: '#a7f3d0', fillOpacity: 0.15 } }
      ]
    }
  }
];
