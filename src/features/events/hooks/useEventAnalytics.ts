// src/features/events/hooks/useEventAnalytics.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useEventAnalytics(eventId: Id<"events"> | undefined) {
  const analytics = useQuery(
    api.events.getAnalytics,
    eventId ? { eventId } : "skip",
  );

  return {
    analytics: analytics ?? null,
    isLoading: analytics === undefined,
  };
}
