// src/features/messages/events/hooks/useMessageEvents.ts

import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import {
  eventsApi,
  extractEventIdFromPublication,
  type EventId,
  type EventRsvpStatus,
  type MessageEvent,
} from "../services/events.service";

export interface MessageEventSource {
  _id: Id<"messages">;
  sharedPublicationId?: Id<"publications">;
  text?: string;
  type?: string;
}

export function useMessageEvents(
  message?: MessageEventSource | null,
  eventId?: EventId,
) {
  /*
   * --------------------------------------------------------------------------
   * PUBLICATION
   * --------------------------------------------------------------------------
   *
   * Un message événement contient généralement sharedPublicationId.
   * La publication contient meta.eventId.
   */

  const publication = useQuery(
    eventsApi.getPublication,
    message?.sharedPublicationId
      ? {
          id: message.sharedPublicationId,
        }
      : "skip",
  );

  const resolvedEventId = eventId ?? extractEventIdFromPublication(publication);

  /*
   * --------------------------------------------------------------------------
   * EVENT
   * --------------------------------------------------------------------------
   */

  const event = useQuery(
    eventsApi.get,
    resolvedEventId
      ? {
          eventId: resolvedEventId,
        }
      : "skip",
  );

  /*
   * --------------------------------------------------------------------------
   * MUTATIONS
   * --------------------------------------------------------------------------
   */

  const rsvpMutation = useMutation(eventsApi.rsvp);
  const trackViewMutation = useMutation(eventsApi.trackView);
  const likeMutation = useMutation(eventsApi.like);
  const bookmarkMutation = useMutation(eventsApi.bookmark);

  /*
   * --------------------------------------------------------------------------
   * TRACK VIEW
   * --------------------------------------------------------------------------
   *
   * Une seule fois par affichage du message.
   */

  useEffect(() => {
    if (!resolvedEventId) {
      return;
    }

    void trackViewMutation({
      eventId: resolvedEventId,
    });
  }, [resolvedEventId, trackViewMutation]);

  /*
   * --------------------------------------------------------------------------
   * ACTIONS
   * --------------------------------------------------------------------------
   */

  const setRsvp = async (status: EventRsvpStatus) => {
    if (!resolvedEventId) {
      throw new Error("Événement introuvable.");
    }

    return rsvpMutation({
      eventId: resolvedEventId,
      status,
    });
  };

  const toggleLike = async () => {
    if (!resolvedEventId) {
      throw new Error("Événement introuvable.");
    }

    return likeMutation({
      eventId: resolvedEventId,
    });
  };

  const toggleBookmark = async () => {
    if (!resolvedEventId) {
      throw new Error("Événement introuvable.");
    }

    return bookmarkMutation({
      eventId: resolvedEventId,
    });
  };

  const isLoading =
    Boolean(message?.sharedPublicationId) && publication === undefined;

  const eventLoading = Boolean(resolvedEventId) && event === undefined;

  return {
    event: (event ?? null) as MessageEvent | null,

    eventId: resolvedEventId,

    publication,

    isLoading: isLoading || eventLoading,

    setRsvp,
    toggleLike,
    toggleBookmark,
  };
}
