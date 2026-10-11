import { jsPDF } from 'jspdf';
import type { GeoDocument } from '../types/document';
import type { Lesson } from '../types/lesson';
import type { Annotation } from '../types/annotation';
import type { PdfExportOptions } from '../types/export';

export interface GeneratePdfContext {
  options?: PdfExportOptions;
  document: GeoDocument;
  lesson?: Lesson | null;
  annotations?: Annotation[];
  svgElement?: SVGElement | null;
  canvasImageDataUrl?: string | null;
}

export class PdfExporter {
  /**
   * Xuất tài liệu hình học và bài giảng ra định dạng PDF chất lượng cao (A4 / Letter)
   */
  public static async exportToPdf(context: GeneratePdfContext): Promise<Blob> {
    const opts = context.options || {};
    const orientation = opts.orientation || 'portrait';
    const pageSize = opts.pageSize || 'a4';

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Header styling
    const title = opts.title || context.lesson?.title || context.document.metadata.title || 'GeoStudio Geometry Document';
    const author = opts.author || context.document.metadata.author || 'GeoStudio Teacher';
    const grade = opts.grade ?? context.lesson?.grade ?? context.document.metadata.grade;
    const dateStr = new Date().toLocaleDateString('vi-VN');

    // Trang 1: Trang bìa & Hình vẽ hình học
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, margin, contentWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(this.sanitizeText(title), margin + 5, margin + 10);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const subtitle = `Tac gia: ${this.sanitizeText(author)}  |  Ngay: ${dateStr}${grade ? `  |  Lop ${grade}` : ''}`;
    doc.text(subtitle, margin + 5, margin + 17);

    // Khu vực vẽ hình (Graphic Box)
    let currentY = margin + 28;
    const graphicHeight = orientation === 'portrait' ? 120 : 100;

    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(margin, currentY, contentWidth, graphicHeight, 3, 3, 'FD');

    let imageRendered = false;

    // Ưu tiên 1: Vector SVG qua svg2pdf.js (chỉ khi có môi trường trình duyệt)
    if (context.svgElement && typeof window !== 'undefined') {
      try {
        (window as any).jsPDF = jsPDF;
        await import('svg2pdf.js');
        if (typeof (doc as any).svg === 'function') {
          const svgClone = context.svgElement.cloneNode(true) as SVGElement;
          if (!svgClone.getAttribute('xmlns')) {
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          }

          await (doc as any).svg(svgClone, {
            x: margin + 4,
            y: currentY + 4,
            width: contentWidth - 8,
            height: graphicHeight - 8
          });
          imageRendered = true;
        }
      } catch (err) {
        console.warn('SVG vector render failed, falling back to raster image:', err);
      }
    }

    // Ưu tiên 2 (Fallback): Chèn ảnh raster (PNG canvas snapshot)
    if (!imageRendered && context.canvasImageDataUrl) {
      try {
        doc.addImage(
          context.canvasImageDataUrl,
          'PNG',
          margin + 4,
          currentY + 4,
          contentWidth - 8,
          graphicHeight - 8,
          undefined,
          'FAST'
        );
        imageRendered = true;
      } catch (err) {
        console.warn('Canvas image embed failed:', err);
      }
    }

    if (!imageRendered) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.text('[Bieu do hinh hoc GeoStudio]', margin + contentWidth / 2 - 25, currentY + graphicHeight / 2);
    }

    // Bảng thống kê đối tượng hình học
    currentY += graphicHeight + 8;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Thong ke doi tuong hinh hoc:', margin, currentY);

    currentY += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const objects = context.document.objects;
    const pointCount = objects.filter((o) => o.type === 'point').length;
    const lineCount = objects.filter((o) => ['line', 'segment', 'ray'].includes(o.type)).length;
    const circleCount = objects.filter((o) => o.type === 'circle').length;
    const polyCount = objects.filter((o) => o.type === 'polygon').length;
    const otherCount = objects.length - pointCount - lineCount - circleCount - polyCount;

    const summaryText = `Tong so: ${objects.length} doi tuong  (Diem: ${pointCount}, Doan/Duong thang: ${lineCount}, Duong tron: ${circleCount}, Da giac: ${polyCount}${otherCount > 0 ? `, Khac: ${otherCount}` : ''})`;
    doc.text(summaryText, margin, currentY);

    // Ghi chú hoặc mô tả tài liệu
    const docDesc = context.document.metadata.description || context.lesson?.description;
    if (docDesc) {
      currentY += 6;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const splitDesc = doc.splitTextToSize(`Mo ta: ${this.sanitizeText(docDesc)}`, contentWidth);
      doc.text(splitDesc, margin, currentY);
    }

    // Trang 2: Chi tiết các bước bài học và Chú thích sư phạm
    const hasLessonSteps = Boolean(opts.includeLessonSteps !== false && context.lesson?.steps && context.lesson.steps.length > 0);
    const hasAnnotations = Boolean(opts.includeAnnotations !== false && context.annotations && context.annotations.length > 0);

    if (hasLessonSteps || hasAnnotations) {
      doc.addPage();
      let page2Y = margin;

      // Header trang 2
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(margin, page2Y, contentWidth, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('KE HOACH BAI GIANG & CAC BUOC DUNG HINH', margin + 5, page2Y + 9);

      page2Y += 20;

      // Danh sách các bước
      if (hasLessonSteps && context.lesson) {
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Cac buoc thuc hien (Tong cong: ${context.lesson.steps.length} buoc):`, margin, page2Y);
        page2Y += 6;

        for (const step of context.lesson.steps) {
          // Check trang nếu hết chỗ
          if (page2Y > pageHeight - 30) {
            doc.addPage();
            page2Y = margin;
          }

          doc.setFillColor(241, 245, 249);
          doc.roundedRect(margin, page2Y, contentWidth, 16, 2, 2, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(67, 56, 202);
          doc.text(`Buoc ${step.stepNumber}: ${this.sanitizeText(step.title || 'Dung hinh')}`, margin + 4, page2Y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const stepDesc = step.description ? this.sanitizeText(step.description) : `Cac doi tuong: ${step.objectIds.join(', ')}`;
          doc.text(stepDesc, margin + 4, page2Y + 11);

          if (step.formula) {
            doc.setTextColor(180, 83, 9);
            doc.text(`Cong thuc: ${step.formula}`, margin + contentWidth - 40, page2Y + 6);
          }

          page2Y += 19;
        }
      }

      // Chú thích sư phạm
      if (hasAnnotations && context.annotations && context.annotations.length > 0) {
        if (page2Y > pageHeight - 40) {
          doc.addPage();
          page2Y = margin;
        }

        page2Y += 4;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Ghi chu & Chu thich su pham:', margin, page2Y);
        page2Y += 6;

        for (const anno of context.annotations) {
          if (page2Y > pageHeight - 20) {
            doc.addPage();
            page2Y = margin;
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          const annoText = `• [${anno.type.toUpperCase()}] ${this.sanitizeText(anno.content)}`;
          doc.text(annoText, margin + 4, page2Y);
          page2Y += 5;
        }
      }
    }

    // Đánh số trang footer cho tất cả các trang
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`GeoStudio Platform  |  Trang ${i}/${totalPages}`, margin, pageHeight - 8);
    }

    return doc.output('blob');
  }

  /**
   * Chuyển ký tự tiếng Việt có dấu sang không dấu hoặc an toàn cho font chuẩn helvetica trong jsPDF
   */
  private static sanitizeText(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}
