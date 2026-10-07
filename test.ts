import { CommandEngine } from './core/commands/CommandEngine';
import { CreatePointCommand } from './core/commands/primitives';
import { SetStyleCommand, ShowLabelCommand } from './core/commands/mutations';

const engine = new CommandEngine({
  document: {
    version: '1.0',
    schemaVersion: 1,
    metadata: { 
      id: 'test', 
      title: 'Untitled Document', 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    },
    settings: { 
      theme: 'light', 
      gridVisible: true, 
      axisVisible: true, 
      snapEnabled: true, 
      dimension: 2 
    },
    viewport: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    objects: []
  },
  selection: []
});

const createCmd = new CreatePointCommand(1, 1, 'pt1');
let res = engine.execute(createCmd);
console.log('Create result:', res);
console.log('Objects:', engine.currentState.document.objects);

engine.currentState.selection = ['pt1'];

const styleCmd = new SetStyleCommand('pt1', { color: '#ff0000' });
res = engine.execute(styleCmd);
console.log('Style result:', res);
console.log('Objects after style:', engine.currentState.document.objects);

const labelCmd = new ShowLabelCommand('pt1', 'A');
res = engine.execute(labelCmd);
console.log('Label result:', res);
console.log('Objects after label:', engine.currentState.document.objects);
