import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// src/features/messages/events/components/EventMessage.tsx

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

  const runAction = async (action: () => Promise<unknown>): Promise<void> => {
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
        style={[styles.container, styles.infoContainer]}
        accessibilityRole="progressbar"
        accessibilityLabel="Chargement de l'événement"
      >
        <Text style={styles.infoText}>Chargement de l'événement...</Text>
      </View>
    );
  }

  if (!event || !resolvedEventId) {
    return (
      <View
        style={[styles.container, styles.errorContainer]}
        accessibilityRole="alert"
      >
        <Text style={styles.infoText}>
          Cet événement n'est plus disponible.
        </Text>
      </View>
    );
  }

  const handleOpenEvent = () => {
    onOpenEvent?.(resolvedEventId);
  };

  const handleRsvp = (status: Parameters<typeof setRsvp>[0]) => {
    void runAction(() => setRsvp(status));
  };

  const handleLike = () => {
    void runAction(() => toggleLike());
  };

  const handleBookmark = () => {
    void runAction(() => toggleBookmark());
  };

  return (
    <View style={styles.wrapper}>
      <EventPreview
        event={event}
        disabled={actionLoading}
        onOpen={handleOpenEvent}
        onRsvp={handleRsvp}
        onLike={handleLike}
        onBookmark={handleBookmark}
      />

      <View style={styles.actionsWrapper}>
        <EventActions
          currentRsvp={event.myRsvp}
          liked={event.likedByMe}
          bookmarked={event.bookmarkedByMe}
          disabled={actionLoading}
          onRsvp={handleRsvp}
          onLike={handleLike}
          onBookmark={handleBookmark}
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
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  infoContainer: {
    borderColor: "rgba(255,255,255,0.10)",
  },

  errorContainer: {
    borderColor: "rgba(248,113,113,0.30)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.70)",
  },

  actionsWrapper: {
    marginTop: 10,
    paddingHorizontal: 2,
  },
});

export default EventMessage;
