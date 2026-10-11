import type { GradeCurriculum, CurriculumConcept } from '../types/curriculum';
import {
  ALL_GRADE_CURRICULA,
  CURRICULUM_BY_GRADE,
  ALL_CONCEPTS,
  CONCEPTS_BY_ID
} from '../../content/curriculum';

export class CurriculumEngine {
  private curricula: Map<number, GradeCurriculum> = CURRICULUM_BY_GRADE;
  private concepts: Map<string, CurriculumConcept> = CONCEPTS_BY_ID;

  /**
   * Lấy chương trình giáo trình cho một khối lớp cụ thể (1-12)
   */
  public getCurriculum(grade: number): GradeCurriculum | undefined {
    return this.curricula.get(grade);
  }

  /**
   * Lấy toàn bộ chương trình giáo trình của 12 khối lớp
   */
  public getAllCurricula(): GradeCurriculum[] {
    return ALL_GRADE_CURRICULA;
  }

  /**
   * Lấy danh sách các khái niệm / bài học theo khối lớp
   */
  public getConceptsByGrade(grade: number): CurriculumConcept[] {
    const cur = this.curricula.get(grade);
    return cur ? cur.concepts : [];
  }

  /**
   * Lấy toàn bộ danh sách khái niệm từ lớp 1 đến lớp 12
   */
  public getAllConcepts(): CurriculumConcept[] {
    return ALL_CONCEPTS;
  }

  /**
   * Lấy chi tiết một khái niệm theo ID
   */
  public getConcept(conceptId: string): CurriculumConcept | undefined {
    return this.concepts.get(conceptId);
  }

  private normalizeSearch(text: string): string {
    return text
      .toLowerCase()
      .replace(/oà/g, 'òa')
      .replace(/oá/g, 'óa')
      .replace(/oả/g, 'ỏa')
      .replace(/oã/g, 'õa')
      .replace(/oạ/g, 'ọa')
      .replace(/uè/g, 'ùe')
      .replace(/ué/g, 'úe')
      .replace(/uẻ/g, 'ủe')
      .replace(/uẽ/g, 'ũe')
      .replace(/uẹ/g, 'ụe')
      .replace(/uỷ/g, 'ủy')
      .replace(/uý/g, 'úy')
      .replace(/uỳ/g, 'ùy');
  }

  private stripAccents(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }

  /**
   * Tìm kiếm các khái niệm hình học theo từ khoá (tên, mô tả, từ khoá, danh mục)
   * Hỗ trợ cả gõ có dấu theo 2 kiểu và gõ không dấu.
   */
  public searchConcepts(query: string, grade?: number | null): CurriculumConcept[] {
    const trimmed = query.trim().toLowerCase();
    const source = grade ? this.getConceptsByGrade(grade) : ALL_CONCEPTS;

    if (!trimmed) {
      return source;
    }

    const normQuery = this.normalizeSearch(trimmed);
    const strippedQuery = this.stripAccents(trimmed);

    return source.filter(c => {
      const match = (text: string) => {
        const norm = this.normalizeSearch(text);
        const stripped = this.stripAccents(text);
        return norm.includes(normQuery) || stripped.includes(strippedQuery);
      };

      const matchName = match(c.name);
      const matchDesc = match(c.description);
      const matchCategory = match(c.category);
      const matchKeywords = c.keywords ? c.keywords.some(k => match(k)) : false;
      return matchName || matchDesc || matchCategory || matchKeywords;
    });
  }

  /**
   * Chuẩn hoá mã công cụ để kiểm tra quyền sử dụng theo chương trình
   */
  public normalizeToolId(toolId: string): string {
    if (toolId.startsWith('construct_measure_')) {
      return toolId.replace('construct_', '');
    }
    if (toolId.startsWith('construct_') || toolId.startsWith('transform_')) {
      return toolId.replace('construct_', '').replace('transform_', '');
    }
    if (toolId === '3d') {
      return 'view_3d';
    }
    return toolId;
  }

  /**
   * Lấy tập hợp các công cụ được phép cho khối lớp
   * Trả về null nếu grade là null/all (toàn bộ công cụ được phép)
   */
  public getAllowedToolsForGrade(grade: number | null): Set<string> | null {
    if (grade === null || !this.curricula.has(grade)) {
      return null;
    }
    const cur = this.curricula.get(grade)!;
    return new Set(cur.allowedTools);
  }

  /**
   * Kiểm tra xem một công cụ có được phép hiển thị/dùng trong khối lớp hay không
   */
  public isToolAllowed(toolId: string, grade: number | null): boolean {
    if (grade === null) {
      return true; // Tất cả công cụ được phép
    }

    const cur = this.curricula.get(grade);
    if (!cur) {
      return true;
    }

    const normalized = this.normalizeToolId(toolId);

    // Công cụ cơ bản luôn được phép
    if (normalized === 'select' || normalized === 'delete') {
      return true;
    }

    return cur.allowedTools.includes(normalized) || cur.allowedTools.includes(toolId);
  }
}

export const defaultCurriculumEngine = new CurriculumEngine();
