import type { GeometryState } from '../types/commands';
import { NameGenerator } from '../geometry/naming/NameGenerator';
import { PasteObjectsCommand } from '../commands/primitives';
import type { GeometryObject as BaseGeometryObject } from '../types/geometry';

export class ClipboardManager {
  private static readonly CLIPBOARD_FORMAT = 'application/x-geostudio-objects';
  private static internalClipboard: BaseGeometryObject[] | null = null; // Fallback for browsers without proper Clipboard API

  static async copy(state: GeometryState, selectedIds: string[]): Promise<void> {
    if (selectedIds.length === 0) return;

    // We need to collect selected objects and all their dependencies (parents) recursively
    const objectsToCopy = new Map<string, BaseGeometryObject>();
    
    const collectParents = (id: string) => {
      if (objectsToCopy.has(id)) return;
      const obj = state.document.objects.find(o => o.id === id);
      if (!obj) return;
      
      objectsToCopy.set(id, JSON.parse(JSON.stringify(obj)));
      
      if (obj.parents) {
        for (const parentId of obj.parents) {
          collectParents(parentId);
        }
      }
    };

    for (const id of selectedIds) {
      collectParents(id);
    }

    const payload = Array.from(objectsToCopy.values());
    const jsonStr = JSON.stringify({ type: 'geostudio-clipboard', data: payload });

    // Save to internal clipboard fallback
    this.internalClipboard = payload;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(jsonStr);
      }
    } catch (e) {
      console.warn('Failed to write to system clipboard, using internal memory', e);
    }
  }

  static async paste(state: GeometryState): Promise<PasteObjectsCommand | null> {
    let payload: BaseGeometryObject[] | null = null;

    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.type === 'geostudio-clipboard' && Array.isArray(parsed.data)) {
            payload = parsed.data;
          }
        } catch {
          // not valid JSON, ignore
        }
      }
    } catch (e) {
      console.warn('Failed to read from system clipboard, using internal memory', e);
    }

    if (!payload && this.internalClipboard) {
      payload = JSON.parse(JSON.stringify(this.internalClipboard));
    }

    if (!payload || payload.length === 0) return null;

    // We need to map old IDs to new IDs
    const idMap = new Map<string, string>();
    const newObjects: BaseGeometryObject[] = [];

    // 1. First pass: generate new IDs and names, offset coordinates of independent points
    for (const obj of payload) {
      const newId = crypto.randomUUID();
      idMap.set(obj.id, newId);
      obj.id = newId;

      // Ensure unique name
      if (obj.metadata?.label) {
        const originalName = obj.metadata.label as string;
        // Check if name is taken in current state OR in newly pasted objects so far
        let nameToUse = originalName;
        // Naive check: 
        const isTaken = (n: string) => 
          state.document.objects.some(o => o.metadata?.label === n) || 
          newObjects.some(o => o.metadata?.label === n);

        if (isTaken(nameToUse)) {
          // For points, use NameGenerator
          if (obj.type === 'point') {
            // we create a dummy state combining current state and new objects to get next point name
            const dummyState = {
              document: { objects: [...state.document.objects, ...newObjects] }
            } as GeometryState;
            nameToUse = NameGenerator.getNextPointName(dummyState);
          } else {
            // For other objects, just append a number or something, or let NameGenerator handle it
            let i = 1;
            while (isTaken(`${originalName}_${i}`)) {
              i++;
            }
            nameToUse = `${originalName}_${i}`;
          }
        }
        obj.metadata.label = nameToUse;
      }

      // Offset independent objects (like free points)
      if (!obj.parents || obj.parents.length === 0) {
        if (obj.type === 'point' && obj.definition.coords) {
          const coords = obj.definition.coords as { x: number; y: number };
          coords.x += 1;
          coords.y -= 1;
        }
      }

      newObjects.push(obj);
    }

    // 2. Second pass: remap parent references
    for (const obj of newObjects) {
      if (obj.parents) {
        obj.parents = obj.parents.map(pid => idMap.get(pid) || pid);
      }
      
      // Some tools like angle/polygon might have specific fields in definition referencing points
      // We also need to remap definition fields if they contain IDs
      if (obj.type === 'polygon' && Array.isArray(obj.definition.points)) {
        obj.definition.points = obj.definition.points.map((pid: string) => idMap.get(pid) || pid);
      }
    }

    return new PasteObjectsCommand(newObjects);
  }
}
