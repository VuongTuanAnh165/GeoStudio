import { describe, it, expect } from 'vitest';
import { Slider, createPrimitiveFromJSON } from '../../../../../core/geometry/primitives';

describe('Slider Primitive', () => {
  it('should create slider with correct defaults and clamped values', () => {
    const s = new Slider('a', 0, 10, 5, 0.5);
    expect(s.name).toBe('a');
    expect(s.min).toBe(0);
    expect(s.max).toBe(10);
    expect(s.value).toBe(5);
    expect(s.step).toBe(0.5);
    expect(s.type).toBe('slider');
    expect(s.dimension).toBe(2);
  });

  it('should clamp and snap values properly', () => {
    const s = new Slider('r', 1, 5, 2.3, 0.2);
    // 2.3 snaps to 2.2 or 2.4 based on step 0.2 from 1.0
    // (2.3 - 1.0) / 0.2 = 6.5 -> 7 -> 1.0 + 1.4 = 2.4
    expect(s.value).toBe(2.4);

    s.setValue(10); // exceed max
    expect(s.value).toBe(5);

    s.setValue(-1); // below min
    expect(s.value).toBe(1);
  });

  it('should produce correct JSON and format toString', () => {
    const s = new Slider('k', 0, 100, 50, 1);
    expect(s.toString()).toContain('Slider(k = 50 [0, 100]');
    
    const json = s.toJSON();
    expect(json.type).toBe('slider');
    expect(json.definition.kind).toBe('slider');
    expect((json.definition as any).value).toBe(50);
  });

  it('should round-trip through createPrimitiveFromJSON', () => {
    const original = new Slider('b', -5, 5, 0, 0.1, { x: -10, y: 5 }, { x: -5, y: 5 });
    const json = original.toJSON();
    const recreated = createPrimitiveFromJSON(json) as Slider;

    expect(recreated.type).toBe('slider');
    expect(recreated.name).toBe('b');
    expect(recreated.min).toBe(-5);
    expect(recreated.max).toBe(5);
    expect(recreated.value).toBe(0);
    expect(recreated.p1).toEqual({ x: -10, y: 5 });
  });
});
