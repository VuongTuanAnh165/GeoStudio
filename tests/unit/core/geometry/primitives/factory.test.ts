import { describe, it, expect } from 'vitest';
import { createPrimitiveFromJSON } from '../../../../../core/geometry/primitives/factory';
import { Point, Line, Polygon } from '../../../../../core/geometry/primitives/2d';

describe('Primitive Factory', () => {
  it('should recreate Point from JSON', () => {
    const point = new Point(1, 2, 'p1');
    point.style = { color: 'red' };
    const json = point.toJSON();
    
    const recreated = createPrimitiveFromJSON(json);
    expect(recreated).toBeInstanceOf(Point);
    expect(recreated.id).toBe('p1');
    expect((recreated as Point).x).toBe(1);
    expect((recreated as Point).y).toBe(2);
    expect(recreated.style).toEqual({ color: 'red' });
  });

  it('should recreate Line from JSON', () => {
    const line = new Line({ x: 0, y: 0 }, { x: 1, y: 0 }, 'l1');
    const recreated = createPrimitiveFromJSON(line.toJSON());
    expect(recreated).toBeInstanceOf(Line);
    expect((recreated as Line).point).toEqual({ x: 0, y: 0 });
    expect((recreated as Line).direction).toEqual({ x: 1, y: 0 });
  });
  
  it('should recreate Polygon from JSON', () => {
    const poly = new Polygon([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]);
    poly.parents = ['p1', 'p2', 'p3'];
    const recreated = createPrimitiveFromJSON(poly.toJSON());
    expect(recreated).toBeInstanceOf(Polygon);
    expect((recreated as Polygon).points.length).toBe(3);
    expect(recreated.parents).toEqual(['p1', 'p2', 'p3']);
  });
});
