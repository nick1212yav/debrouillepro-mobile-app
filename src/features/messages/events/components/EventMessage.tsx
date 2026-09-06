import { View, Text } from "react-native";
// src/features/messages/events/components/EventMessage.tsx

import { useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import { useMessageEvents } from "../hooks/useMessageEvents";
import type { EventId } from "../services/events.service";
import { EventActions } from "./EventActions";
import { EventPreview } from "./EventPreview";

export interface EventMessageProps {
  message: {
    _id: Id<"messages">;
    sharedPublicationId?: Id<"publications">;
    text?: string;
    type?: string;
  };

  /**
   * Peut être fourni directement si le contexte du chat
   * connaît déjà l'ID de l'événement.
   *
   * Sinon, le hook le récupère depuis publication.meta.eventId.
   */
  eventId?: EventId;

  onOpenEvent?: (eventId: EventId) => void;

  onError?: (error: unknown) => void;
}

export function EventMessage({
  message,
  eventId,
  onOpenEvent,
  onError,
}: EventMessageProps) {
  const {
    event,
    eventId: resolvedEventId,
    isLoading,
    setRsvp,
    toggleLike,
    toggleBookmark,
  } = useMessageEvents(message, eventId);

  const [actionLoading, setActionLoading] = useState(false);

  const runAction = async (action: () => Promise<unknown>) => {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);

    try {
      await action();
    } catch (error) {
      onError?.(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{ width: "100%", maxWidth: 540, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "solid", backgroundColor: "#ffffff" }}
      >
        <Text>Chargement de l'événement...</Text></View>
    );
  }

  if (!event || !resolvedEventId) {
    return (
      <View
        style={{ width: "100%", maxWidth: 540, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#fecaca", borderStyle: "solid", backgroundColor: "#ffffff" }}
      >
        <Text>Cet événement n'est plus disponible.</Text></View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        maxWidth: 540,
      }}
    >
      <EventPreview
        event={event}
        disabled={actionLoading}
        onOpen={() => onOpenEvent?.(resolvedEventId)}
        onRsvp={(status) => void runAction(() => setRsvp(status))}
        onLike={() => void runAction(() => toggleLike())}
        onBookmark={() => void runAction(() => toggleBookmark())}
      />

      <View
        style={{ marginTop: 10, paddingVertical: 0, paddingHorizontal: 2 }}
      >
        <EventActions
          currentRsvp={event.myRsvp}
          liked={event.likedByMe}
          bookmarked={event.bookmarkedByMe}
          disabled={actionLoading}
          onRsvp={(status) => runAction(() => setRsvp(status))}
          onLike={() => runAction(() => toggleLike())}
          onBookmark={() => runAction(() => toggleBookmark())}
        />
      </View>
    </View>
  );
}

export default EventMessage;
