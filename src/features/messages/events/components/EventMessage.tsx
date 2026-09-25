import { View, Text, StyleSheet } from "react-native";

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
    if (actionLoading) return;
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
      <View style={[styles.container, styles.infoContainer]}>
        <Text style={styles.infoText}>Chargement de l'événement...</Text>
      </View>
    );
  }

  if (!event || !resolvedEventId) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.infoText}>
          Cet événement n'est plus disponible.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <EventPreview
        event={event}
        disabled={actionLoading}
        onOpen={() => onOpenEvent?.(resolvedEventId)}
        onRsvp={(status) => void runAction(() => setRsvp(status))}
        onLike={() => void runAction(() => toggleLike())}
        onBookmark={() => void runAction(() => toggleBookmark())}
      />
      <View style={styles.actionsWrapper}>
        <EventActions
          currentRsvp={event.myRsvp}
          liked={event.likedByMe}
          bookmarked={event.bookmarkedByMe}
          disabled={actionLoading}
          onRsvp={(status) => void runAction(() => setRsvp(status))}
          onLike={() => void runAction(() => toggleLike())}
          onBookmark={() => void runAction(() => toggleBookmark())}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 540,
  },
  container: {
    width: "100%",
    maxWidth: 540,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  infoContainer: {
    borderColor: "#e5e7eb",
  },
  errorContainer: {
    borderColor: "#fecaca",
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
  },
  actionsWrapper: {
    marginTop: 10,
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
});

export default EventMessage;