import { describe, it, expect } from 'vitest';
import { ShareLinkService } from '../../../../core/export/ShareLinkService';
import type { ShareableState } from '../../../../core/types/export';
import type { GeoDocument } from '../../../../core/types/document';

describe('ShareLinkService', () => {
  const mockDoc: GeoDocument = {
    version: '1.0.0',
    schemaVersion: 1,
    metadata: {
      id: 'doc-share-01',
      title: 'Định lý Thales',
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-10T10:00:00.000Z'
    },
    settings: {
      theme: 'light',
      gridVisible: true,
      axisVisible: false,
      snapEnabled: true,
      dimension: 2
    },
    viewport: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
    objects: [
      {
        id: 'p1',
        type: 'point',
        dimension: 2,
        definition: { kind: 'free_point', x: 0, y: 0 }
      },
      {
        id: 'p2',
        type: 'point',
        dimension: 2,
        definition: { kind: 'free_point', x: 3, y: 0 }
      }
    ]
  };

  const sampleState: ShareableState = {
    format: 'geostudio',
    version: '1.0.0',
    type: 'geometry',
    title: 'Định lý Thales',
    grade: 8,
    document: mockDoc,
    annotations: [
      {
        id: 'a1',
        type: 'text',
        content: 'Tam giác ABC',
        position: { x: 0, y: 0 },
        visible: true
      }
    ],
    coordinate: {
      grid: { visible: true, size: 1, style: 'lines' },
      axis: { visible: false, showLabels: true, showArrows: true }
    }
  };

  it('encodes and decodes state correctly without loss of data', () => {
    const encoded = ShareLinkService.encodeShareState(sampleState);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = ShareLinkService.decodeShareState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.title).toBe('Định lý Thales');
    expect(decoded?.grade).toBe(8);
    expect(decoded?.document.objects.length).toBe(2);
    expect(decoded?.annotations?.length).toBe(1);
    expect(decoded?.coordinate?.grid?.style).toBe('lines');
  });

  it('generates a valid share URL with encoded state parameter', () => {
    const url = ShareLinkService.generateShareUrl(sampleState, 'https://geostudio.edu.vn/workspace');
    expect(url.startsWith('https://geostudio.edu.vn/workspace?share=')).toBe(true);

    const extracted = ShareLinkService.extractShareStateFromUrl(url);
    expect(extracted).not.toBeNull();
    expect(extracted?.title).toBe('Định lý Thales');
    expect(extracted?.document.objects.length).toBe(2);
  });

  it('supports query string with state parameter as fallback', () => {
    const encoded = ShareLinkService.encodeShareState(sampleState);
    const query = `state=${encoded}`;
    const extracted = ShareLinkService.extractShareStateFromUrl(query);

    expect(extracted).not.toBeNull();
    expect(extracted?.title).toBe('Định lý Thales');
  });

  it('returns null when given invalid or corrupted encoded tokens', () => {
    expect(ShareLinkService.decodeShareState('')).toBeNull();
    expect(ShareLinkService.decodeShareState('not_a_valid_lz_string_###')).toBeNull();
    expect(ShareLinkService.extractShareStateFromUrl('')).toBeNull();
    expect(ShareLinkService.extractShareStateFromUrl('https://example.com/')).toBeNull();
  });

  it('calculates compression statistics correctly', () => {
    const stats = ShareLinkService.getStats(sampleState);
    expect(stats.originalLength).toBeGreaterThan(0);
    expect(stats.compressedLength).toBeGreaterThan(0);
    expect(stats.compressionRatio).toBeGreaterThan(0);
  });
});
