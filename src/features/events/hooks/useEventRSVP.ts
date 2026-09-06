import { UIService } from "@/core/sdk/ui/UIService";

// src/features/events/hooks/useEventRSVP.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useEventRSVP() {
  const rsvpMutation = useMutation(api.events.rsvp);

  const rsvp = async (
    eventId: Id<"events">,
    status: "attending" | "interested" | "not_going",
  ) => {
    try {
      const result = await rsvpMutation({ eventId, status });
      UIService.openToast("Inscription mise à jour", "success");
      return result;
    } catch (error) {
      UIService.openToast("Erreur lors de l'inscription", "error");
      throw error;
    }
  };

  return { rsvp };
}
