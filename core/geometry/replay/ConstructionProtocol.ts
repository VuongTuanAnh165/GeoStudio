import type { GeometryObject, Coords2D } from '../../types/geometry';
import type { ConstructionStepItem } from '../../types/replay';

export class ConstructionProtocol {
  /**
   * Generates a sequential list of construction steps from geometry objects.
   */
  static generateSteps(objects: GeometryObject[], lang: 'vi' | 'en' = 'vi'): ConstructionStepItem[] {
    const objectMap = new Map<string, GeometryObject>();
    for (const obj of objects) {
      objectMap.set(obj.id, obj);
    }

    const steps: ConstructionStepItem[] = [];

    objects.forEach((obj, idx) => {
      const stepIndex = idx + 1;
      const label = obj.metadata?.label || obj.id;
      const description = this.generateDescription(obj, objectMap, lang);
      const annotation = (obj.metadata?.annotation as string) || undefined;

      steps.push({
        index: stepIndex,
        id: obj.id,
        objectIds: [obj.id],
        label: `${this.formatTypeName(obj.type, lang)} ${label}`,
        type: obj.type,
        description,
        annotation
      });
    });

    return steps;
  }

  /**
   * Formats localized type name for UI labels.
   */
  static formatTypeName(type: string, lang: 'vi' | 'en'): string {
    const isVi = lang === 'vi';
    switch (type) {
      case 'point':
        return isVi ? 'Điểm' : 'Point';
      case 'segment':
        return isVi ? 'Đoạn thẳng' : 'Segment';
      case 'line':
        return isVi ? 'Đường thẳng' : 'Line';
      case 'ray':
        return isVi ? 'Tia' : 'Ray';
      case 'circle':
        return isVi ? 'Đường tròn' : 'Circle';
      case 'triangle':
        return isVi ? 'Tam giác' : 'Triangle';
      case 'polygon':
        return isVi ? 'Đa giác' : 'Polygon';
      case 'slider':
        return isVi ? 'Thanh trượt' : 'Slider';
      case 'locus':
        return isVi ? 'Quỹ tích' : 'Locus';
      default:
        return isVi ? 'Đối tượng' : 'Object';
    }
  }

  /**
   * Creates an informative, human-readable description for a step.
   */
  static generateDescription(obj: GeometryObject, objectMap: Map<string, GeometryObject>, lang: 'vi' | 'en'): string {
    const isVi = lang === 'vi';
    const label = obj.metadata?.label || obj.id;
    const parentLabels = (obj.parents || []).map(pid => {
      const parent = objectMap.get(pid);
      return parent?.metadata?.label || pid;
    });

    // Check for construction kind if stored in metadata or definition
    const def = obj.definition as Record<string, any>;
    const constructionKind = (obj.metadata?.constructionKind || def?.kind) as string | undefined;

    if (constructionKind && constructionKind !== obj.type) {
      switch (constructionKind) {
        case 'midpoint':
          return isVi
            ? `Dựng trung điểm ${label} của ${parentLabels.join(', ')}`
            : `Construct midpoint ${label} of ${parentLabels.join(', ')}`;
        case 'perpendicular':
          return isVi
            ? `Dựng đường vuông góc ${label} đi qua ${parentLabels[0] || 'điểm'} và vuông góc với ${parentLabels[1] || 'đường'}`
            : `Construct perpendicular line ${label} through ${parentLabels[0] || 'point'} and perpendicular to ${parentLabels[1] || 'line'}`;
        case 'parallel':
          return isVi
            ? `Dựng đường thẳng ${label} song song với ${parentLabels[1] || 'đường'} qua ${parentLabels[0] || 'điểm'}`
            : `Construct line ${label} parallel to ${parentLabels[1] || 'line'} through ${parentLabels[0] || 'point'}`;
        case 'perpendicular_bisector':
          return isVi
            ? `Dựng đường trung trực ${label} của ${parentLabels.join(', ')}`
            : `Construct perpendicular bisector ${label} of ${parentLabels.join(', ')}`;
        case 'angle_bisector':
          return isVi
            ? `Dựng đường phân giác ${label} tạo bởi ${parentLabels.join(', ')}`
            : `Construct angle bisector ${label} defined by ${parentLabels.join(', ')}`;
        case 'circumcircle':
          return isVi
            ? `Dựng đường tròn ngoại tiếp ${label} qua ba điểm ${parentLabels.join(', ')}`
            : `Construct circumcircle ${label} passing through ${parentLabels.join(', ')}`;
        case 'incircle':
          return isVi
            ? `Dựng đường tròn nội tiếp ${label} của ba điểm ${parentLabels.join(', ')}`
            : `Construct incircle ${label} of ${parentLabels.join(', ')}`;
        case 'tangent':
          return isVi
            ? `Dựng tiếp tuyến ${label} từ ${parentLabels[0] || 'điểm'} tới ${parentLabels[1] || 'đường tròn'}`
            : `Construct tangent line ${label} from ${parentLabels[0] || 'point'} to ${parentLabels[1] || 'circle'}`;
        case 'intersection':
          return isVi
            ? `Dựng giao điểm ${label} giữa ${parentLabels.join(' và ')}`
            : `Construct intersection point ${label} of ${parentLabels.join(' and ')}`;
      }
    }

    switch (obj.type) {
      case 'point': {
        const coords = def?.coords as Coords2D | undefined;
        if (coords) {
          const x = coords.x.toFixed(1);
          const y = coords.y.toFixed(1);
          return isVi
            ? `Tạo điểm ${label} tại toạ độ (${x}, ${y})`
            : `Create point ${label} at (${x}, ${y})`;
        }
        return isVi ? `Tạo điểm ${label}` : `Create point ${label}`;
      }

      case 'segment':
        return isVi
          ? `Vẽ đoạn thẳng ${label} nối ${parentLabels[0] || 'A'} và ${parentLabels[1] || 'B'}`
          : `Draw segment ${label} connecting ${parentLabels[0] || 'A'} and ${parentLabels[1] || 'B'}`;

      case 'line':
        return isVi
          ? `Vẽ đường thẳng ${label} đi qua ${parentLabels[0] || 'A'} và ${parentLabels[1] || 'B'}`
          : `Draw line ${label} passing through ${parentLabels[0] || 'A'} and ${parentLabels[1] || 'B'}`;

      case 'ray':
        return isVi
          ? `Vẽ tia ${label} từ gốc ${parentLabels[0] || 'A'} qua ${parentLabels[1] || 'B'}`
          : `Draw ray ${label} from origin ${parentLabels[0] || 'A'} through ${parentLabels[1] || 'B'}`;

      case 'circle': {
        const radius = def?.radius;
        if (parentLabels.length >= 2) {
          return isVi
            ? `Vẽ đường tròn ${label} tâm ${parentLabels[0]} đi qua ${parentLabels[1]}`
            : `Draw circle ${label} centered at ${parentLabels[0]} passing through ${parentLabels[1]}`;
        }
        if (typeof radius === 'number') {
          return isVi
            ? `Vẽ đường tròn ${label} tâm ${parentLabels[0] || 'gốc'} bán kính R = ${radius.toFixed(1)}`
            : `Draw circle ${label} centered at ${parentLabels[0] || 'origin'} with radius R = ${radius.toFixed(1)}`;
        }
        return isVi ? `Vẽ đường tròn ${label}` : `Draw circle ${label}`;
      }

      case 'triangle':
      case 'polygon': {
        const vertices = parentLabels.length > 0 ? parentLabels.join(', ') : 'các đỉnh';
        const isTri = obj.type === 'triangle';
        return isVi
          ? `Vẽ ${isTri ? 'tam giác' : 'đa giác'} ${label} qua ${vertices}`
          : `Draw ${isTri ? 'triangle' : 'polygon'} ${label} through ${vertices}`;
      }

      case 'slider': {
        const min = def?.min ?? 0;
        const max = def?.max ?? 10;
        const val = def?.value ?? min;
        return isVi
          ? `Tạo thanh trượt ${label} từ ${min} đến ${max} (giá trị hiện tại: ${val})`
          : `Create slider ${label} from ${min} to ${max} (current value: ${val})`;
      }

      case 'locus':
        return isVi
          ? `Vẽ đường quỹ tích ${label} theo dõi ${parentLabels[0] || 'điểm'} khi ${parentLabels[1] || 'điểm điều khiển'} di chuyển`
          : `Draw locus ${label} of ${parentLabels[0] || 'point'} driven by ${parentLabels[1] || 'driver'}`;

      default:
        return isVi ? `Tạo đối tượng ${label}` : `Create object ${label}`;
    }
  }

  /**
   * Computes the set of object IDs that should be visible up to the given step index (1-based).
   */
  static getVisibleObjectIds(steps: ConstructionStepItem[], currentStepIndex: number): Set<string> {
    const visibleIds = new Set<string>();
    if (currentStepIndex <= 0) {
      return visibleIds;
    }

    const maxIndex = Math.min(currentStepIndex, steps.length);
    for (let i = 0; i < maxIndex; i++) {
      const step = steps[i];
      if (step) {
        for (const objId of step.objectIds) {
          visibleIds.add(objId);
        }
      }
    }

    return visibleIds;
  }

  /**
   * Computes the object ID(s) highlighted at the current step.
   */
  static getActiveObjectIds(steps: ConstructionStepItem[], currentStepIndex: number): string[] {
    if (currentStepIndex <= 0 || currentStepIndex > steps.length) {
      return [];
    }
    const step = steps[currentStepIndex - 1];
    return step ? step.objectIds : [];
  }
}
