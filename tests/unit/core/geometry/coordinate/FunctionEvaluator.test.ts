import { describe, it, expect } from 'vitest';
import { compileMathExpression, sanitizeMathExpression, sampleFunction } from '../../../../../core/geometry/coordinate/FunctionEvaluator';

describe('FunctionEvaluator', () => {
  describe('Sanitization & Parsing', () => {
    it('handles basic polynomials', () => {
      const fn = compileMathExpression('x^2 - 4');
      expect(fn(0)).toBe(-4);
      expect(fn(2)).toBe(0);
      expect(fn(-2)).toBe(0);
      expect(fn(3)).toBe(5);
    });

    it('handles implicit multiplication (2x, 3(x+1))', () => {
      const fn1 = compileMathExpression('2x + 1');
      expect(fn1(3)).toBe(7);

      const fn2 = compileMathExpression('3(x - 2)');
      expect(fn2(5)).toBe(9);

      const fn3 = compileMathExpression('(x + 1)(x - 1)');
      expect(fn3(3)).toBe(8); // (3+1)*(3-1) = 8
    });

    it('strips leading y = or f(x) = correctly', () => {
      const fn1 = compileMathExpression('y = 3x - 5');
      expect(fn1(2)).toBe(1);

      const fn2 = compileMathExpression('f(x) = x^3');
      expect(fn2(2)).toBe(8);
    });

    it('handles trigonometric functions and constants', () => {
      const fnSin = compileMathExpression('sin(x)');
      expect(fnSin(0)).toBe(0);
      expect(fnSin(Math.PI / 2)).toBeCloseTo(1, 5);

      const fnCos = compileMathExpression('cos(pi)');
      expect(fnCos(0)).toBeCloseTo(-1, 5);
    });

    it('handles square roots, absolute values and logarithms', () => {
      const fnSqrt = compileMathExpression('sqrt(x)');
      expect(fnSqrt(9)).toBe(3);
      expect(fnSqrt(16)).toBe(4);
      expect(isNaN(fnSqrt(-1))).toBe(true);

      const fnAbs = compileMathExpression('abs(x - 5)');
      expect(fnAbs(2)).toBe(3);
      expect(fnAbs(8)).toBe(3);

      const fnLn = compileMathExpression('ln(x)');
      expect(fnLn(Math.E)).toBeCloseTo(1, 5);
    });

    it('returns NaN for undefined values or division by zero', () => {
      const fn = compileMathExpression('1/x');
      expect(fn(2)).toBe(0.5);
      expect(isNaN(fn(0))).toBe(true);
    });

    it('rejects unsafe inputs', () => {
      expect(() => sanitizeMathExpression('window.alert(1)')).toThrow();
      expect(() => sanitizeMathExpression('eval("2+2")')).toThrow();
      expect(() => sanitizeMathExpression('x; console.log(1)')).toThrow();
    });

    it('rejects mismatched parentheses', () => {
      expect(() => compileMathExpression('(x + 1')).toThrow();
      expect(() => compileMathExpression('x + 1)')).toThrow();
    });
  });

  describe('sampleFunction', () => {
    it('samples points across domain', () => {
      const fn = compileMathExpression('x^2');
      const samples = sampleFunction(fn, -2, 2, 4);
      expect(samples.length).toBeGreaterThan(0);
      expect(samples[0]?.x).toBe(-2);
      expect(samples[0]?.y).toBe(4);
    });
  });
});
