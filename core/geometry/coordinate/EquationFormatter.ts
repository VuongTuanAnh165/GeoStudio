import type {
  LineEquationInfo,
  CircleEquationInfo,
  FunctionEquationInfo,
  GeometryEquationInfo
} from '../../types/coordinate';
import type { GeometryObject, Coords2D } from '../../types/geometry';

export class EquationFormatter {
  /**
   * Formats an equation from any supported GeometryObject (line, segment, ray, circle, function_graph).
   */
  public static format(obj: GeometryObject): GeometryEquationInfo | null {
    if (!obj || !obj.type) return null;

    switch (obj.type) {
      case 'line':
      case 'segment':
      case 'ray':
        return this.formatLine(obj);

      case 'circle':
        return this.formatCircle(obj);

      case 'function_graph':
        return this.formatFunction(obj);

      default:
        return null;
    }
  }

  /**
   * Formats a line equation from a line, segment, or ray object.
   */
  public static formatLine(obj: GeometryObject): LineEquationInfo | null {
    let p1: Coords2D | null = null;
    let p2: Coords2D | null = null;

    if (obj.type === 'segment') {
      p1 = obj.definition.p1 as Coords2D;
      p2 = obj.definition.p2 as Coords2D;
    } else if (obj.type === 'line' || obj.type === 'ray') {
      const pt = (obj.type === 'ray' ? obj.definition.origin : obj.definition.point) as Coords2D;
      const dir = obj.definition.direction as Coords2D;
      if (pt && dir) {
        p1 = pt;
        p2 = { x: pt.x + dir.x, y: pt.y + dir.y };
      }
    }

    if (!p1 || !p2) return null;

    return this.calculateLineFromPoints(p1, p2);
  }

  /**
   * Calculates LineEquationInfo from two points.
   */
  public static calculateLineFromPoints(p1: Coords2D, p2: Coords2D): LineEquationInfo {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Normal vector (A, B) = (-dy, dx)
    let a = -dy;
    let b = dx;
    let c = -(a * p1.x + b * p1.y);

    // Normalize so leading non-zero coefficient is positive
    if (a < 0 || (Math.abs(a) < 1e-9 && b < 0)) {
      a = -a;
      b = -b;
      c = -c;
    }

    // Scale down if numbers have common factors or are normalized floats
    const len = Math.hypot(a, b);
    if (len > 1e-9) {
      // Keep precision to 2 decimal places
      a = Number(a.toFixed(2));
      b = Number(b.toFixed(2));
      c = Number(c.toFixed(2));
    }

    // 1. Build general form string: Ax + By + C = 0
    const generalForm = this.buildGeneralLineString(a, b, c);
    const katexGeneral = generalForm;

    // 2. Build slope-intercept form: y = mx + b or x = c
    let slopeInterceptForm: string | undefined;
    let katexSlopeIntercept: string | undefined;
    let slope: number | undefined;
    let intercept: number | undefined;

    if (Math.abs(b) > 1e-9) {
      slope = Number((-a / b).toFixed(2));
      intercept = Number((-c / b).toFixed(2));

      let mStr = '';
      if (slope === 1) mStr = 'x';
      else if (slope === -1) mStr = '-x';
      else if (slope !== 0) mStr = `${slope}x`;

      let bStr = '';
      if (intercept > 0) bStr = mStr ? ` + ${intercept}` : `${intercept}`;
      else if (intercept < 0) bStr = mStr ? ` - ${Math.abs(intercept)}` : `-${Math.abs(intercept)}`;
      else if (!mStr) bStr = '0';

      slopeInterceptForm = `y = ${mStr}${bStr}`.trim();
      katexSlopeIntercept = slopeInterceptForm;
    } else {
      // Vertical line: x = -c / a
      const xVal = Number((-c / a).toFixed(2));
      slopeInterceptForm = `x = ${xVal}`;
      katexSlopeIntercept = `x = ${xVal}`;
    }

    return {
      type: 'line',
      generalForm,
      slopeInterceptForm,
      katexGeneral,
      katexSlopeIntercept,
      a,
      b,
      c,
      slope,
      intercept
    };
  }

  private static buildGeneralLineString(a: number, b: number, c: number): string {
    let res = '';

    // x term
    if (Math.abs(a) > 1e-9) {
      if (a === 1) res += 'x';
      else if (a === -1) res += '-x';
      else res += `${a}x`;
    }

    // y term
    if (Math.abs(b) > 1e-9) {
      if (!res) {
        if (b === 1) res += 'y';
        else if (b === -1) res += '-y';
        else res += `${b}y`;
      } else {
        if (b === 1) res += ' + y';
        else if (b === -1) res += ' - y';
        else if (b > 0) res += ` + ${b}y`;
        else res += ` - ${Math.abs(b)}y`;
      }
    }

    // constant term
    if (Math.abs(c) > 1e-9) {
      if (!res) {
        res += `${c}`;
      } else {
        if (c > 0) res += ` + ${c}`;
        else res += ` - ${Math.abs(c)}`;
      }
    }

    if (!res) res = '0';
    return `${res} = 0`;
  }

  /**
   * Formats a circle equation from a circle object.
   */
  public static formatCircle(obj: GeometryObject): CircleEquationInfo | null {
    const center = obj.definition.center as Coords2D;
    const radius = Number(obj.definition.radius);

    if (!center || isNaN(radius) || radius <= 0) return null;

    return this.calculateCircle(center, radius);
  }

  /**
   * Calculates CircleEquationInfo from center and radius.
   */
  public static calculateCircle(center: Coords2D, radius: number): CircleEquationInfo {
    const x0 = Number(center.x.toFixed(2));
    const y0 = Number(center.y.toFixed(2));
    const r = Number(radius.toFixed(2));
    const r2 = Number((r * r).toFixed(2));

    // 1. Standard Form: (x - x0)^2 + (y - y0)^2 = R^2
    const xPart = x0 === 0 ? 'x^2' : x0 > 0 ? `(x - ${x0})^2` : `(x + ${Math.abs(x0)})^2`;
    const yPart = y0 === 0 ? 'y^2' : y0 > 0 ? `(y - ${y0})^2` : `(y + ${Math.abs(y0)})^2`;
    const standardForm = `${xPart} + ${yPart} = ${r2}`;
    const katexStandard = `${xPart} + ${yPart} = ${r2}`;

    // 2. General Form: x^2 + y^2 - 2x0 x - 2y0 y + (x0^2 + y0^2 - R^2) = 0
    const dCoeff = Number((-2 * x0).toFixed(2));
    const eCoeff = Number((-2 * y0).toFixed(2));
    const fConst = Number((x0 * x0 + y0 * y0 - r2).toFixed(2));

    let genStr = 'x^2 + y^2';
    if (dCoeff !== 0) {
      genStr += dCoeff > 0 ? ` + ${dCoeff}x` : ` - ${Math.abs(dCoeff)}x`;
    }
    if (eCoeff !== 0) {
      genStr += eCoeff > 0 ? ` + ${eCoeff}y` : ` - ${Math.abs(eCoeff)}y`;
    }
    if (fConst !== 0) {
      genStr += fConst > 0 ? ` + ${fConst}` : ` - ${Math.abs(fConst)}`;
    }
    genStr += ' = 0';

    return {
      type: 'circle',
      standardForm,
      generalForm: genStr,
      katexStandard,
      katexGeneral: genStr,
      center: { x: x0, y: y0 },
      radius: r
    };
  }

  /**
   * Formats a function graph equation.
   */
  public static formatFunction(obj: GeometryObject): FunctionEquationInfo | null {
    const expr = (obj.definition.expression as string) || 'x';
    return {
      type: 'function',
      expression: expr,
      formula: `y = ${expr}`,
      katexFormula: `y = ${expr}`
    };
  }
}
