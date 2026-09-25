import { Pressable, View } from "react-native";

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
    <View style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}>
      {onRsvp && (
        <>
          <Pressable disabled={disabled} onPress={() => void onRsvp("attending")} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "solid", backgroundColor: currentRsvp === "attending" ? "#dcfce7" : "#ffffff", fontWeight: 700 }}>
            {currentRsvp === "attending" ? "✓ Je participe" : "Participer"}
          </Pressable>

          <Pressable disabled={disabled} onPress={() => void onRsvp("interested")} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "solid", backgroundColor: currentRsvp === "interested" ? "#fef3c7" : "#ffffff", fontWeight: 700 }}>
            {currentRsvp === "interested" ? "★ Intéressé" : "Intéressé"}
          </Pressable>

          {currentRsvp && (
            <Pressable disabled={disabled} onPress={() => void onRsvp("not_going")} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", backgroundColor: "#ffffff" }}>
              Je ne participe plus
            </Pressable>
          )}
        </>
      )}

      {onLike && (
        <Pressable disabled={disabled} onPress={() => void onLike()} accessibilityLabel="J'aime l'événement" style={{ paddingVertical: 9, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", backgroundColor: "#ffffff", fontSize: 16 }}>
          {liked ? "❤️" : "♡"}
        </Pressable>
      )}

      {onBookmark && (
        <Pressable disabled={disabled} onPress={() => void onBookmark()} accessibilityLabel="Enregistrer l'événement" style={{ paddingVertical: 9, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", backgroundColor: "#ffffff", fontSize: 16 }}>
          {bookmarked ? "🔖" : "🏷️"}
        </Pressable>
      )}
    </View>
  );
}
