import type { Template } from '../../core/types/template';

export const THREE_D_SOLIDS_TEMPLATES: Template[] = [
  {
    id: 'tpl-cube-3d',
    title: 'Hình lập phương ABCD.A\'B\'C\'D\'',
    description: 'Khối đa diện đều có 6 mặt là hình vuông bằng nhau, 12 cạnh bằng nhau, 8 đỉnh.',
    category: '3d_solids',
    grade: 11,
    tags: ['hình lập phương', 'đa diện đều', '3D', 'không gian'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-cube-3d',
        title: 'Hình lập phương ABCD.A\'B\'C\'D\'',
        grade: 11,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 3
      },
      viewport: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
      objects: [
        // 8 đỉnh 3D
        { id: 'A', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -1.5, y: -1.5, z: 0 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 1.5, y: -1.5, z: 0 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 1.5, y: 1.5, z: 0 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'D', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -1.5, y: 1.5, z: 0 } }, metadata: { label: 'D' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'A_prime', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -1.5, y: -1.5, z: 3 } }, metadata: { label: "A'" }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B_prime', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 1.5, y: -1.5, z: 3 } }, metadata: { label: "B'" }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C_prime', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 1.5, y: 1.5, z: 3 } }, metadata: { label: "C'" }, style: { color: '#3b82f6', size: 4 } },
        { id: 'D_prime', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -1.5, y: 1.5, z: 3 } }, metadata: { label: "D'" }, style: { color: '#3b82f6', size: 4 } },
        // 12 cạnh
        { id: 'seg_AB', type: 'segment', dimension: 3, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 3, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CD', type: 'segment', dimension: 3, parents: ['C', 'D'], definition: { kind: 'segment', point1: 'C', point2: 'D' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_DA', type: 'segment', dimension: 3, parents: ['D', 'A'], definition: { kind: 'segment', point1: 'D', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_A1B1', type: 'segment', dimension: 3, parents: ['A_prime', 'B_prime'], definition: { kind: 'segment', point1: 'A_prime', point2: 'B_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_B1C1', type: 'segment', dimension: 3, parents: ['B_prime', 'C_prime'], definition: { kind: 'segment', point1: 'B_prime', point2: 'C_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_C1D1', type: 'segment', dimension: 3, parents: ['C_prime', 'D_prime'], definition: { kind: 'segment', point1: 'C_prime', point2: 'D_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_D1A1', type: 'segment', dimension: 3, parents: ['D_prime', 'A_prime'], definition: { kind: 'segment', point1: 'D_prime', point2: 'A_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_AA1', type: 'segment', dimension: 3, parents: ['A', 'A_prime'], definition: { kind: 'segment', point1: 'A', point2: 'A_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BB1', type: 'segment', dimension: 3, parents: ['B', 'B_prime'], definition: { kind: 'segment', point1: 'B', point2: 'B_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CC1', type: 'segment', dimension: 3, parents: ['C', 'C_prime'], definition: { kind: 'segment', point1: 'C', point2: 'C_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_DD1', type: 'segment', dimension: 3, parents: ['D', 'D_prime'], definition: { kind: 'segment', point1: 'D', point2: 'D_prime' }, style: { color: '#1e293b', strokeWidth: 2 } }
      ]
    }
  },
  {
    id: 'tpl-pyramid-regular',
    title: 'Hình chóp tứ giác đều S.ABCD',
    description: 'Hình chóp có đáy ABCD là hình vuông và các cạnh bên bằng nhau (đỉnh S chiếu vuông góc xuống tâm O của đáy).',
    category: '3d_solids',
    grade: 11,
    tags: ['hình chóp', 'chóp đều', '3D', 'không gian'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-pyramid-regular',
        title: 'Hình chóp tứ giác đều S.ABCD',
        grade: 11,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 3
      },
      viewport: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
      objects: [
        { id: 'A', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -2, y: -2, z: 0 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 2, y: -2, z: 0 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 2, y: 2, z: 0 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'D', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -2, y: 2, z: 0 } }, metadata: { label: 'D' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'O', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 0, y: 0, z: 0 } }, metadata: { label: 'O' }, style: { color: '#94a3b8', size: 3.5 } },
        { id: 'S', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 0, y: 0, z: 3.5 } }, metadata: { label: 'S' }, style: { color: '#ef4444', size: 5 } },
        // Đáy
        { id: 'seg_AB', type: 'segment', dimension: 3, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 3, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CD', type: 'segment', dimension: 3, parents: ['C', 'D'], definition: { kind: 'segment', point1: 'C', point2: 'D' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_DA', type: 'segment', dimension: 3, parents: ['D', 'A'], definition: { kind: 'segment', point1: 'D', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        // Cạnh bên
        { id: 'seg_SA', type: 'segment', dimension: 3, parents: ['S', 'A'], definition: { kind: 'segment', point1: 'S', point2: 'A' }, style: { color: '#ef4444', strokeWidth: 2 } },
        { id: 'seg_SB', type: 'segment', dimension: 3, parents: ['S', 'B'], definition: { kind: 'segment', point1: 'S', point2: 'B' }, style: { color: '#ef4444', strokeWidth: 2 } },
        { id: 'seg_SC', type: 'segment', dimension: 3, parents: ['S', 'C'], definition: { kind: 'segment', point1: 'S', point2: 'C' }, style: { color: '#ef4444', strokeWidth: 2 } },
        { id: 'seg_SD', type: 'segment', dimension: 3, parents: ['S', 'D'], definition: { kind: 'segment', point1: 'S', point2: 'D' }, style: { color: '#ef4444', strokeWidth: 2 } },
        // Chiều cao SO
        { id: 'seg_SO', type: 'segment', dimension: 3, parents: ['S', 'O'], definition: { kind: 'segment', point1: 'S', point2: 'O' }, style: { color: '#6366f1', strokeWidth: 1.5, strokeDasharray: '3,3' } }
      ]
    }
  },
  {
    id: 'tpl-tetrahedron-3d',
    title: 'Hình chóp tam giác / Tứ diện S.ABC',
    description: 'Khối tứ diện có 4 đỉnh S, A, B, C và 4 mặt đều là các hình tam giác.',
    category: '3d_solids',
    grade: 11,
    tags: ['tứ diện', 'chóp tam giác', '3D'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-tetrahedron-3d',
        title: 'Hình chóp tam giác S.ABC',
        grade: 11,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 3
      },
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        { id: 'A', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -2, y: -1.5, z: 0 } }, metadata: { label: 'A' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'B', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 2, y: -1.5, z: 0 } }, metadata: { label: 'B' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'C', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 0, y: 2, z: 0 } }, metadata: { label: 'C' }, style: { color: '#3b82f6', size: 4 } },
        { id: 'S', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 0, y: 0, z: 3.2 } }, metadata: { label: 'S' }, style: { color: '#ef4444', size: 5 } },
        // Đáy ABC
        { id: 'seg_AB', type: 'segment', dimension: 3, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 3, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 3, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        // Cạnh bên
        { id: 'seg_SA', type: 'segment', dimension: 3, parents: ['S', 'A'], definition: { kind: 'segment', point1: 'S', point2: 'A' }, style: { color: '#ef4444', strokeWidth: 2 } },
        { id: 'seg_SB', type: 'segment', dimension: 3, parents: ['S', 'B'], definition: { kind: 'segment', point1: 'S', point2: 'B' }, style: { color: '#ef4444', strokeWidth: 2 } },
        { id: 'seg_SC', type: 'segment', dimension: 3, parents: ['S', 'C'], definition: { kind: 'segment', point1: 'S', point2: 'C' }, style: { color: '#ef4444', strokeWidth: 2 } }
      ]
    }
  },
  {
    id: 'tpl-prism-triangular',
    title: 'Hình lăng trụ tam giác ABC.A\'B\'C\'',
    description: 'Hình lăng trụ có hai đáy tam giác song song và bằng nhau, các mặt bên là hình bình hành.',
    category: '3d_solids',
    grade: 11,
    tags: ['lăng trụ', 'lăng trụ tam giác', '3D'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-prism-triangular',
        title: 'Hình lăng trụ tam giác ABC.A\'B\'C\'',
        grade: 11,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 3
      },
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        { id: 'A', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -2, y: -1.5, z: 0 } }, metadata: { label: 'A' } },
        { id: 'B', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 2, y: -1.5, z: 0 } }, metadata: { label: 'B' } },
        { id: 'C', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 0, y: 1.5, z: 0 } }, metadata: { label: 'C' } },
        { id: 'A_prime', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: -2, y: -1.5, z: 3.5 } }, metadata: { label: "A'" } },
        { id: 'B_prime', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 2, y: -1.5, z: 3.5 } }, metadata: { label: "B'" } },
        { id: 'C_prime', type: 'point', dimension: 3, definition: { kind: 'point', coords: { x: 0, y: 1.5, z: 3.5 } }, metadata: { label: "C'" } },
        // Đáy dưới
        { id: 'seg_AB', type: 'segment', dimension: 3, parents: ['A', 'B'], definition: { kind: 'segment', point1: 'A', point2: 'B' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_BC', type: 'segment', dimension: 3, parents: ['B', 'C'], definition: { kind: 'segment', point1: 'B', point2: 'C' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_CA', type: 'segment', dimension: 3, parents: ['C', 'A'], definition: { kind: 'segment', point1: 'C', point2: 'A' }, style: { color: '#1e293b', strokeWidth: 2 } },
        // Đáy trên
        { id: 'seg_A1B1', type: 'segment', dimension: 3, parents: ['A_prime', 'B_prime'], definition: { kind: 'segment', point1: 'A_prime', point2: 'B_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_B1C1', type: 'segment', dimension: 3, parents: ['B_prime', 'C_prime'], definition: { kind: 'segment', point1: 'B_prime', point2: 'C_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        { id: 'seg_C1A1', type: 'segment', dimension: 3, parents: ['C_prime', 'A_prime'], definition: { kind: 'segment', point1: 'C_prime', point2: 'A_prime' }, style: { color: '#1e293b', strokeWidth: 2 } },
        // Cạnh bên
        { id: 'seg_AA1', type: 'segment', dimension: 3, parents: ['A', 'A_prime'], definition: { kind: 'segment', point1: 'A', point2: 'A_prime' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        { id: 'seg_BB1', type: 'segment', dimension: 3, parents: ['B', 'B_prime'], definition: { kind: 'segment', point1: 'B', point2: 'B_prime' }, style: { color: '#3b82f6', strokeWidth: 2 } },
        { id: 'seg_CC1', type: 'segment', dimension: 3, parents: ['C', 'C_prime'], definition: { kind: 'segment', point1: 'C', point2: 'C_prime' }, style: { color: '#3b82f6', strokeWidth: 2 } }
      ]
    }
  },
  {
    id: 'tpl-cylinder-3d',
    title: 'Hình trụ 3D (Cylinder)',
    description: 'Hình trụ tròn xoay với hai đáy tròn song song bán kính R = 2 và chiều cao h = 3.5.',
    category: '3d_solids',
    grade: 12,
    tags: ['hình trụ', 'tròn xoay', '3D', 'thể tích'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-cylinder-3d',
        title: 'Hình trụ 3D',
        grade: 12,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 3
      },
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        {
          id: 'solid_cyl',
          type: 'solid',
          dimension: 3,
          definition: {
            kind: 'cylinder',
            bottomCenter: { x: 0, y: 0, z: 0 },
            topCenter: { x: 0, y: 0, z: 3.5 },
            radius: 2
          },
          style: { color: '#0ea5e9' }
        }
      ]
    }
  },
  {
    id: 'tpl-cone-3d',
    title: 'Hình nón 3D (Cone)',
    description: 'Hình nón tròn xoay có đỉnh S, đáy hình tròn bán kính R = 2, chiều cao h = 3.5.',
    category: '3d_solids',
    grade: 12,
    tags: ['hình nón', 'tròn xoay', '3D', 'thể tích'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-cone-3d',
        title: 'Hình nón 3D',
        grade: 12,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 3
      },
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        {
          id: 'solid_cone',
          type: 'solid',
          dimension: 3,
          definition: {
            kind: 'cone',
            baseCenter: { x: 0, y: 0, z: 0 },
            apex: { x: 0, y: 0, z: 3.5 },
            radius: 2
          },
          style: { color: '#f59e0b' }
        }
      ]
    }
  },
  {
    id: 'tpl-sphere-3d',
    title: 'Hình cầu 3D (Sphere)',
    description: 'Mặt cầu tâm O(0, 0, 1.5) bán kính R = 2 trong không gian 3 chiều.',
    category: '3d_solids',
    grade: 12,
    tags: ['mặt cầu', 'hình cầu', '3D', 'bán kính'],
    isUserCreated: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: '1.0.0',
      schemaVersion: 1,
      metadata: {
        id: 'doc-tpl-sphere-3d',
        title: 'Hình cầu 3D',
        grade: 12,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      settings: {
        theme: 'light',
        gridVisible: true,
        axisVisible: true,
        snapEnabled: true,
        dimension: 3
      },
      viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      objects: [
        {
          id: 'solid_sphere',
          type: 'solid',
          dimension: 3,
          definition: {
            kind: 'sphere',
            center: { x: 0, y: 0, z: 1.5 },
            radius: 2
          },
          style: { color: '#a855f7' }
        }
      ]
    }
  }
];
