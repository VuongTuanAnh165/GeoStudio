import LZString from 'lz-string';
import {
  ShareableStateSchema,
  type ShareableState
} from '../types/export';
import { GeoPackageSchema } from '../types/export';

export interface ShareStateStats {
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
}

export class ShareLinkService {
  /**
   * Mã hóa đối tượng state thành chuỗi URL-safe nén (LZ-String)
   */
  public static encodeShareState(state: ShareableState): string {
    const jsonStr = JSON.stringify(state);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return compressed;
  }

  /**
   * Giải mã chuỗi URL-safe thành đối tượng ShareableState hợp lệ
   */
  public static decodeShareState(encoded: string): ShareableState | null {
    if (!encoded || typeof encoded !== 'string') {
      return null;
    }

    let jsonStr: string | null = null;

    // 1. Thử giải nén bằng LZString
    try {
      jsonStr = LZString.decompressFromEncodedURIComponent(encoded);
    } catch {
      jsonStr = null;
    }

    // 2. Thử giải nén fallback qua URL-safe Base64 nếu LZString không trả về
    if (!jsonStr) {
      try {
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        if (typeof atob === 'function') {
          jsonStr = decodeURIComponent(escape(atob(base64)));
        } else if (typeof Buffer !== 'undefined') {
          jsonStr = Buffer.from(base64, 'base64').toString('utf8');
        }
      } catch {
        jsonStr = null;
      }
    }

    if (!jsonStr) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonStr) as unknown;
      // Thử validate theo ShareableStateSchema
      const shareRes = ShareableStateSchema.safeParse(parsed);
      if (shareRes.success) {
        return shareRes.data;
      }

      // Hoặc validate theo GeoPackageSchema nếu được chia sẻ dưới dạng package
      const pkgRes = GeoPackageSchema.safeParse(parsed);
      if (pkgRes.success) {
        return {
          format: 'geostudio',
          version: pkgRes.data.version,
          type: pkgRes.data.type,
          title: pkgRes.data.metadata.title,
          grade: pkgRes.data.metadata.grade,
          document: pkgRes.data.document,
          lesson: pkgRes.data.lesson,
          annotations: pkgRes.data.annotations,
          coordinate: pkgRes.data.coordinate
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Tạo đường dẫn URL chia sẻ hoàn chỉnh
   */
  public static generateShareUrl(state: ShareableState, baseUrl?: string): string {
    const encoded = this.encodeShareState(state);
    let base = baseUrl;

    if (!base && typeof window !== 'undefined' && window.location) {
      base = `${window.location.origin}${window.location.pathname}`;
    }

    if (!base) {
      base = 'http://localhost:3000/workspace';
    }

    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}share=${encoded}`;
  }

  /**
   * Trích xuất và giải mã ShareableState từ URL hoặc chuỗi query
   */
  public static extractShareStateFromUrl(urlOrQuery: string): ShareableState | null {
    if (!urlOrQuery) return null;

    let searchPart = urlOrQuery;
    if (urlOrQuery.includes('?')) {
      searchPart = urlOrQuery.split('?')[1] || '';
    }

    const params = new URLSearchParams(searchPart);
    const token = params.get('share') || params.get('state');

    if (!token) return null;
    return this.decodeShareState(token);
  }

  /**
   * Tính toán tỷ lệ nén và kích thước payload
   */
  public static getStats(state: ShareableState): ShareStateStats {
    const jsonStr = JSON.stringify(state);
    const compressed = this.encodeShareState(state);
    const originalLength = jsonStr.length;
    const compressedLength = compressed.length;
    const compressionRatio = originalLength > 0 ? Number(((1 - compressedLength / originalLength) * 100).toFixed(1)) : 0;

    return {
      originalLength,
      compressedLength,
      compressionRatio
    };
  }
}
