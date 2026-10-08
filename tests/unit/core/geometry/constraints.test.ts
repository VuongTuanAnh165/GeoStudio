import { describe, it, expect } from 'vitest';
import { ConstraintSolver } from '../../../core/geometry/constraints/ConstraintSolver';
import { FixedLength } from '../../../core/geometry/constraints/FixedLength';
import { Horizontal } from '../../../core/geometry/constraints/Horizontal';
import { Vertical } from '../../../core/geometry/constraints/Vertical';
import { PointOnLine } from '../../../core/geometry/constraints/PointOnLine';
import { PointOnCircle } from '../../../core/geometry/constraints/PointOnCircle';
import { FixedAngle } from '../../../core/geometry/constraints/FixedAngle';
import type { GeometryObject, Coords2D } from '../../../core/types/geometry';

function createPoint(id: string, x: number, y: number): GeometryObject {
  return {
    id,
    type: 'point',
    dimension: 2,
    definition: {
      kind: 'point',
      coords: { x, y }
    }
  };
}

describe('ConstraintSolver', () => {
  it('solves FixedLength constraint', () => {
    const p1 = createPoint('p1', 0, 0);
    const p2 = createPoint('p2', 3, 0);
    const objects = new Map([['p1', p1], ['p2', p2]]);
    
    // Set target length to 5
    const constraint = new FixedLength('c1', ['p1', 'p2'], 5);
    
    expect(constraint.getError(objects)).toBe(2);
    
    const solved = ConstraintSolver.solve(objects, [constraint]);
    expect(solved).toBe(true);
    
    const newP1 = (p1.definition.coords as Coords2D);
    const newP2 = (p2.definition.coords as Coords2D);
    
    const dx = newP2.x - newP1.x;
    const dy = newP2.y - newP1.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    
    expect(len).toBeCloseTo(5);
  });

  it('solves Horizontal constraint', () => {
    const p1 = createPoint('p1', 0, 0);
    const p2 = createPoint('p2', 5, 2);
    const objects = new Map([['p1', p1], ['p2', p2]]);
    
    const constraint = new Horizontal('c1', ['p1', 'p2']);
    
    expect(constraint.getError(objects)).toBe(2);
    
    const solved = ConstraintSolver.solve(objects, [constraint]);
    expect(solved).toBe(true);
    
    const newP1 = (p1.definition.coords as Coords2D);
    const newP2 = (p2.definition.coords as Coords2D);
    
    expect(newP1.y).toBeCloseTo(1);
    expect(newP2.y).toBeCloseTo(1);
  });

  it('solves Vertical constraint', () => {
    const p1 = createPoint('p1', 0, 0);
    const p2 = createPoint('p2', 2, 5);
    const objects = new Map([['p1', p1], ['p2', p2]]);
    
    const constraint = new Vertical('c1', ['p1', 'p2']);
    
    expect(constraint.getError(objects)).toBe(2);
    
    ConstraintSolver.solve(objects, [constraint]);
    
    const newP1 = (p1.definition.coords as Coords2D);
    const newP2 = (p2.definition.coords as Coords2D);
    
    expect(newP1.x).toBeCloseTo(1);
    expect(newP2.x).toBeCloseTo(1);
  });

  it('solves PointOnLine constraint', () => {
    const p = createPoint('p', 0, 5); // Needs to move to y=0
    const l1 = createPoint('l1', -5, 0);
    const l2 = createPoint('l2', 5, 0);
    const line = {
      id: 'line1',
      type: 'line',
      dimension: 2,
      parents: ['l1', 'l2'],
      definition: { kind: 'line' }
    } as GeometryObject;

    const objects = new Map([['p', p], ['l1', l1], ['l2', l2], ['line1', line]]);
    
    const constraint = new PointOnLine('c1', ['p', 'line1']);
    
    expect(constraint.getError(objects)).toBe(5);
    
    ConstraintSolver.solve(objects, [constraint]);
    
    const newP = (p.definition.coords as Coords2D);
    expect(newP.x).toBeCloseTo(0);
    expect(newP.y).toBeCloseTo(0);
  });

  it('solves FixedAngle constraint', () => {
    // Right angle at origin
    const a = createPoint('a', 0, 5);
    const b = createPoint('b', 0, 0);
    const c = createPoint('c', 5, 0);
    
    const objects = new Map([['a', a], ['b', b], ['c', c]]);
    
    // Constrain to 45 degrees
    const constraint = new FixedAngle('c1', ['a', 'b', 'c'], 45);
    
    ConstraintSolver.solve(objects, [constraint]);
    
    const newA = (a.definition.coords as Coords2D);
    const newC = (c.definition.coords as Coords2D);
    
    const angleBA = Math.atan2(newA.y, newA.x);
    const angleBC = Math.atan2(newC.y, newC.x);
    
    let currentAngle = angleBC - angleBA;
    if (currentAngle < 0) currentAngle += Math.PI * 2;
    if (currentAngle > Math.PI) currentAngle = 2 * Math.PI - currentAngle;
    
    expect(currentAngle * 180 / Math.PI).toBeCloseTo(45);
  });
});
