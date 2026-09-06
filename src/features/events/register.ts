// src/features/events/register.ts
import { manifest } from "./manifest";
import { adaptEvent, adaptEventComment, adaptEventTicket } from "./adapter";

export function registerEvents(registry: any) {
  registry.registerModule({
    manifest,
    adapters: {
      event: adaptEvent,
      eventComment: adaptEventComment,
      eventTicket: adaptEventTicket,
    },
    components: {},
    hooks: {},
  });
}
