import type { Tool, ToolContext, ToolEvent } from './Tool';
import { ConstructionRegistry } from '../../geometry/constructions/ConstructionRegistry';
import type { GeometryObject } from '../../types/geometry';

export class ConstructionTool implements Tool {
  id = 'construction';
  private selectedObjects: GeometryObject[] = [];
  
  constructor(public constructionId: string) {
    this.id = `construct_${constructionId}`;
  }

  onActivate(context: ToolContext) {
    this.selectedObjects = [];
  }

  onDeactivate(context: ToolContext) {
    this.selectedObjects = [];
  }

  onMouseDown(event: ToolEvent, context: ToolContext) {
    if (!event.hitObjectId) return; // For constructions, we only care about clicking existing objects

    const obj = context.getObject(event.hitObjectId);
    if (!obj) return;

    // Toggle selection
    const index = this.selectedObjects.findIndex(o => o.id === event.hitObjectId);
    if (index !== -1) {
      this.selectedObjects.splice(index, 1);
    } else {
      this.selectedObjects.push(obj);
    }
    
    // Check if we have a match
    const registry = ConstructionRegistry.getInstance();
    const def = registry.getConstruction(this.constructionId);
    if (!def) return;

    if (def.match(this.selectedObjects)) {
      const command = def.createCommand(this.selectedObjects, context.generateId);
      context.executeCommand(command);
      // Reset after successful construction
      this.selectedObjects = [];
      // Also clear global selection to match GeoGebra behavior
      context.selectObject(null);
    } else {
      // Highlight them via pinia store if possible, 
      // but the tool context doesn't have a multi-select helper yet.
      // So we just rely on visual feedback if we want, but for now we just select the last one.
      context.selectObject(event.hitObjectId);
    }
  }
}
