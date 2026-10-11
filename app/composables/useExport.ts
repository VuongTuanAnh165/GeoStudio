import html2canvas from 'html2canvas';
import { useGeometryStore } from '../stores/geometry';
import { useLessonStore } from '../stores/lesson';
import { useAnnotationStore } from '../stores/annotation';
import { useCoordinateStore } from '../stores/coordinate';
import { GeoPackageService } from '../../core/export/GeoPackageService';
import { ShareLinkService } from '../../core/export/ShareLinkService';
import { PdfExporter } from '../../core/export/PdfExporter';
import type { GeoPackage, GeoPackageMetadata, PdfExportOptions, ShareableState } from '../../core/types/export';

export function useExport() {
  const geometryStore = useGeometryStore();
  const lessonStore = useLessonStore();
  const annotationStore = useAnnotationStore();
  const coordinateStore = useCoordinateStore();

  const downloadFile = (filename: string, content: string | Blob, contentType: string = 'text/plain') => {
    if (typeof document === 'undefined') return;

    const a = document.createElement('a');
    let url: string;
    if (content instanceof Blob) {
      url = URL.createObjectURL(content);
    } else {
      const blob = new Blob([content], { type: contentType });
      url = URL.createObjectURL(blob);
    }

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Xuất JSON thuần túy của GeoDocument
   */
  const exportJSON = () => {
    const title = geometryStore.currentDocument.metadata.title || 'document';
    const jsonStr = JSON.stringify(geometryStore.currentDocument, null, 2);
    downloadFile(`${title.replace(/\s+/g, '_')}.json`, jsonStr, 'application/json');
  };

  /**
   * Xuất ảnh PNG độ nét cao
   */
  const exportPNG = async (canvasSelector: string = '#jxgbox'): Promise<void> => {
    const title = geometryStore.currentDocument.metadata.title || 'document';
    const element = document.querySelector(canvasSelector) as HTMLElement;

    if (!element) {
      console.error('Canvas element not found for export');
      return;
    }

    try {
      const isDark = document.documentElement.classList.contains('dark');
      const canvas = await html2canvas(element, {
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        scale: 2
      });

      return new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            downloadFile(`${title.replace(/\s+/g, '_')}.png`, blob, 'image/png');
          }
          resolve();
        });
      });
    } catch (e) {
      console.error('Failed to export PNG:', e);
    }
  };

  /**
   * Xuất ảnh vector SVG
   */
  const exportSVG = () => {
    const title = geometryStore.currentDocument.metadata.title || 'document';
    const renderer = (window as any).__geostudio_renderer;

    let svgElement: SVGSVGElement | null = null;
    if (renderer?.board?.renderer?.svgRoot) {
      svgElement = renderer.board.renderer.svgRoot.cloneNode(true) as SVGSVGElement;
    } else {
      svgElement = document.querySelector('#jxgbox svg') as SVGSVGElement | null;
      if (svgElement) {
        svgElement = svgElement.cloneNode(true) as SVGSVGElement;
      }
    }

    if (svgElement) {
      if (!svgElement.getAttribute('xmlns')) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      const svgStr = svgElement.outerHTML;
      downloadFile(`${title.replace(/\s+/g, '_')}.svg`, svgStr, 'image/svg+xml');
    } else {
      console.error('No SVG element found for export');
    }
  };

  /**
   * Xuất tài liệu / giáo án PDF (A4/Letter via jsPDF + SVG vector & canvas fallback)
   */
  const exportPDF = async (options?: PdfExportOptions): Promise<void> => {
    const title = geometryStore.currentDocument.metadata.title || 'document';
    const renderer = (window as any).__geostudio_renderer;

    let svgElement: SVGElement | null = null;
    if (renderer?.board?.renderer?.svgRoot) {
      svgElement = renderer.board.renderer.svgRoot;
    } else {
      svgElement = document.querySelector('#jxgbox svg');
    }

    // Chụp canvas raster làm fallback an toàn
    let canvasDataUrl: string | null = null;
    const canvasElem = document.querySelector('#jxgbox') as HTMLElement | null;
    if (canvasElem) {
      try {
        const isDark = document.documentElement.classList.contains('dark');
        const canvas = await html2canvas(canvasElem, {
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          scale: 1.5
        });
        canvasDataUrl = canvas.toDataURL('image/png');
      } catch (err) {
        console.warn('Canvas snapshot failed for PDF:', err);
      }
    }

    const pdfBlob = await PdfExporter.exportToPdf({
      options,
      document: geometryStore.currentDocument,
      lesson: lessonStore.currentLesson,
      annotations: annotationStore.annotations,
      svgElement,
      canvasImageDataUrl: canvasDataUrl
    });

    downloadFile(`${title.replace(/\s+/g, '_')}.pdf`, pdfBlob, 'application/pdf');
  };

  /**
   * Xuất gói bài giảng / hình học .geo (JSON bundle đầy đủ)
   */
  const exportGeoPackage = (customMetadata?: Partial<GeoPackageMetadata>) => {
    const pkg = GeoPackageService.createGeoPackage({
      document: geometryStore.currentDocument,
      lesson: lessonStore.currentLesson,
      annotations: annotationStore.annotations,
      coordinate: {
        grid: coordinateStore.gridConfig,
        axis: coordinateStore.axisConfig
      },
      metadata: customMetadata
    });

    const filename = `${pkg.metadata.title.replace(/\s+/g, '_')}.geo`;
    const content = GeoPackageService.serializeGeoPackage(pkg, true);
    downloadFile(filename, content, 'application/json');
  };

  /**
   * Nhập tệp .geo hoặc .json với lựa chọn thay thế (replace) hoặc ghép nối (merge)
   */
  const importGeoFile = async (
    file: File,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<{ success: boolean; data?: GeoPackage; error?: string }> => {
    try {
      const text = await file.text();
      const parseResult = GeoPackageService.parseGeoPackage(text);

      if (!parseResult.success || !parseResult.data) {
        return { success: false, error: parseResult.error || 'Định dạng tệp không hợp lệ' };
      }

      const pkg = parseResult.data;

      if (mode === 'replace') {
        // Thay thế bảng vẽ hiện tại
        geometryStore.loadDocument(pkg.document);

        // Nạp bài giảng nếu có
        if (pkg.lesson) {
          lessonStore.currentLesson = pkg.lesson;
        } else {
          lessonStore.currentLesson = null;
        }

        // Nạp chú thích nếu có
        if (pkg.annotations) {
          annotationStore.annotations = pkg.annotations;
        }

        // Nạp cấu hình tọa độ nếu có
        if (pkg.coordinate) {
          if (pkg.coordinate.grid) coordinateStore.setGridConfig(pkg.coordinate.grid);
          if (pkg.coordinate.axis) coordinateStore.setAxisConfig(pkg.coordinate.axis);
        }
      } else {
        // Ghép (merge) vào bảng vẽ hiện tại
        const mergeResult = GeoPackageService.mergeGeoPackageIntoDocument(
          geometryStore.currentDocument,
          pkg.document,
          annotationStore.annotations,
          pkg.annotations || []
        );

        geometryStore.loadDocument(mergeResult.document);
        annotationStore.annotations = mergeResult.annotations;
      }

      return { success: true, data: pkg };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Không thể đọc tệp' };
    }
  };

  /**
   * Tạo đối tượng ShareableState hiện tại
   */
  const getCurrentShareState = (): ShareableState => {
    return {
      format: 'geostudio',
      version: '1.0.0',
      type: lessonStore.currentLesson ? 'lesson' : 'geometry',
      title: lessonStore.currentLesson?.title || geometryStore.currentDocument.metadata.title || 'Chia sẻ hình học',
      grade: lessonStore.currentLesson?.grade || geometryStore.currentDocument.metadata.grade,
      document: JSON.parse(JSON.stringify(geometryStore.currentDocument)),
      ...(lessonStore.currentLesson ? { lesson: JSON.parse(JSON.stringify(lessonStore.currentLesson)) } : {}),
      ...(annotationStore.annotations.length > 0 ? { annotations: JSON.parse(JSON.stringify(annotationStore.annotations)) } : {}),
      coordinate: {
        grid: coordinateStore.gridConfig,
        axis: coordinateStore.axisConfig
      }
    };
  };

  /**
   * Tạo link chia sẻ nén URL-safe
   */
  const generateShareUrl = (baseUrl?: string): string => {
    const state = getCurrentShareState();
    return ShareLinkService.generateShareUrl(state, baseUrl);
  };

  /**
   * Sao chép liên kết chia sẻ vào clipboard
   */
  const copyShareLink = async (baseUrl?: string): Promise<{ success: boolean; url: string; error?: string }> => {
    const url = generateShareUrl(baseUrl);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        return { success: true, url };
      }
      return { success: false, url, error: 'Clipboard API không khả dụng' };
    } catch (err: any) {
      return { success: false, url, error: err?.message || 'Sao chép thất bại' };
    }
  };

  /**
   * Tải và giải mã state từ link chia sẻ
   */
  const loadShareState = (tokenOrUrl: string): boolean => {
    const state = ShareLinkService.extractShareStateFromUrl(tokenOrUrl) || ShareLinkService.decodeShareState(tokenOrUrl);
    if (!state) return false;

    geometryStore.loadDocument(state.document);
    if (state.lesson) {
      lessonStore.currentLesson = state.lesson;
    }
    if (state.annotations) {
      annotationStore.annotations = state.annotations;
    }
    if (state.coordinate) {
      if (state.coordinate.grid) coordinateStore.setGridConfig(state.coordinate.grid);
      if (state.coordinate.axis) coordinateStore.setAxisConfig(state.coordinate.axis);
    }
    return true;
  };

  const printDocument = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return {
    exportJSON,
    exportPNG,
    exportSVG,
    exportPDF,
    exportGeoPackage,
    importGeoFile,
    generateShareUrl,
    copyShareLink,
    loadShareState,
    getCurrentShareState,
    printDocument
  };
}
