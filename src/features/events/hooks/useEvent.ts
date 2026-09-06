// src/features/events/hooks/useEvent.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptEvent } from "../adapter";
import type { Event } from "../types";
import type { Id } from "@/convex/_generated/dataModel";

export function useEvent(eventId: Id<"events"> | undefined): {
  event: Event | null;
  isLoading: boolean;
} {
  const eventData = useQuery(api.events.get, eventId ? { eventId } : "skip");

  if (!eventData) {
    return { event: null, isLoading: true };
  }

  const event = adaptEvent(eventData);
  return { event, isLoading: false };
}
