import type { AnimationConfig, AnimationEasing } from '../types/animation';
import { DEFAULT_ANIMATION_CONFIG, EasingFunctions } from '../types/animation';
import type { Coords2D } from '../types/geometry';

export interface RunningAnimation {
  id: string;
  startTime: number;
  duration: number;
  easing: AnimationEasing;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

export class AnimationSystem {
  private config: AnimationConfig;
  private runningAnimations: Map<string, RunningAnimation> = new Map();

  constructor(config: AnimationConfig = DEFAULT_ANIMATION_CONFIG) {
    this.config = { ...config };
  }

  getConfig(): AnimationConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  shouldAnimateConstruction(): boolean {
    return this.config.enabled && this.config.constructionFadeIn !== false;
  }

  shouldAnimateTransform(): boolean {
    return this.config.enabled && this.config.transformTransition !== false;
  }

  shouldAnimateDelete(): boolean {
    return this.config.enabled && this.config.deleteFadeOut !== false;
  }

  interpolateCoords(from: Coords2D, to: Coords2D, t: number, easing: AnimationEasing = this.config.easing): Coords2D {
    const easedT = this.getEasedProgress(t, easing);
    return {
      x: from.x + (to.x - from.x) * easedT,
      y: from.y + (to.y - from.y) * easedT
    };
  }

  interpolateValue(from: number, to: number, t: number, easing: AnimationEasing = this.config.easing): number {
    const easedT = this.getEasedProgress(t, easing);
    return from + (to - from) * easedT;
  }

  interpolateNumber(from: number, to: number, t: number, easing: AnimationEasing = this.config.easing): number {
    return this.interpolateValue(from, to, t, easing);
  }

  getEasedProgress(linearProgress: number, easing: AnimationEasing = this.config.easing): number {
    const clamped = Math.max(0, Math.min(1, linearProgress));
    const fn = EasingFunctions[easing] || EasingFunctions.easeInOut;
    return fn(clamped);
  }

  getJSXGraphEasingEffect(easing: AnimationEasing = this.config.easing): string {
    switch (easing) {
      case 'linear':
        return '--';
      case 'easeIn':
        return '>';
      case 'easeOut':
        return '<';
      case 'easeInOut':
      default:
        return '<>';
    }
  }

  getJSXGraphEffect(easing: AnimationEasing = this.config.easing): string {
    return this.getJSXGraphEasingEffect(easing);
  }
}
