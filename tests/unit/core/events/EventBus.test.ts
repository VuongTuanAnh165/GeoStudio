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
});
