// src/features/events/hooks/useEventRSVP.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useEventRSVP() {
  const rsvpMutation = useMutation(api.events.rsvp);

  const rsvp = async (
    eventId: Id<"events">,
    status: "attending" | "interested" | "not_going",
  ) => {
    try {
      const result = await rsvpMutation({ eventId, status });
      toast.success("Inscription mise à jour");
      return result;
    } catch (error) {
      toast.error("Erreur lors de l'inscription");
      throw error;
    }
  };

  return { rsvp };
}
