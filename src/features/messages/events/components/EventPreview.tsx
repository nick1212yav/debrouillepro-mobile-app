import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// src/features/messages/events/components/EventPreview.tsx

import type { MessageEvent } from "../services/events.service";

export interface EventPreviewProps {
  event: MessageEvent;
  onOpen?: (event: MessageEvent) => void;
  onRsvp?: (
    status: "attending" | "interested" | "not_going",
  ) => void | Promise<void>;
  onLike?: () => void | Promise<void>;
  onBookmark?: () => void | Promise<void>;
  disabled?: boolean;
}

const categoryLabels: Record<string, string> = {
  culturel: "Culture",
  sportif: "Sport",
  religieux: "Religion",
  professionnel: "Professionnel",
  communautaire: "Communauté",
  formation: "Formation",
  festival: "Festival",
  autre: "Événement",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function EventPreview({
  event,
  onOpen,
  onRsvp,
  onLike,
  onBookmark,
  disabled = false,
}: EventPreviewProps) {
  const category = categoryLabels[event.category] ?? event.category;

  const attendingCount = event.attendingCount ?? 0;
  const interestedCount = event.interestedCount ?? 0;

  return (
    <View style={styles.container}>
      {event.coverImage ? (
        <Pressable
          onPress={() => onOpen?.(event)}
          disabled={disabled || !onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Ouvrir l'événement ${event.title}`}
          accessibilityState={{ disabled: disabled || !onOpen }}
          style={({ pressed }) => [
            styles.coverPressable,
            pressed && !disabled && styles.pressed,
          ]}
        >
          <Image
            style={styles.coverImage}
            source={{ uri: event.coverImage }}
            accessibilityLabel={`Image de couverture : ${event.title}`}
          />
        </Pressable>
      ) : null}

      <View style={styles.body}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryBadge}>{category}</Text>

          {event.status === "cancelled" ? (
            <Text
              style={styles.cancelledBadge}
              accessibilityLabel="Événement annulé"
            >
              Annulé
            </Text>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {event.title}
        </Text>

        <Text style={styles.description} numberOfLines={3}>
          {event.description}
        </Text>

        <View style={styles.metaBlock}>
          <Text style={styles.metaLine}>
            📅{" "}
            <Text style={styles.metaBold}>{formatDate(event.startDate)}</Text>
            {" · "}
            {formatTime(event.startDate)}
          </Text>

          <Text style={styles.metaLine}>
            📍 {event.location}
            {event.address ? ` · ${event.address}` : ""}
          </Text>

          <Text style={styles.metaLine}>
            {event.isFree ? "🎟️ Gratuit" : `🎟️ ${event.price ?? "Payant"}`}
          </Text>
        </View>

        {event.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {event.tags.slice(0, 6).map((tag) => (
              <Text key={tag} style={styles.tagBadge}>
                #{tag}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.countsRow}>
          <Text style={styles.countText}>
            👥 {attendingCount} participant(s)
          </Text>

          <Text style={styles.countText}>
            ⭐ {interestedCount} intéressé(s)
          </Text>
        </View>

        <View style={styles.buttonsRow}>
          {onRsvp ? (
            <Pressable
              disabled={disabled}
              onPress={() => void onRsvp("attending")}
              accessibilityRole="button"
              accessibilityLabel={
                event.isAttending
                  ? "Participant à l'événement"
                  : "Participer à l'événement"
              }
              accessibilityState={{
                disabled,
                selected: event.isAttending,
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                event.isAttending && styles.primaryButtonActive,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  event.isAttending && styles.primaryButtonActiveText,
                ]}
              >
                {event.isAttending ? "✓ Participant" : "Participer"}
              </Text>
            </Pressable>
          ) : null}

          {onOpen ? (
            <Pressable
              disabled={disabled}
              onPress={() => onOpen(event)}
              accessibilityRole="button"
              accessibilityLabel="Voir l'événement"
              accessibilityState={{ disabled }}
              style={({ pressed }) => [
                styles.secondaryButton,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Voir l'événement</Text>
            </Pressable>
          ) : null}
        </View>

        {onLike || onBookmark ? (
          <View style={styles.iconRow}>
            {onLike ? (
              <Pressable
                disabled={disabled}
                onPress={() => void onLike()}
                accessibilityRole="button"
                accessibilityLabel={
                  event.likedByMe ? "Retirer mon J'aime" : "J'aime l'événement"
                }
                accessibilityState={{
                  disabled,
                  selected: event.likedByMe,
                }}
                style={({ pressed }) => [
                  styles.iconButton,
                  event.likedByMe && styles.iconButtonActive,
                  disabled && styles.disabled,
                  pressed && !disabled && styles.pressed,
                ]}
              >
                <Text style={styles.iconText}>
                  {event.likedByMe ? "❤️" : "♡"}
                </Text>
              </Pressable>
            ) : null}

            {onBookmark ? (
              <Pressable
                disabled={disabled}
                onPress={() => void onBookmark()}
                accessibilityRole="button"
                accessibilityLabel={
                  event.bookmarkedByMe
                    ? "Retirer l'événement des enregistrements"
                    : "Enregistrer l'événement"
                }
                accessibilityState={{
                  disabled,
                  selected: event.bookmarkedByMe,
                }}
                style={({ pressed }) => [
                  styles.iconButton,
                  event.bookmarkedByMe && styles.iconButtonActive,
                  disabled && styles.disabled,
                  pressed && !disabled && styles.pressed,
                ]}
              >
                <Text style={styles.iconText}>🔖</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {event.authorName ? (
          <View style={styles.authorRow}>
            {event.authorAvatar ? (
              <Image
                style={styles.authorAvatar}
                source={{ uri: event.authorAvatar }}
                accessibilityLabel={`Avatar de ${event.authorName}`}
              />
            ) : (
              <View
                style={styles.authorPlaceholder}
                accessibilityLabel={`Avatar de ${event.authorName}`}
              >
                <Text style={styles.authorInitial}>
                  {event.authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.authorText}>
              Organisé par{" "}
              <Text style={styles.authorBold}>{event.authorName}</Text>
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 540,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  coverPressable: {
    width: "100%",
  },

  coverImage: {
    width: "100%",
    height: 210,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  body: {
    padding: 16,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  categoryBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.18)",
    fontSize: 12,
    fontWeight: "700",
    color: "#c7d2fe",
  },

  cancelledBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.15)",
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
  },

  title: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
    color: "#ffffff",
  },

  description: {
    marginTop: 8,
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 21,
  },

  metaBlock: {
    gap: 8,
    marginTop: 16,
  },

  metaLine: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.68)",
  },

  metaBold: {
    fontWeight: "700",
    color: "#ffffff",
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },

  tagBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    fontSize: 12,
    color: "rgba(255,255,255,0.62)",
  },

  countsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 15,
  },

  countText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.48)",
  },

  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonActive: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.35)",
  },

  primaryButtonText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#ffffff",
  },

  primaryButtonActiveText: {
    color: "#86efac",
  },

  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#ffffff",
  },

  iconRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },

  iconButton: {
    minWidth: 42,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.18)",
  },

  iconText: {
    fontSize: 15,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  authorPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(99,102,241,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  authorInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c7d2fe",
  },

  authorText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.50)",
  },

  authorBold: {
    fontWeight: "700",
    color: "#ffffff",
  },

  disabled: {
    opacity: 0.45,
  },

  pressed: {
    opacity: 0.72,
  },
});

export default EventPreview;
