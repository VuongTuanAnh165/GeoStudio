import type { Constraint } from './Constraint';
import type { GeometryObject } from '../../types/geometry';
import { GEOMETRY_TOLERANCE } from '../../types/geometry';

export class ConstraintSolver {
  
  /**
   * Applies the constraints to the objects map.
   * This modifies the objects IN PLACE.
   * Make sure to pass a cloned map if you want immutability.
   * 
   * @returns true if converged, false if not converged.
   */
  static solve(objects: Map<string, GeometryObject>, constraints: Constraint[]): boolean {
    if (constraints.length === 0) return true;

    const maxIterations = GEOMETRY_TOLERANCE.MAX_SOLVER_ITERATIONS;
    const tolerance = GEOMETRY_TOLERANCE.CONSTRAINT_TOLERANCE;

    for (let iter = 0; iter < maxIterations; iter++) {
      let maxError = 0;

      for (const constraint of constraints) {
        const err = constraint.getError(objects);
        if (err > maxError) {
          maxError = err;
        }
        
        if (err > tolerance) {
          constraint.relax(objects);
        }
      }

      if (maxError <= tolerance) {
        return true; // Converged
      }
    }

    return false; // Did not converge within max iterations
  }

  static validate(objects: Map<string, GeometryObject>, constraints: Constraint[]): boolean {
    const tolerance = GEOMETRY_TOLERANCE.CONSTRAINT_TOLERANCE;
    for (const constraint of constraints) {
      if (constraint.getError(objects) > tolerance) return false;
    }
    return true;
  }
}
