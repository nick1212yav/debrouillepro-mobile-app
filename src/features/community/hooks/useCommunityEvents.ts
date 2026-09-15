// src/features/community/hooks/useCommunityEvents.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
        toast.success(
          result.attending
            ? "Vous participez à l'événement"
            : "Vous ne participez plus",
        );
        return result;
      } catch (error) {
        toast.error("Erreur lors de l'inscription");
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
        toast.success("Événement créé !");
        return eventId;
      } catch (error) {
        toast.error("Erreur lors de la création de l'événement");
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
        toast.success("Événement mis à jour");
        return eventId;
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
        throw error;
      }
    },
    deleteEvent: async (eventId: Id<"events">) => {
      try {
        await deleteEvent({ eventId });
        toast.success("Événement supprimé");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
        throw error;
      }
    },
  };
}
