import { ConstructionRegistry } from './ConstructionRegistry';
import { CreateConstructionCommand } from '../../commands/constructions';

export const registerBuiltinConstructions = () => {
  const registry = ConstructionRegistry.getInstance();

  registry.register({
    id: 'midpoint',
    name: 'Midpoint or Center',
    icon: 'lucide:split-square-horizontal',
    description: 'Select two points or one segment',
    match: (objects) => {
      if (objects.length === 1 && objects[0]?.type === 'segment') return true;
      if (objects.length === 2 && objects.every(o => o.type === 'point')) return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      return new CreateConstructionCommand('point', 'midpoint', parents, generateId('pt'));
    }
  });

  registry.register({
    id: 'perpendicular',
    name: 'Perpendicular Line',
    icon: 'lucide:ruler',
    description: 'Select point and perpendicular line/segment',
    match: (objects) => {
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point');
        const hasLine = objects.some(o => ['line', 'segment', 'ray'].includes(o.type));
        return hasPoint && hasLine;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      // For JSXGraph, normal creation is board.create('perpendicular', [line, point])
      const lineObj = objects.find(o => ['line', 'segment', 'ray'].includes(o.type))!;
      const pointObj = objects.find(o => o.type === 'point')!;
      return new CreateConstructionCommand('line', 'perpendicular', [lineObj.id, pointObj.id], generateId('line'));
    }
  });

  registry.register({
    id: 'parallel',
    name: 'Parallel Line',
    icon: 'lucide:equal',
    description: 'Select point and parallel line/segment',
    match: (objects) => {
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point');
        const hasLine = objects.some(o => ['line', 'segment', 'ray'].includes(o.type));
        return hasPoint && hasLine;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const lineObj = objects.find(o => ['line', 'segment', 'ray'].includes(o.type))!;
      const pointObj = objects.find(o => o.type === 'point')!;
      return new CreateConstructionCommand('line', 'parallel', [lineObj.id, pointObj.id], generateId('line'));
    }
  });
  
  registry.register({
    id: 'angle_bisector',
    name: 'Angle Bisector',
    icon: 'lucide:scissors',
    description: 'Select three points or two lines',
    match: (objects) => {
      if (objects.length === 3 && objects.every(o => o.type === 'point')) return true;
      if (objects.length === 2 && objects.every(o => ['line', 'segment', 'ray'].includes(o.type))) return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      return new CreateConstructionCommand('line', 'bisector', parents, generateId('line'));
    }
  });

  registry.register({
    id: 'perpendicular_bisector',
    name: 'Perpendicular Bisector',
    icon: 'lucide:move-vertical',
    description: 'Select two points or one segment',
    match: (objects) => {
      if (objects.length === 1 && objects[0]?.type === 'segment') return true;
      if (objects.length === 2 && objects.every(o => o.type === 'point')) return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      // Ensure specific JSXGraph kind mapping if needed. 'perpendicularsegment' or similar? We'll use 'perpendicular' or let renderer handle it
      return new CreateConstructionCommand('line', 'perpendicular_bisector', parents, generateId('line'));
    }
  });
  
  registry.register({
    id: 'intersection',
    name: 'Intersection',
    icon: 'lucide:x',
    description: 'Select two intersecting objects',
    match: (objects) => {
      if (objects.length === 2) {
        return objects.every(o => ['line', 'segment', 'ray', 'circle', 'polygon'].includes(o.type));
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      return new CreateConstructionCommand('point', 'intersection', parents, generateId('pt'), { index: 0 }); 
      // index: 0 is for first intersection. For circles, there are 2.
    }
  });
  
  registry.register({
    id: 'circumcircle',
    name: 'Circumcircle',
    icon: 'lucide:circle-dashed',
    description: 'Select three points',
    match: (objects) => {
      if (objects.length === 3 && objects.every(o => o.type === 'point')) return true;
      if (objects.length === 1 && objects[0]?.type === 'polygon' && objects[0].parents?.length === 3) return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const obj = objects[0];
      const parents = objects.length === 1 && obj?.type === 'polygon' 
        ? (obj.parents || []) 
        : objects.map(o => o.id);
      return new CreateConstructionCommand('circle', 'circumcircle', parents, generateId('circle'));
    }
  });
  
  registry.register({
    id: 'incircle',
    name: 'Incircle',
    icon: 'lucide:disc-3',
    description: 'Select three points',
    match: (objects) => {
      if (objects.length === 3 && objects.every(o => o.type === 'point')) return true;
      if (objects.length === 1 && objects[0]?.type === 'polygon' && objects[0].parents?.length === 3) return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const obj = objects[0];
      const parents = objects.length === 1 && obj?.type === 'polygon' 
        ? (obj.parents || []) 
        : objects.map(o => o.id);
      return new CreateConstructionCommand('circle', 'incircle', parents, generateId('circle'));
    }
  });
  
  registry.register({
    id: 'tangent',
    name: 'Tangent',
    icon: 'lucide:trending-up',
    description: 'Select point and circle',
    match: (objects) => {
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point');
        const hasCircle = objects.some(o => o.type === 'circle');
        return hasPoint && hasCircle;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      const pointObj = objects.find(o => o.type === 'point')!;
      const circleObj = objects.find(o => o.type === 'circle')!;
      return new CreateConstructionCommand('line', 'tangent', [pointObj.id, circleObj.id], generateId('line'));
    }
  });
};
