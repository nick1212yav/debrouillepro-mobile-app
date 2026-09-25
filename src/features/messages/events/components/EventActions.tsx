import { View, Text, Pressable, StyleSheet } from "react-native";

// src/features/messages/events/components/EventActions.tsx

import type { EventRsvpStatus } from "../services/events.service";

export interface EventActionsProps {
  currentRsvp?: EventRsvpStatus | null;
  liked?: boolean;
  bookmarked?: boolean;
  disabled?: boolean;
  onRsvp?: (status: EventRsvpStatus) => void | Promise<void>;
  onLike?: () => void | Promise<void>;
  onBookmark?: () => void | Promise<void>;
}

export function EventActions({
  currentRsvp,
  liked = false,
  bookmarked = false,
  disabled = false,
  onRsvp,
  onLike,
  onBookmark,
}: EventActionsProps) {
  return (
    <View style={styles.container}>
      {onRsvp && (
        <>
          <Pressable
            disabled={disabled}
            onPress={() => void onRsvp("attending")}
            style={[
              styles.actionButton,
              currentRsvp === "attending" && styles.attendingBg,
            ]}
          >
            <Text style={styles.actionText}>
              {currentRsvp === "attending" ? "✓ Je participe" : "Participer"}
            </Text>
          </Pressable>

          <Pressable
            disabled={disabled}
            onPress={() => void onRsvp("interested")}
            style={[
              styles.actionButton,
              currentRsvp === "interested" && styles.interestedBg,
            ]}
          >
            <Text style={styles.actionText}>
              {currentRsvp === "interested" ? "★ Intéressé" : "Intéressé"}
            </Text>
          </Pressable>

          {currentRsvp && (
            <Pressable
              disabled={disabled}
              onPress={() => void onRsvp("not_going")}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Je ne participe plus</Text>
            </Pressable>
          )}
        </>
      )}

      {onLike && (
        <Pressable
          disabled={disabled}
          onPress={() => void onLike()}
          accessibilityLabel="J'aime l'événement"
          style={styles.iconButton}
        >
          <Text style={styles.iconText}>{liked ? "❤️" : "♡"}</Text>
        </Pressable>
      )}

      {onBookmark && (
        <Pressable
          disabled={disabled}
          onPress={() => void onBookmark()}
          accessibilityLabel="Enregistrer l'événement"
          style={styles.iconButton}
        >
          <Text style={styles.iconText}>{bookmarked ? "🔖" : "🔖"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  attendingBg: {
    backgroundColor: "#dcfce7",
  },
  interestedBg: {
    backgroundColor: "#fef3c7",
  },
  actionText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#111827",
  },
  iconButton: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  iconText: {
    fontSize: 16,
  },
});

export default EventActions;