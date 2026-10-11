import type { GeoDocument } from '../types/document';
import type { GeometryObject, GeometryConstraint } from '../types/geometry';
import type { Lesson } from '../types/lesson';
import type { Annotation } from '../types/annotation';
import type { GridConfig, AxisConfig } from '../types/coordinate';
import {
  GeoPackageSchema,
  type GeoPackage,
  type GeoPackageMetadata
} from '../types/export';

export interface CreatePackageOptions {
  document: GeoDocument;
  metadata?: Partial<GeoPackageMetadata>;
  lesson?: Lesson | null;
  annotations?: Annotation[];
  coordinate?: {
    grid?: GridConfig;
    axis?: AxisConfig;
  };
}

export interface ParsePackageResult {
  success: boolean;
  data?: GeoPackage;
  error?: string;
}

export class GeoPackageService {
  /**
   * Tạo GeoPackage tiêu chuẩn (.geo JSON bundle) từ document, lesson và annotations
   */
  public static createGeoPackage(options: CreatePackageOptions): GeoPackage {
    const now = new Date().toISOString();
    const docMeta = options.document.metadata;
    const isLesson = Boolean(options.lesson && options.lesson.steps && options.lesson.steps.length > 0);

    const title = options.metadata?.title || (isLesson ? options.lesson?.title : docMeta.title) || 'Bản vẽ GeoStudio';
    const grade = options.metadata?.grade ?? (isLesson ? options.lesson?.grade : docMeta.grade);
    const description = options.metadata?.description || (isLesson ? options.lesson?.description : docMeta.description) || '';
    const author = options.metadata?.author || docMeta.author || 'GeoStudio Teacher';
    const tags = options.metadata?.tags || (isLesson ? options.lesson?.tags : docMeta.tags) || [];

    const metadata: GeoPackageMetadata = {
      id: options.metadata?.id || docMeta.id || `pkg-${Date.now()}`,
      title,
      description,
      author,
      grade,
      tags,
      createdAt: options.metadata?.createdAt || docMeta.createdAt || now,
      updatedAt: now
    };

    const pkg: GeoPackage = {
      format: 'geostudio',
      version: '1.0.0',
      type: isLesson ? 'lesson' : 'geometry',
      metadata,
      document: JSON.parse(JSON.stringify(options.document)),
      ...(isLesson && options.lesson ? { lesson: JSON.parse(JSON.stringify(options.lesson)) } : {}),
      ...(options.annotations && options.annotations.length > 0
        ? { annotations: JSON.parse(JSON.stringify(options.annotations)) }
        : {}),
      ...(options.coordinate
        ? { coordinate: JSON.parse(JSON.stringify(options.coordinate)) }
        : {})
    };

    return pkg;
  }

  /**
   * Chuyển GeoPackage thành chuỗi JSON (.geo file content)
   */
  public static serializeGeoPackage(pkg: GeoPackage, pretty = true): string {
    return pretty ? JSON.stringify(pkg, null, 2) : JSON.stringify(pkg);
  }

  /**
   * Phân tích và xác thực tệp .geo / .json với cơ chế tương thích ngược (backward compatibility)
   */
  public static parseGeoPackage(rawContent: string): ParsePackageResult {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      return {
        success: false,
        error: 'Tệp không phải định dạng JSON hợp lệ.'
      };
    }

    if (!parsedJson || typeof parsedJson !== 'object') {
      return {
        success: false,
        error: 'Dữ liệu tệp không đúng cấu trúc đối tượng GeoStudio.'
      };
    }

    const rawObj = parsedJson as Record<string, unknown>;

    // Case 1: Đúng định dạng chuẩn GeoPackage (format: 'geostudio')
    if (rawObj.format === 'geostudio') {
      const result = GeoPackageSchema.safeParse(rawObj);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: `Gói .geo không hợp lệ: ${result.error.issues.map((i) => i.message).join(', ')}`
      };
    }

    // Case 2: Tương thích Lesson JSON độc lập
    if (rawObj.document && Array.isArray(rawObj.steps)) {
      const now = new Date().toISOString();
      const adaptedPkg: GeoPackage = {
        format: 'geostudio',
        version: '1.0.0',
        type: 'lesson',
        metadata: {
          id: String(rawObj.id || `pkg-lesson-${Date.now()}`),
          title: String(rawObj.title || 'Bài giảng nhập từ tệp'),
          description: String(rawObj.description || ''),
          grade: typeof rawObj.grade === 'number' ? rawObj.grade : undefined,
          tags: Array.isArray(rawObj.tags) ? rawObj.tags : [],
          createdAt: String(rawObj.createdAt || now),
          updatedAt: String(rawObj.updatedAt || now)
        },
        document: rawObj.document as GeoDocument,
        lesson: rawObj as unknown as Lesson
      };

      const result = GeoPackageSchema.safeParse(adaptedPkg);
      if (result.success) {
        return { success: true, data: result.data };
      }
    }

    // Case 3: Tương thích GeoDocument JSON thuần túy
    if (Array.isArray(rawObj.objects) && rawObj.viewport && rawObj.metadata) {
      const now = new Date().toISOString();
      const docMeta = rawObj.metadata as Record<string, unknown>;
      const adaptedPkg: GeoPackage = {
        format: 'geostudio',
        version: '1.0.0',
        type: 'geometry',
        metadata: {
          id: String(docMeta.id || `pkg-doc-${Date.now()}`),
          title: String(docMeta.title || 'Hình vẽ nhập từ tệp'),
          description: String(docMeta.description || ''),
          grade: typeof docMeta.grade === 'number' ? docMeta.grade : undefined,
          tags: Array.isArray(docMeta.tags) ? docMeta.tags : [],
          createdAt: String(docMeta.createdAt || now),
          updatedAt: String(docMeta.updatedAt || now)
        },
        document: rawObj as unknown as GeoDocument
      };

      const result = GeoPackageSchema.safeParse(adaptedPkg);
      if (result.success) {
        return { success: true, data: result.data };
      }
    }

    return {
      success: false,
      error: 'Tệp không tương thích với định dạng GeoStudio (.geo hoặc .json).'
    };
  }

  /**
   * Ghép (merge) các đối tượng từ gói .geo vào tài liệu hiện tại, tự động remap ID tránh xung đột
   */
  public static mergeGeoPackageIntoDocument(
    currentDoc: GeoDocument,
    incomingDoc: GeoDocument,
    currentAnnotations: Annotation[] = [],
    incomingAnnotations: Annotation[] = []
  ): { document: GeoDocument; annotations: Annotation[] } {
    const existingObjIds = new Set(currentDoc.objects.map((o) => o.id));
    const idMap = new Map<string, string>();

    // Chuẩn bị remap ID nếu trùng
    for (const inObj of incomingDoc.objects) {
      if (existingObjIds.has(inObj.id)) {
        const newId = `${inObj.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        idMap.set(inObj.id, newId);
      }
    }

    // Clone & cập nhật references cho incoming objects
    const remappedIncomingObjects: GeometryObject[] = incomingDoc.objects.map((obj) => {
      const cloned = JSON.parse(JSON.stringify(obj)) as GeometryObject;
      const targetId = idMap.get(cloned.id) || cloned.id;
      cloned.id = targetId;

      // Remap parents
      if (cloned.parents) {
        cloned.parents = cloned.parents.map((pId: string) => idMap.get(pId) || pId);
      }

      // Remap object IDs trong definition
      if (cloned.definition) {
        for (const [key, val] of Object.entries(cloned.definition)) {
          if (typeof val === 'string' && idMap.has(val)) {
            cloned.definition[key] = idMap.get(val)!;
          } else if (Array.isArray(val)) {
            cloned.definition[key] = val.map((item) => (typeof item === 'string' && idMap.has(item) ? idMap.get(item)! : item));
          }
        }
      }

      return cloned;
    });

    // Remap constraints
    const remappedIncomingConstraints: GeometryConstraint[] = (incomingDoc.constraints || []).map((c) => {
      const cloned = JSON.parse(JSON.stringify(c)) as GeometryConstraint;
      const targetId = idMap.get(cloned.id) || cloned.id;
      cloned.id = targetId;
      cloned.objectIds = cloned.objectIds.map((oId: string) => idMap.get(oId) || oId);
      return cloned;
    });

    const mergedDoc: GeoDocument = {
      ...currentDoc,
      objects: [...currentDoc.objects, ...remappedIncomingObjects],
      constraints: [...(currentDoc.constraints || []), ...remappedIncomingConstraints],
      metadata: {
        ...currentDoc.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    // Remap annotations
    const existingAnnoIds = new Set(currentAnnotations.map((a) => a.id));
    const remappedAnnotations: Annotation[] = incomingAnnotations.map((anno) => {
      const cloned = JSON.parse(JSON.stringify(anno)) as Annotation;
      if (existingAnnoIds.has(cloned.id)) {
        cloned.id = `anno_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      }
      return cloned;
    });

    return {
      document: mergedDoc,
      annotations: [...currentAnnotations, ...remappedAnnotations]
    };
  }
}
