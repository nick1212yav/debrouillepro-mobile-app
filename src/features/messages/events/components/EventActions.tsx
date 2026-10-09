import { Pressable, StyleSheet, Text, View } from "react-native";

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
      {onRsvp ? (
        <>
          <Pressable
            disabled={disabled}
            onPress={() => void onRsvp("attending")}
            accessibilityRole="button"
            accessibilityLabel="Participer à l'événement"
            accessibilityState={{
              disabled,
              selected: currentRsvp === "attending",
            }}
            style={({ pressed }) => [
              styles.actionButton,
              currentRsvp === "attending" && styles.attendingBg,
              disabled && styles.disabled,
              pressed && !disabled && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>
              {currentRsvp === "attending" ? "✓ Je participe" : "Participer"}
            </Text>
          </Pressable>

          <Pressable
            disabled={disabled}
            onPress={() => void onRsvp("interested")}
            accessibilityRole="button"
            accessibilityLabel="Marquer l'événement comme intéressant"
            accessibilityState={{
              disabled,
              selected: currentRsvp === "interested",
            }}
            style={({ pressed }) => [
              styles.actionButton,
              currentRsvp === "interested" && styles.interestedBg,
              disabled && styles.disabled,
              pressed && !disabled && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>
              {currentRsvp === "interested" ? "★ Intéressé" : "Intéressé"}
            </Text>
          </Pressable>

          {currentRsvp ? (
            <Pressable
              disabled={disabled}
              onPress={() => void onRsvp("not_going")}
              accessibilityRole="button"
              accessibilityLabel="Ne plus participer à l'événement"
              accessibilityState={{
                disabled,
                selected: currentRsvp === "not_going",
              }}
              style={({ pressed }) => [
                styles.actionButton,
                currentRsvp === "not_going" && styles.notGoingBg,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
              ]}
            >
              <Text style={styles.actionText}>Je ne participe plus</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {onLike ? (
        <Pressable
          disabled={disabled}
          onPress={() => void onLike()}
          accessibilityRole="button"
          accessibilityLabel={
            liked ? "Retirer mon J'aime de l'événement" : "J'aime l'événement"
          }
          accessibilityState={{
            disabled,
            selected: liked,
          }}
          style={({ pressed }) => [
            styles.iconButton,
            liked && styles.activeIconButton,
            disabled && styles.disabled,
            pressed && !disabled && styles.pressed,
          ]}
        >
          <Text style={styles.iconText}>{liked ? "❤️" : "♡"}</Text>
        </Pressable>
      ) : null}

      {onBookmark ? (
        <Pressable
          disabled={disabled}
          onPress={() => void onBookmark()}
          accessibilityRole="button"
          accessibilityLabel={
            bookmarked
              ? "Retirer l'événement des enregistrements"
              : "Enregistrer l'événement"
          }
          accessibilityState={{
            disabled,
            selected: bookmarked,
          }}
          style={({ pressed }) => [
            styles.iconButton,
            bookmarked && styles.activeIconButton,
            disabled && styles.disabled,
            pressed && !disabled && styles.pressed,
          ]}
        >
          <Text style={styles.iconText}>🔖</Text>
        </Pressable>
      ) : null}
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
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  attendingBg: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: "rgba(74,222,128,0.35)",
  },

  interestedBg: {
    backgroundColor: "rgba(245,158,11,0.18)",
    borderColor: "rgba(251,191,36,0.35)",
  },

  notGoingBg: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(248,113,113,0.30)",
  },

  actionText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#ffffff",
  },

  iconButton: {
    minWidth: 42,
    minHeight: 42,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  activeIconButton: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.18)",
  },

  iconText: {
    fontSize: 16,
  },

  disabled: {
    opacity: 0.45,
  },

  pressed: {
    opacity: 0.72,
  },
});

export default EventActions;
