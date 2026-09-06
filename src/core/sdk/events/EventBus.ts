import type { DomainEvent, EventHandler } from "../types";

const handlers: Record<string, EventHandler[]> = {};

export const EventBus = {
  subscribe: (eventType: string, handler: EventHandler) => {
    if (!handlers[eventType]) handlers[eventType] = [];
    handlers[eventType].push(handler);

    return () => {
      handlers[eventType] = handlers[eventType].filter((h) => h !== handler);
    };
  },
  publish: async (event: DomainEvent) => {
    const h = handlers[event.type] || [];
    for (const handler of h) {
      await handler(event);
    }
  },
};
