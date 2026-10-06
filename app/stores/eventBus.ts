import { defineStore } from 'pinia';
import { EventBus } from '../../core/events/EventBus';

export const useEventBusStore = defineStore('eventBus', () => {
  const bus = new EventBus();

  return { bus };
});
