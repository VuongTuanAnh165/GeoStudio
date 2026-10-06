import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../../../core/events/EventBus';
import type { GeoEvent } from '../../../../core/types/events';

describe('EventBus', () => {
  it('should register and trigger listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('object:deleted', handler);

    const event: GeoEvent = { type: 'object:deleted', payload: { id: 'obj1' } };
    bus.emit(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should unsubscribe listeners correctly', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('object:deleted', handler);
    unsubscribe();

    bus.emit({ type: 'object:deleted', payload: { id: 'obj1' } });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should allow off() to remove listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('object:deleted', handler);
    bus.off('object:deleted', handler);

    bus.emit({ type: 'object:deleted', payload: { id: 'obj1' } });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should trigger once() only one time', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.once('object:deleted', handler);

    const event: GeoEvent = { type: 'object:deleted', payload: { id: 'obj1' } };
    bus.emit(event);
    bus.emit(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not crash when emitting an event with no listeners', () => {
    const bus = new EventBus();
    expect(() => {
      bus.emit({ type: 'object:deleted', payload: { id: 'obj1' } });
    }).not.toThrow();
  });

  it('should allow multiple listeners for the same event', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('view:zoomed', handler1);
    bus.on('view:zoomed', handler2);

    const event: GeoEvent = { type: 'view:zoomed', payload: { scale: 2 } };
    bus.emit(event);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should not affect other listeners when one unsubscribes', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const unsubscribe1 = bus.on('view:panned', handler1);
    bus.on('view:panned', handler2);

    unsubscribe1();

    const event: GeoEvent = { type: 'view:panned', payload: { offset: { x: 10, y: 10 } } };
    bus.emit(event);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should not duplicate identical handlers (Set behavior)', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('tool:changed', handler);
    bus.on('tool:changed', handler); // Same handler instance

    const event: GeoEvent = { type: 'tool:changed', payload: { tool: 'select' } };
    bus.emit(event);

    // Should only be called once because Set ignores duplicates
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should allow emitting multiple different events without crossover', () => {
    const bus = new EventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    bus.on('document:saved', handlerA);
    bus.on('document:loaded', handlerB);

    bus.emit({ type: 'document:saved', payload: { documentId: 'doc1' } });

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).not.toHaveBeenCalled();
  });

  it('should correctly handle once() when multiple once listeners are registered', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.once('object:selected', handler1);
    bus.once('object:selected', handler2);

    const event: GeoEvent = { type: 'object:selected', payload: { ids: ['obj1'] } };
    bus.emit(event);
    bus.emit(event); // Second emit should do nothing

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should safely handle off() being called with an unregistered handler', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    
    // Attempting to remove a handler that was never added or from an empty event
    expect(() => {
      bus.off('view:switched', handler);
    }).not.toThrow();
  });
});
