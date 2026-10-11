/**
 * FunctionEvaluator
 * Compiles and safely evaluates mathematical expressions y = f(x).
 */

const SAFE_MATH_FUNCTIONS: Record<string, string> = {
  sin: 'Math.sin',
  cos: 'Math.cos',
  tan: 'Math.tan',
  asin: 'Math.asin',
  acos: 'Math.acos',
  atan: 'Math.atan',
  sinh: 'Math.sinh',
  cosh: 'Math.cosh',
  tanh: 'Math.tanh',
  sqrt: 'Math.sqrt',
  cbrt: 'Math.cbrt',
  abs: 'Math.abs',
  exp: 'Math.exp',
  ln: 'Math.log',
  log: 'Math.log10',
  round: 'Math.round',
  floor: 'Math.floor',
  ceil: 'Math.ceil'
};

const SAFE_CONSTANTS: Record<string, string> = {
  pi: 'Math.PI',
  PI: 'Math.PI',
  e: 'Math.E',
  E: 'Math.E'
};

/**
 * Preprocesses a raw math expression for evaluation:
 * - Handles implicit multiplication (2x -> 2*x, 3(x+1) -> 3*(x+1))
 * - Handles exponents (x^2 -> x**2)
 * - Replaces math functions and constants with safe Math calls
 */
export function sanitizeMathExpression(rawExpr: string): string {
  if (!rawExpr || typeof rawExpr !== 'string') {
    throw new Error('Expression must be a non-empty string');
  }

  let expr = rawExpr.trim();

  // Strip leading "y =" or "f(x) =" or "g(x) =" if present
  expr = expr.replace(/^(?:y|f\(x\)|g\(x\)|h\(x\))\s*=\s*/i, '');

  if (!expr) {
    throw new Error('Expression content is empty');
  }

  // Check for forbidden characters/words to prevent code injection
  const forbiddenPattern = /[;`"'{}\[\]\\|&!~?]|window|document|eval|Function|constructor|prototype|process|import/i;
  if (forbiddenPattern.test(expr)) {
    throw new Error('Expression contains invalid or unsafe characters');
  }

  // Convert caret ^ to **
  expr = expr.replace(/\^/g, '**');

  // Insert explicit multiplication for implicit multiplication patterns:
  // 1. Number before variable or paren: 2x -> 2*x, 2( -> 2*(
  expr = expr.replace(/(\d)\s*([a-zA-Z(])/g, '$1*$2');

  // 2. Closing paren before number, variable, or opening paren: )2 -> )*2, )x -> )*x, )( -> )*(
  expr = expr.replace(/(\))\s*(\d|[a-zA-Z(])/g, '$1*$2');

  // 3. Variable 'x' before paren or function: x( -> x*(
  expr = expr.replace(/([xX])\s*(\()/g, '$1*$2');

  // Replace recognized function names and constants with placeholders to avoid collision
  // Sort keys by length descending so longer names match first (e.g. sinh before sin)
  const fnKeys = Object.keys(SAFE_MATH_FUNCTIONS).sort((a, b) => b.length - a.length);
  for (const fn of fnKeys) {
    const regex = new RegExp(`\\b${fn}\\s*\\(`, 'gi');
    expr = expr.replace(regex, `__MATH_${fn.toUpperCase()}__(`);
  }

  expr = expr.replace(/\bpi\b/gi, '__MATH_PI__');
  expr = expr.replace(/\be\b/g, '__MATH_E__');

  // Now replace placeholders with actual Math calls
  for (const fn of fnKeys) {
    expr = expr.replace(new RegExp(`__MATH_${fn.toUpperCase()}__\\(`, 'g'), `${SAFE_MATH_FUNCTIONS[fn]}(`);
  }
  expr = expr.replace(/__MATH_PI__/g, 'Math.PI');
  expr = expr.replace(/__MATH_E__/g, 'Math.E');

  // Normalize standalone x or X
  expr = expr.replace(/\b[xX]\b/g, 'x');

  return expr;
}

/**
 * Compiles a mathematical expression string into an executable JavaScript function (x: number) => number.
 */
export function compileMathExpression(rawExpr: string): (x: number) => number {
  const sanitized = sanitizeMathExpression(rawExpr);

  // Validate parentheses balance
  let openCount = 0;
  for (const ch of sanitized) {
    if (ch === '(') openCount++;
    if (ch === ')') openCount--;
    if (openCount < 0) {
      throw new Error('Mismatched closing parenthesis');
    }
  }
  if (openCount !== 0) {
    throw new Error('Mismatched opening parenthesis');
  }

  try {
    // Construct safe function with single parameter x
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function('x', `"use strict"; try { return Number(${sanitized}); } catch { return NaN; }`) as (x: number) => number;

    // Test run with x = 1 to ensure it executes without syntax error
    const testVal = fn(1);
    if (typeof testVal !== 'number') {
      throw new Error('Expression did not evaluate to a numeric value');
    }

    return (x: number): number => {
      try {
        const res = fn(x);
        return isFinite(res) ? res : NaN;
      } catch {
        return NaN;
      }
    };
  } catch (err: any) {
    throw new Error(`Failed to parse expression "${rawExpr}": ${err?.message || 'Invalid syntax'}`);
  }
}

/**
 * Samples a function over a domain with a specified number of points.
 */
export function sampleFunction(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  samplesCount: number = 200
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const step = (xMax - xMin) / Math.max(samplesCount, 10);

  for (let x = xMin; x <= xMax; x += step) {
    const y = fn(x);
    if (!isNaN(y) && isFinite(y)) {
      points.push({ x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) });
    }
  }

  return points;
}
