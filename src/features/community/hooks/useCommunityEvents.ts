import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityEvents.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptCommunityEvent } from "../adapter";
import type { CommunityEvent } from "../types";

export function useCommunityEvents() {
  const eventsQuery = useQuery(api.community.listEvents, {});
  const attendEvent = useMutation(api.community.attendEvent);
  const createEvent = useMutation(api.community.createEvent);
  const updateEvent = useMutation(api.community.updateEvent);
  const deleteEvent = useMutation(api.community.deleteEvent);

  const events: CommunityEvent[] =
    eventsQuery?.map((e: any) => adaptCommunityEvent(e)) ?? [];

  return {
    events,
    isLoading: eventsQuery === undefined,
    attendEvent: async (eventId: Id<"events">) => {
      try {
        const result = await attendEvent({ eventId });
        UIService.openToast(result.attending
            ? "Vous participez à l'événement"
            : "Vous ne participez plus", "success");
        return result;
      } catch (error) {
        UIService.openToast("Erreur lors de l'inscription", "error");
        throw error;
      }
    },
    createEvent: async (data: {
      title: string;
      description: string;
      category:
        | "culturel"
        | "sportif"
        | "religieux"
        | "professionnel"
        | "communautaire"
        | "formation"
        | "festival"
        | "autre";
      startDate: string;
      endDate?: string;
      location: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      coverImage?: string;
      maxAttendees?: number;
      isFree: boolean;
      price?: string;
      tags?: string[];
    }) => {
      try {
        // Assurer que tags est un tableau (même vide)
        const payload = {
          ...data,
          tags: data.tags ?? [],
        };
        const eventId = await createEvent(payload);
        UIService.openToast("Événement créé !", "success");
        return eventId;
      } catch (error) {
        UIService.openToast("Erreur lors de la création de l'événement", "error");
        throw error;
      }
    },
    updateEvent: async (
      eventId: Id<"events">,
      data: Partial<{
        title: string;
        description: string;
        category:
          | "culturel"
          | "sportif"
          | "religieux"
          | "professionnel"
          | "communautaire"
          | "formation"
          | "festival"
          | "autre";
        startDate: string;
        endDate?: string;
        location: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        coverImage?: string;
        maxAttendees?: number;
        isFree: boolean;
        price?: string;
        tags?: string[];
        status: "upcoming" | "ongoing" | "past" | "cancelled";
      }>,
    ) => {
      try {
        // Assurer que tags est un tableau si fourni
        const payload = {
          ...data,
          tags: data.tags ?? [],
        };
        await updateEvent({ eventId, ...payload });
        UIService.openToast("Événement mis à jour", "success");
        return eventId;
      } catch (error) {
        UIService.openToast("Erreur lors de la mise à jour", "error");
        throw error;
      }
    },
    deleteEvent: async (eventId: Id<"events">) => {
      try {
        await deleteEvent({ eventId });
        UIService.openToast("Événement supprimé", "success");
      } catch (error) {
        UIService.openToast("Erreur lors de la suppression", "error");
        throw error;
      }
    },
  };
}
