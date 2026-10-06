import { defineNuxtPlugin } from '#app';
import { useEventBusStore } from '../stores/eventBus';

export default defineNuxtPlugin(() => {
  const eventBusStore = useEventBusStore();
  
  return {
    provide: {
      eventBus: eventBusStore.bus
    }
  };
});
