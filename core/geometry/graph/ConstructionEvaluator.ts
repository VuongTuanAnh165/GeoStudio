import type { ConstructionNode, GeometryObject } from '../../types/geometry';
import type { ConstructionGraph } from './ConstructionGraph';
import { TransformEngine } from '../transformations/TransformEngine';

/**
 * Standard evaluator for Construction Graph nodes.
 * Automatically computes and synchronizes mathematical definitions of dependent objects
 * (e.g. circle radius dynamically bound to a slider, or midpoint from parent points).
 */
export function defaultConstructionEvaluator(node: ConstructionNode, graph: ConstructionGraph): void {
  const obj = node.object;
  if (!obj) return;

  // 1. Circle dependent on slider and/or center point
  if (obj.type === 'circle') {
    // Check if any parent is a slider
    const sliderParentId = node.parents.find(pId => graph.getNode(pId)?.object.type === 'slider');
    if (sliderParentId) {
      const sliderNode = graph.getNode(sliderParentId);
      if (sliderNode && sliderNode.object.definition) {
        const sliderValue = Number((sliderNode.object.definition as Record<string, unknown>).value);
        if (!isNaN(sliderValue)) {
          const r = Math.max(0.001, sliderValue);
          // If obj is a Circle instance or has radius property
          if ('radius' in obj) {
            (obj as { radius: number }).radius = r;
          }
          if (typeof obj.definition === 'object' && obj.definition !== null) {
            (obj.definition as Record<string, unknown>).radius = r;
          }
        }
      }
    }

    // Check if first parent is a center point
    const pointParentId = node.parents.find(pId => graph.getNode(pId)?.object.type === 'point');
    if (pointParentId) {
      const ptNode = graph.getNode(pointParentId);
      if (ptNode && (ptNode.object.definition as Record<string, unknown>)?.coords) {
        const coords = (ptNode.object.definition as Record<string, unknown>).coords as { x: number; y: number };
        if ('center' in obj) {
          (obj as { center: { x: number; y: number } }).center = { ...coords };
        }
        if (typeof obj.definition === 'object' && obj.definition !== null) {
          (obj.definition as Record<string, unknown>).center = { ...coords };
        }
      }
    }
  }

  // 2. Midpoint construction
  if (obj.type === 'point' && obj.definition?.kind === 'midpoint') {
    const parentPoints = node.parents
      .map(pId => graph.getNode(pId)?.object)
      .filter((p): p is GeometryObject => p !== undefined && p.type === 'point');

    if (parentPoints.length >= 2) {
      const c1 = (parentPoints[0]!.definition as Record<string, unknown>).coords as { x: number; y: number };
      const c2 = (parentPoints[1]!.definition as Record<string, unknown>).coords as { x: number; y: number };
      if (c1 && c2) {
        const newCoords = {
          x: (c1.x + c2.x) / 2,
          y: (c1.y + c2.y) / 2
        };
        if ('x' in obj && 'y' in obj) {
          (obj as { x: number; y: number }).x = newCoords.x;
          (obj as { x: number; y: number }).y = newCoords.y;
        }
        if (typeof obj.definition === 'object' && obj.definition !== null) {
          (obj.definition as Record<string, unknown>).coords = newCoords;
        }
      }
    }
  }

  // 3. Locus construction sampling
  if (obj.type === 'locus' || obj.definition?.kind === 'locus') {
    const targetId = (obj.definition as any).targetId || node.parents[0];
    const targetNode = targetId ? graph.getNode(targetId) : undefined;

    if (targetNode) {
      const targetCoords = ((targetNode.object.definition as any)?.coords as { x: number; y: number } | undefined)
        || (('x' in targetNode.object && 'y' in targetNode.object) ? { x: (targetNode.object as any).x, y: (targetNode.object as any).y } : undefined);
      if (targetCoords) {
        if (!obj.definition || typeof obj.definition !== 'object') {
          obj.definition = { kind: 'locus' };
        }
        const samples = (((obj.definition as any).samples as Array<{ x: number; y: number }>) || []).slice();
        const last = samples[samples.length - 1];
        if (!last || Math.hypot(last.x - targetCoords.x, last.y - targetCoords.y) > 0.05) {
          samples.push({ x: targetCoords.x, y: targetCoords.y });
          if (samples.length > 500) samples.shift();
          (obj.definition as any).samples = samples;
        }
      }
    }
  }

  // 4. Geometric Transformation image objects
  if (obj.definition?.kind === 'transform') {
    TransformEngine.evaluate(node, graph);
  }
}
