import type { GeometryState } from '../../types/commands';

export class NameGenerator {
  static getNextPointName(state: GeometryState): string {
    const objects = state.document.objects;
    const existingNames = new Set(
      objects
        .filter(obj => obj.type === 'point' && obj.metadata?.label)
        .map(obj => obj.metadata!.label as string)
    );

    let suffix = 0;

    while (true) {
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(65 + i); // A to Z
        const name = suffix === 0 ? letter : `${letter}_{${suffix}}`;
        if (!existingNames.has(name)) {
          return name;
        }
      }
      suffix++;
    }
  }

  static isNameAvailable(state: GeometryState, name: string): boolean {
    const objects = state.document.objects;
    return !objects.some(obj => obj.metadata?.label === name);
  }

  static getSpecialPointName(
    state: GeometryState,
    type: 'orthocenter' | 'circumcenter' | 'incenter' | 'centroid' | 'midpoint'
  ): string {
    const defaultName = {
      orthocenter: 'H',
      circumcenter: 'O',
      incenter: 'I',
      centroid: 'G',
      midpoint: 'M'
    }[type];

    if (this.isNameAvailable(state, defaultName)) {
      return defaultName;
    }
    
    // Fallback to normal generation
    return this.getNextPointName(state);
  }

  static getNextSliderName(state: GeometryState): string {
    const objects = state.document.objects;
    const existingNames = new Set(
      objects
        .filter(obj => obj.type === 'slider' && ((obj.definition as any).name || obj.metadata?.label))
        .map(obj => ((obj.definition as any).name || obj.metadata?.label) as string)
    );

    const candidates = ['a', 'b', 'c', 'd', 'k', 'm', 'n', 'r', 's', 't'];
    for (const name of candidates) {
      if (!existingNames.has(name)) {
        return name;
      }
    }

    let idx = 1;
    while (true) {
      const name = `s_{${idx}}`;
      if (!existingNames.has(name)) {
        return name;
      }
      idx++;
    }
  }
}
