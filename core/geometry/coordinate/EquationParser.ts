import type {
  ParsedEquation,
  ParsedLineEquation,
  ParsedCircleEquation,
  ParsedFunctionEquation
} from '../../types/coordinate';
import type { Coords2D } from '../../types/geometry';
import { compileMathExpression } from './FunctionEvaluator';

export class EquationParser {
  /**
   * Main entry point: Parses any mathematical equation or expression string
   * into a typed representation (Line, Circle, or Function Plot).
   */
  public static parse(input: string): ParsedEquation {
    if (!input || typeof input !== 'string') {
      throw new Error('Phương trình không được để trống.');
    }

    const trimmed = input.trim();

    // 1. Try parsing as circle equation
    const circle = this.parseCircle(trimmed);
    if (circle) return circle;

    // 2. Try parsing as linear equation (line)
    const line = this.parseLine(trimmed);
    if (line) return line;

    // 3. Try parsing as function plot (y = f(x) or standalone f(x))
    const func = this.parseFunction(trimmed);
    if (func) return func;

    throw new Error(`Không thể nhận dạng phương trình: "${input}"`);
  }

  /**
   * Parse Circle equation in standard form (x - a)^2 + (y - b)^2 = R^2
   * or general form x^2 + y^2 + Dx + Ey + F = 0
   */
  public static parseCircle(input: string): ParsedCircleEquation | null {
    const s = input.replace(/\s+/g, '').toLowerCase();

    // Check standard form: (x ± a)^2 + (y ± b)^2 = R^2 or variations like x^2 + (y - 1)^2 = 9
    // Matches: (x-a)^2 + (y-b)^2 = R^2
    const stdRegex = /^(?:\(?x([+-]\d*(?:\.\d+)?)?\)?\^2|\(x([+-]\d*(?:\.\d+)?)\)\^2)\+(?:\(?y([+-]\d*(?:\.\d+)?)?\)?\^2|\(y([+-]\d*(?:\.\d+)?)\)\^2)=(\d+(?:\.\d+)?)$/;
    const mStd = s.match(stdRegex);

    if (mStd) {
      const xPart = mStd[1] || mStd[2] || '0';
      const yPart = mStd[3] || mStd[4] || '0';
      const rSqPart = mStd[5];

      const a = -Number(xPart); // (x - a) means if part is -2, a = 2; if +3, a = -3
      const b = -Number(yPart);
      const rSquared = Number(rSqPart);

      if (rSquared <= 0 || isNaN(rSquared)) {
        throw new Error('Bán kính đường tròn bình phương (R^2) phải lớn hơn 0.');
      }

      return {
        type: 'circle',
        raw: input,
        center: { x: Number(a.toFixed(4)), y: Number(b.toFixed(4)) },
        radius: Number(Math.sqrt(rSquared).toFixed(4)),
        radiusSquared: rSquared
      };
    }

    // Check general form: x^2 + y^2 + Dx + Ey + F = 0 or x^2 + y^2 + Dx + Ey = -F
    if (s.includes('x^2') && s.includes('y^2')) {
      const genResult = this.parseGeneralCircle(s, input);
      if (genResult) return genResult;
    }

    return null;
  }

  private static parseGeneralCircle(s: string, rawInput: string): ParsedCircleEquation | null {
    // Only accept if highest degree terms are x^2 and y^2 with no cross term xy
    if (s.includes('xy') || s.includes('x^3') || s.includes('y^3')) return null;

    // Form: Left = Right
    const parts = s.split('=');
    if (parts.length > 2) return null;

    const left = parts[0]!;
    const right = parts.length === 2 ? parts[1]! : '0';

    // Move everything to left side: left - (right) = 0
    const fullExpr = right === '0' ? left : `${left}-(${right})`;

    // Extract coefficients for x^2, y^2, x, y, and constant
    // Match terms with signs
    const termRegex = /([+-]?[^+-]+)/g;
    const terms = fullExpr.replace(/\s+/g, '').match(termRegex);
    if (!terms) return null;

    let coeffX2 = 0;
    let coeffY2 = 0;
    let coeffX = 0;
    let coeffY = 0;
    let constant = 0;

    for (const rawTerm of terms) {
      let term = rawTerm;
      let sign = 1;
      if (term.startsWith('+')) {
        term = term.slice(1);
      } else if (term.startsWith('-')) {
        sign = -1;
        term = term.slice(1);
      }

      if (term === 'x^2') {
        coeffX2 += sign * 1;
      } else if (term.endsWith('x^2')) {
        coeffX2 += sign * Number(term.replace('x^2', '') || '1');
      } else if (term === 'y^2') {
        coeffY2 += sign * 1;
      } else if (term.endsWith('y^2')) {
        coeffY2 += sign * Number(term.replace('y^2', '') || '1');
      } else if (term === 'x') {
        coeffX += sign * 1;
      } else if (term.endsWith('x') && !term.includes('^')) {
        coeffX += sign * Number(term.replace('x', '') || '1');
      } else if (term === 'y') {
        coeffY += sign * 1;
      } else if (term.endsWith('y') && !term.includes('^')) {
        coeffY += sign * Number(term.replace('y', '') || '1');
      } else {
        const num = Number(term);
        if (!isNaN(num)) {
          constant += sign * num;
        }
      }
    }

    // In a circle equation, coeffX2 must equal coeffY2 and be > 0
    if (Math.abs(coeffX2 - coeffY2) > 1e-9 || coeffX2 <= 0) {
      return null;
    }

    // Normalize so coeffX2 = 1, coeffY2 = 1
    const D = coeffX / coeffX2;
    const E = coeffY / coeffX2;
    const F = constant / coeffX2;

    const a = -D / 2;
    const b = -E / 2;
    const rSquared = a * a + b * b - F;

    if (rSquared <= 0) {
      throw new Error('Phương trình không tạo thành đường tròn thực (R^2 <= 0).');
    }

    return {
      type: 'circle',
      raw: rawInput,
      center: { x: Number(a.toFixed(4)), y: Number(b.toFixed(4)) },
      radius: Number(Math.sqrt(rSquared).toFixed(4)),
      radiusSquared: Number(rSquared.toFixed(4))
    };
  }

  /**
   * Parse linear equation (line):
   * - y = mx + b
   * - x = c
   * - Ax + By + C = 0 or Ax + By = C
   */
  public static parseLine(input: string): ParsedLineEquation | null {
    const s = input.replace(/\s+/g, '').toLowerCase();

    // Reject if contains non-linear terms or trigonometric/powers
    if (s.includes('^') || s.includes('sin') || s.includes('cos') || s.includes('sqrt') || s.includes('/') && s.includes('/x')) {
      return null;
    }

    // Must have exactly one '='
    if (!s.includes('=')) {
      return null;
    }

    const [left, right] = s.split('=') as [string, string];
    if (!left || !right) return null;

    // Case 1: Vertical line x = c
    if (left === 'x' && !isNaN(Number(right))) {
      const cVal = Number(right);
      return this.buildLineEquation(1, 0, -cVal, input);
    }
    if (right === 'x' && !isNaN(Number(left))) {
      const cVal = Number(left);
      return this.buildLineEquation(1, 0, -cVal, input);
    }

    // Case 2: Horizontal line y = k
    if (left === 'y' && !isNaN(Number(right))) {
      const kVal = Number(right);
      return this.buildLineEquation(0, 1, -kVal, input);
    }

    // Case 3: Slope-intercept form y = mx + b or y = mx
    if (left === 'y') {
      const slopeMatch = right.match(/^([+-]?\d*(?:\.\d+)?)?x([+-]\d+(?:\.\d+)?)?$/);
      if (slopeMatch) {
        let mStr = slopeMatch[1];
        let m = 1;
        if (mStr === '-' || mStr === '-1') m = -1;
        else if (mStr === '+' || mStr === '' || mStr === undefined) m = 1;
        else m = Number(mStr);

        const b = slopeMatch[2] ? Number(slopeMatch[2]) : 0;
        // y = mx + b => mx - y + b = 0 => a = m, b = -1, c = b
        return this.buildLineEquation(m, -1, b, input);
      }
    }

    // Case 4: General form Ax + By + C = 0 or Ax + By = C
    // Move all terms to left side: left - (right) = 0
    let a = 0;
    let b = 0;
    let c = 0;
    let hasInvalidTerm = false;

    const parseSide = (expr: string, multiplier: number) => {
      const terms = expr.match(/[+-]?[^+-]+/g);
      if (!terms) {
        hasInvalidTerm = true;
        return;
      }
      for (const raw of terms) {
        let t = raw;
        let sign = multiplier;
        if (t.startsWith('+')) {
          t = t.slice(1);
        } else if (t.startsWith('-')) {
          sign = -multiplier;
          t = t.slice(1);
        }

        if (t === 'x') {
          a += sign * 1;
        } else if (t.endsWith('x')) {
          const numStr = t.slice(0, -1);
          const num = numStr === '' ? 1 : Number(numStr);
          if (isNaN(num)) {
            hasInvalidTerm = true;
            return;
          }
          a += sign * num;
        } else if (t === 'y') {
          b += sign * 1;
        } else if (t.endsWith('y')) {
          const numStr = t.slice(0, -1);
          const num = numStr === '' ? 1 : Number(numStr);
          if (isNaN(num)) {
            hasInvalidTerm = true;
            return;
          }
          b += sign * num;
        } else {
          const num = Number(t);
          if (isNaN(num)) {
            hasInvalidTerm = true;
            return;
          }
          c += sign * num;
        }
      }
    };

    parseSide(left, 1);
    parseSide(right, -1);

    if (hasInvalidTerm || isNaN(a) || isNaN(b) || isNaN(c) || !isFinite(a) || !isFinite(b) || !isFinite(c)) {
      return null;
    }

    // If both A and B are 0, this is not a valid line equation (e.g. 5 = 5 or 0 = 0)
    if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9) {
      return null;
    }

    return this.buildLineEquation(a, b, c, input);
  }

  private static buildLineEquation(a: number, b: number, c: number, rawInput: string): ParsedLineEquation {
    // Normalize sign so leading coefficient is positive
    let normA = a;
    let normB = b;
    let normC = c;

    if (normA < 0 || (Math.abs(normA) < 1e-9 && normB < 0)) {
      normA = -normA;
      normB = -normB;
      normC = -normC;
    }

    // Calculate two points on the line
    let p1: Coords2D;
    let p2: Coords2D;
    let slope: number | undefined;
    let yIntercept: number | undefined;

    if (Math.abs(normB) > 1e-9) {
      // Not vertical: y = (-normA * x - normC) / normB
      slope = Number((-normA / normB).toFixed(4));
      yIntercept = Number((-normC / normB).toFixed(4));

      p1 = { x: 0, y: yIntercept };
      p2 = { x: 2, y: Number(((-normA * 2 - normC) / normB).toFixed(4)) };
    } else {
      // Vertical line: x = -normC / normA
      const xVal = Number((-normC / normA).toFixed(4));
      p1 = { x: xVal, y: 0 };
      p2 = { x: xVal, y: 4 };
    }

    return {
      type: 'line',
      raw: rawInput,
      a: Number(normA.toFixed(4)),
      b: Number(normB.toFixed(4)),
      c: Number(normC.toFixed(4)),
      point1: p1,
      point2: p2,
      slope,
      yIntercept
    };
  }

  /**
   * Parse Function plot y = f(x) or f(x) = ... or standalone formula
   */
  public static parseFunction(input: string): ParsedFunctionEquation | null {
    let expr = input.trim();

    // Strip leading y = or f(x) = if present
    expr = expr.replace(/^(?:y|f\(x\)|g\(x\)|h\(x\))\s*=\s*/i, '');

    if (!expr) return null;

    // Validate that the expression is compilable
    try {
      compileMathExpression(expr);
    } catch {
      return null;
    }

    return {
      type: 'function',
      raw: input,
      expression: expr,
      variable: 'x'
    };
  }
}
