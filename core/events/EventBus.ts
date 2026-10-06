import type { GeoEvent, EventBus as IEventBus } from '../types/events';

export class EventBus implements IEventBus {
  private listeners: Map<string, Set<(event: GeoEvent) => void>> = new Map();

  on(event: string, handler: (e: GeoEvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off(event: string, handler: (e: GeoEvent) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: GeoEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      // Create a copy of handlers to prevent issues if a handler unsubscribes during emit
      Array.from(handlers).forEach(handler => handler(event));
    }
  }

  once(event: string, handler: (e: GeoEvent) => void): void {
    const onceHandler = (e: GeoEvent) => {
      this.off(event, onceHandler);
      handler(e);
    };
    this.on(event, onceHandler);
  }
}
