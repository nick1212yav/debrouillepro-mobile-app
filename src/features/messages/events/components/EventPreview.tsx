import { View, Pressable, Image, Text, StyleSheet } from "react-native";

// src/features/messages/events/components/EventPreview.tsx

import type { MessageEvent } from "../services/events.service";

export interface EventPreviewProps {
  event: MessageEvent;
  onOpen?: (event: MessageEvent) => void;
  onRsvp?: (status: "attending" | "interested" | "not_going") => void | Promise<void>;
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
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
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
          disabled={disabled}
          style={styles.coverPressable}
        >
          <Image
            style={styles.coverImage}
            source={{ uri: event.coverImage }}
            accessibilityLabel={event.title}
          />
        </Pressable>
      ) : null}

      <View style={styles.body}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryBadge}>{category}</Text>
          {event.status === "cancelled" && (
            <Text style={styles.cancelledBadge}>Annulé</Text>
          )}
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {event.description}
        </Text>

        <View style={styles.metaBlock}>
          <Text style={styles.metaLine}>
            📅 <Text style={styles.metaBold}>{formatDate(event.startDate)}</Text>
            {" · "}{formatTime(event.startDate)}
          </Text>
          <Text style={styles.metaLine}>
            📍 {event.location}
            {event.address ? ` · ${event.address}` : ""}
          </Text>
          <Text style={styles.metaLine}>
            {event.isFree ? "🎟️ Gratuit" : `🎟️ ${event.price ?? "Payant"}`}
          </Text>
        </View>

        {event.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {event.tags.slice(0, 6).map((tag) => (
              <Text key={tag} style={styles.tagBadge}>#{tag}</Text>
            ))}
          </View>
        )}

        <View style={styles.countsRow}>
          <Text style={styles.countText}>👥 {attendingCount} participant(s)</Text>
          <Text style={styles.countText}>⭐ {interestedCount} intéressé(s)</Text>
        </View>

        <View style={styles.buttonsRow}>
          {onRsvp && (
            <Pressable
              disabled={disabled}
              onPress={() => void onRsvp("attending")}
              style={[
                styles.primaryButton,
                event.isAttending && styles.primaryButtonActive,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {event.isAttending ? "✓ Participant" : "Participer"}
              </Text>
            </Pressable>
          )}
          {onOpen && (
            <Pressable
              disabled={disabled}
              onPress={() => onOpen(event)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Voir l'événement</Text>
            </Pressable>
          )}
        </View>

        {(onLike || onBookmark) && (
          <View style={styles.iconRow}>
            {onLike && (
              <Pressable
                disabled={disabled}
                onPress={() => void onLike()}
                accessibilityLabel="J'aime"
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>{event.likedByMe ? "❤️" : "♡"}</Text>
              </Pressable>
            )}
            {onBookmark && (
              <Pressable
                disabled={disabled}
                onPress={() => void onBookmark()}
                accessibilityLabel="Enregistrer"
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>{event.bookmarkedByMe ? "🔖" : "🔖"}</Text>
              </Pressable>
            )}
          </View>
        )}

        {event.authorName && (
          <View style={styles.authorRow}>
            {event.authorAvatar ? (
              <Image
                style={styles.authorAvatar}
                source={{ uri: event.authorAvatar }}
                accessibilityLabel=""
              />
            ) : (
              <View style={styles.authorPlaceholder}>
                <Text style={styles.authorInitial}>
                  {event.authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.authorText}>
              Organisé par <Text style={styles.authorBold}>{event.authorName}</Text>
            </Text>
          </View>
        )}
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
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  coverPressable: {
    width: "100%",
  },
  coverImage: {
    width: "100%",
    height: 210,
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
    backgroundColor: "#f1f5f9",
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  cancelledBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
    color: "#111827",
  },
  description: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
  },
  metaBlock: {
    gap: 8,
    marginTop: 16,
  },
  metaLine: {
    fontSize: 14,
    color: "#4b5563",
  },
  metaBold: {
    fontWeight: "700",
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
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: 12,
    color: "#4b5563",
  },
  countsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 15,
  },
  countText: {
    fontSize: 12,
    color: "#6b7280",
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
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonActive: {
    backgroundColor: "#dcfce7",
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#ffffff",
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#111827",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  iconButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 9,
    backgroundColor: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: 10,
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
    borderTopColor: "#f1f5f9",
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
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  authorInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  authorText: {
    fontSize: 12,
    color: "#64748b",
  },
  authorBold: {
    fontWeight: "700",
    color: "#111827",
  },
});

export default EventPreview;