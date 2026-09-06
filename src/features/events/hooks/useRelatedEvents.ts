// src/features/events/hooks/useRelatedEvents.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptEvent } from "../adapter";
import type { Event } from "../types";

export function useRelatedEvents(eventId: string, limit: number = 4) {
  const eventsData = useQuery(api.events.list, { limit: 20 });
  if (!eventsData) return { events: [] as Event[], isLoading: true };

  const events = eventsData
    .map((e: any) => adaptEvent(e))
    .filter((e: Event) => e._id !== eventId)
    .slice(0, limit);
  return { events, isLoading: false };
}
