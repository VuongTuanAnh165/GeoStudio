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

  // Measurements
  registry.register({
    id: 'measure_distance',
    name: 'Measure Distance',
    icon: 'lucide:ruler',
    description: 'Select two points or one segment',
    match: (objects) => {
      if (objects.length === 1 && objects[0]?.type === 'segment') return true;
      if (objects.length === 2 && objects.every(o => o.type === 'point')) return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      return new CreateConstructionCommand('measurement', 'measurement', parents, generateId('measure'), { measureType: 'distance', targetIds: parents });
    }
  });

  registry.register({
    id: 'measure_angle',
    name: 'Measure Angle',
    icon: 'lucide:spline',
    description: 'Select three points',
    match: (objects) => {
      if (objects.length === 3 && objects.every(o => o.type === 'point')) return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      return new CreateConstructionCommand('measurement', 'measurement', parents, generateId('measure'), { measureType: 'angle', targetIds: parents });
    }
  });

  registry.register({
    id: 'measure_area',
    name: 'Measure Area',
    icon: 'lucide:scaling',
    description: 'Select polygon',
    match: (objects) => {
      if (objects.length === 1 && objects[0]?.type === 'polygon') return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      return new CreateConstructionCommand('measurement', 'measurement', parents, generateId('measure'), { measureType: 'area', targetIds: parents });
    }
  });

  registry.register({
    id: 'measure_perimeter',
    name: 'Measure Perimeter',
    icon: 'lucide:expand',
    description: 'Select polygon',
    match: (objects) => {
      if (objects.length === 1 && objects[0]?.type === 'polygon') return true;
      return false;
    },
    createCommand: (objects, generateId) => {
      const parents = objects.map(o => o.id);
      return new CreateConstructionCommand('measurement', 'measurement', parents, generateId('measure'), { measureType: 'perimeter', targetIds: parents });
    }
  });

  registry.register({
    id: 'locus',
    name: 'Locus',
    icon: 'lucide:activity',
    description: 'Select moving/target point, then driver element (glider, point or slider)',
    match: (objects) => {
      if (objects.length === 2) {
        const hasPoint = objects.some(o => o.type === 'point');
        const hasDriver = objects.some(o => o.type === 'point' || o.type === 'slider');
        return hasPoint && hasDriver;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      let targetObj = objects[0]!;
      let driverObj = objects[1]!;
      if (targetObj.type === 'slider' && driverObj.type === 'point') {
        targetObj = objects[1]!;
        driverObj = objects[0]!;
      }
      return new CreateConstructionCommand('locus', 'locus', [targetObj.id, driverObj.id], generateId('loc'), {
        targetId: targetObj.id,
        driverId: driverObj.id
      });
    }
  });

  // Transformations
  registry.register({
    id: 'translate',
    name: 'Translate by Vector',
    icon: 'lucide:move',
    description: 'Select object, then vector (or segment, or two points)',
    match: (objects) => {
      if (objects.length === 2) {
        // Can be target + vector/segment, or target + point
        return true;
      }
      if (objects.length === 3) {
        // Target + 2 points
        const points = objects.slice(1).filter(o => o.type === 'point');
        return points.length === 2;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      let targetObj = objects[0]!;
      let paramObjs = objects.slice(1);

      // If first object is a vector and second is not, swap
      if (targetObj.type === 'vector' && paramObjs[0] && paramObjs[0].type !== 'vector') {
        const tmp = targetObj;
        targetObj = paramObjs[0];
        paramObjs = [tmp];
      }

      const parentIds = [targetObj.id, ...paramObjs.map(o => o.id)];
      return new CreateConstructionCommand(targetObj.type, 'transform', parentIds, generateId(targetObj.type), {
        transformType: 'translation',
        sourceId: targetObj.id
      });
    }
  });

  registry.register({
    id: 'rotate',
    name: 'Rotate around Point',
    icon: 'lucide:rotate-cw',
    description: 'Select object, center point, and optionally slider for angle',
    match: (objects) => {
      if (objects.length === 2) {
        return objects.some(o => o.type === 'point');
      }
      if (objects.length === 3) {
        const hasPoint = objects.some(o => o.type === 'point');
        const hasSlider = objects.some(o => o.type === 'slider');
        return hasPoint && hasSlider;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      // Find center point and slider if any
      let targetObj = objects[0]!;
      let centerObj = objects.find((o, idx) => idx !== 0 && o.type === 'point');
      const sliderObj = objects.find(o => o.type === 'slider');

      if (!centerObj) {
        // If objects[0] is point and objects[1] is not, objects[1] is target
        if (objects[0]?.type === 'point' && objects[1] && objects[1].type !== 'point') {
          targetObj = objects[1];
          centerObj = objects[0];
        } else {
          centerObj = objects[1]!;
        }
      }

      const parentIds = [targetObj.id, centerObj.id];
      if (sliderObj && !parentIds.includes(sliderObj.id)) {
        parentIds.push(sliderObj.id);
      }

      return new CreateConstructionCommand(targetObj.type, 'transform', parentIds, generateId(targetObj.type), {
        transformType: 'rotation',
        sourceId: targetObj.id,
        angle: Math.PI / 4,
        angleDegrees: 45
      });
    }
  });

  registry.register({
    id: 'reflect',
    name: 'Reflect across Line / Point',
    icon: 'lucide:flip-horizontal-2',
    description: 'Select object and line of reflection (or center point)',
    match: (objects) => {
      if (objects.length === 2) {
        return true;
      }
      if (objects.length === 3) {
        // Target + 2 points defining mirror line
        return objects.slice(1).every(o => o.type === 'point');
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      let targetObj = objects[0]!;
      let mirrorObjs = objects.slice(1);

      // If first object is a line and second is not, swap
      if (['line', 'segment', 'ray'].includes(targetObj.type) && mirrorObjs[0] && !['line', 'segment', 'ray'].includes(mirrorObjs[0].type)) {
        const tmp = targetObj;
        targetObj = mirrorObjs[0];
        mirrorObjs = [tmp];
      }

      const parentIds = [targetObj.id, ...mirrorObjs.map(o => o.id)];
      return new CreateConstructionCommand(targetObj.type, 'transform', parentIds, generateId(targetObj.type), {
        transformType: 'reflection',
        sourceId: targetObj.id
      });
    }
  });

  registry.register({
    id: 'homothety',
    name: 'Homothety (Dilation)',
    icon: 'lucide:maximize-2',
    description: 'Select object, center point, and optionally slider for ratio',
    match: (objects) => {
      if (objects.length === 2) {
        return objects.some(o => o.type === 'point');
      }
      if (objects.length === 3) {
        const hasPoint = objects.some(o => o.type === 'point');
        const hasSlider = objects.some(o => o.type === 'slider');
        return hasPoint && hasSlider;
      }
      return false;
    },
    createCommand: (objects, generateId) => {
      let targetObj = objects[0]!;
      let centerObj = objects.find((o, idx) => idx !== 0 && o.type === 'point');
      const sliderObj = objects.find(o => o.type === 'slider');

      if (!centerObj) {
        if (objects[0]?.type === 'point' && objects[1] && objects[1].type !== 'point') {
          targetObj = objects[1];
          centerObj = objects[0];
        } else {
          centerObj = objects[1]!;
        }
      }

      const parentIds = [targetObj.id, centerObj.id];
      if (sliderObj && !parentIds.includes(sliderObj.id)) {
        parentIds.push(sliderObj.id);
      }

      return new CreateConstructionCommand(targetObj.type, 'transform', parentIds, generateId(targetObj.type), {
        transformType: 'homothety',
        sourceId: targetObj.id,
        ratio: 2
      });
    }
  });
};
