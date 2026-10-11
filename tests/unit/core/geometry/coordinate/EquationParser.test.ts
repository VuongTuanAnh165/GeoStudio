import { describe, it, expect } from 'vitest';
import { EquationParser } from '../../../../../core/geometry/coordinate/EquationParser';

describe('EquationParser', () => {
  describe('Line parsing', () => {
    it('parses slope-intercept form y = mx + b', () => {
      const parsed = EquationParser.parseLine('y = 2x + 1');
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('line');
      expect(parsed?.a).toBe(2);
      expect(parsed?.b).toBe(-1);
      expect(parsed?.c).toBe(1);
      expect(parsed?.slope).toBe(2);
      expect(parsed?.yIntercept).toBe(1);
    });

    it('parses horizontal line y = k', () => {
      const parsed = EquationParser.parseLine('y = -3');
      expect(parsed).not.toBeNull();
      expect(parsed?.a).toBe(0);
      expect(parsed?.b).toBe(1);
      expect(parsed?.c).toBe(3); // 1y + 3 = 0 => y = -3
      expect(parsed?.yIntercept).toBe(-3);
    });

    it('parses vertical line x = c', () => {
      const parsed = EquationParser.parseLine('x = 4');
      expect(parsed).not.toBeNull();
      expect(parsed?.a).toBe(1);
      expect(parsed?.b).toBe(0);
      expect(parsed?.c).toBe(-4);
      expect(parsed?.slope).toBeUndefined();
      expect(parsed?.point1.x).toBe(4);
    });

    it('parses general form Ax + By + C = 0 and Ax + By = C', () => {
      const parsed1 = EquationParser.parseLine('2x - 3y + 6 = 0');
      expect(parsed1).not.toBeNull();
      expect(parsed1?.a).toBe(2);
      expect(parsed1?.b).toBe(-3);
      expect(parsed1?.c).toBe(6);

      const parsed2 = EquationParser.parseLine('3x + 4y = 12');
      expect(parsed2).not.toBeNull();
      expect(parsed2?.a).toBe(3);
      expect(parsed2?.b).toBe(4);
      expect(parsed2?.c).toBe(-12);
    });
  });

  describe('Circle parsing', () => {
    it('parses standard form (x - a)^2 + (y - b)^2 = R^2', () => {
      const parsed = EquationParser.parseCircle('(x - 2)^2 + (y + 1)^2 = 9');
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('circle');
      expect(parsed?.center).toEqual({ x: 2, y: -1 });
      expect(parsed?.radius).toBe(3);
      expect(parsed?.radiusSquared).toBe(9);
    });

    it('parses circle at origin x^2 + y^2 = 25', () => {
      const parsed = EquationParser.parseCircle('x^2 + y^2 = 25');
      expect(parsed).not.toBeNull();
      expect(parsed?.center).toEqual({ x: 0, y: 0 });
      expect(parsed?.radius).toBe(5);
    });

    it('parses general circle form x^2 + y^2 + Dx + Ey + F = 0', () => {
      // (x - 2)^2 + (y + 3)^2 = 25 => x^2 - 4x + 4 + y^2 + 6y + 9 - 25 = 0 => x^2 + y^2 - 4x + 6y - 12 = 0
      const parsed = EquationParser.parseCircle('x^2 + y^2 - 4x + 6y - 12 = 0');
      expect(parsed).not.toBeNull();
      expect(parsed?.center.x).toBe(2);
      expect(parsed?.center.y).toBe(-3);
      expect(parsed?.radius).toBe(5);
    });

    it('throws error for invalid circle where R^2 <= 0', () => {
      // x^2 + y^2 + 25 = 0 => R^2 = -25
      expect(() => EquationParser.parseCircle('x^2 + y^2 + 25 = 0')).toThrow();
    });
  });

  describe('Function and General Entry Point', () => {
    it('parses non-linear expressions as function plots', () => {
      const parsed1 = EquationParser.parse('y = x^2 - 4');
      expect(parsed1.type).toBe('function');
      if (parsed1.type === 'function') {
        expect(parsed1.expression).toBe('x^2 - 4');
      }

      const parsed2 = EquationParser.parse('f(x) = sin(x)');
      expect(parsed2.type).toBe('function');
      if (parsed2.type === 'function') {
        expect(parsed2.expression).toBe('sin(x)');
      }
    });

    it('automatically determines correct type from string', () => {
      expect(EquationParser.parse('y = 3x - 1').type).toBe('line');
      expect(EquationParser.parse('(x - 1)^2 + y^2 = 16').type).toBe('circle');
      expect(EquationParser.parse('y = 1/x').type).toBe('function');
    });

    it('throws when string is empty', () => {
      expect(() => EquationParser.parse('')).toThrow();
      expect(() => EquationParser.parse('   ')).toThrow();
    });
  });
});
