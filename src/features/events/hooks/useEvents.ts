// src/features/events/hooks/useEvents.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptEvent } from "../adapter";
import type { Event, EventCategory } from "../types";

interface UseEventsOptions {
  category?: EventCategory;
  limit?: number;
}

export function useEvents(options: UseEventsOptions = {}) {
  const { category, limit = 50 } = options;

  const eventsData = useQuery(api.events.list, {
    category: category as string,
    limit,
  });

  if (!eventsData) {
    return { events: [] as Event[], isLoading: true };
  }

  const events = eventsData.map((event: any) => adaptEvent(event));

  return { events, isLoading: false };
}
