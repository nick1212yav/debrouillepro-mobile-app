import { View, Text, Pressable, Image } from "react-native";
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
    <View
      style={{ width: "100%", maxWidth: 540, overflow: "hidden", borderRadius: 18, borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "solid", backgroundColor: "#ffffff" }}
    >
      {event.coverImage ? (
        <Pressable
         
          onPress={() => onOpen?.(event)}
          disabled={disabled}
          style={{ display: "block", width: "100%", padding: 0, borderWidth: 0, backgroundColor: "transparent" }}
        >
          <Image
           
           
            style={{ display: "block", width: "100%", height: 210 }}
           source={{ uri: event.coverImage }} accessibilityLabel={event.title}/>
        </Pressable>
      ) : null}

      <View style={{ padding: 16 }}>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <Text
            style={{ paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, backgroundColor: "#f1f5f9", fontSize: 12, fontWeight: 700 }}
          >
            {category}
          </Text>

          {event.status === "cancelled" && (
            <Text
              style={{ paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, backgroundColor: "#fee2e2", color: "#b91c1c", fontSize: 12, fontWeight: 700 }}
            >
              Annulé
            </Text>
          )}
        </View>

        <Text
          style={{
            margin: 0,
            fontSize: 19,
            lineHeight: 1.3,
            fontWeight: 800,
            color: "#111827",
          }}
        >
          {event.title}
        </Text>

        <Text
          style={{
            margin: "8px 0 0",
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.description}
        </Text>

        <View
          style={{ display: "grid", gap: 8, marginTop: 16 }}
        >
          <View>
            <Text>📅</Text><strong>{formatDate(event.startDate)}</strong>
            {" · "}
            {formatTime(event.startDate)}
          </View>

          <View>
            <Text>📍</Text>{event.location}
            {event.address ? ` · ${event.address}` : ""}
          </View>

          <View>
            {event.isFree ? "🎟️ Gratuit" : `🎟️ ${event.price ?? "Payant"}`}
          </View>
        </View>

        {event.tags.length > 0 && (
          <View
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 14,
            }}
          >
            {event.tags.slice(0, 6).map((tag) => (
              <Text
                key={tag}
                style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", backgroundColor: "#f8fafc", fontSize: 12 }}
              >
                #{tag}
              </Text>
            ))}
          </View>
        )}

        <View
          style={{ display: "flex", gap: 14, marginTop: 15 }}
        >
          <Text>👥 {attendingCount} participant(s)</Text>

          <Text>⭐ {interestedCount} intéressé(s)</Text>
        </View>

        <View
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
          }}
        >
          {onRsvp && (
            <Pressable
              type="button"
              disabled={disabled}
              onPress={() => void onRsvp("attending")}
              style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 0, borderRadius: 10, backgroundColor: event.isAttending ? "#dcfce7" : "#111827" }}
            >
              {event.isAttending ? "✓ Participant" : "Participer"}
            </Pressable>
          )}

          {onOpen && (
            <Pressable
              type="button"
              disabled={disabled}
              onPress={() => onOpen(event)}
              style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "solid", borderRadius: 10, backgroundColor: "#ffffff" }}
            >
              <Text>Voir l'événement</Text></Pressable>
          )}
        </View>

        {(onLike || onBookmark) && (
          <View
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 10,
            }}
          >
            {onLike && (
              <Pressable
                type="button"
                disabled={disabled}
                onPress={() => void onLike()}
                accessibilityLabel="J'aime"
                style={{ borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 9, backgroundColor: "#ffffff", paddingVertical: 7, paddingHorizontal: 10 }}
              >
                {event.likedByMe ? "❤️" : "♡"}
              </Pressable>
            )}

            {onBookmark && (
              <Pressable
                type="button"
                disabled={disabled}
                onPress={() => void onBookmark()}
                accessibilityLabel="Enregistrer"
                style={{ borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 9, backgroundColor: "#ffffff", paddingVertical: 7, paddingHorizontal: 10 }}
              >
                {event.bookmarkedByMe ? "🔖" : "🏷️"}
              </Pressable>
            )}
          </View>
        )}

        {event.authorName && (
          <View
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", borderTopStyle: "solid" }}
          >
            {event.authorAvatar ? (
              <Image
               
               
                style={{ width: 28, height: 28, borderRadius: "50%" }}
               source={{ uri: event.authorAvatar }} accessibilityLabel=""/>
            ) : (
              <View
                style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", backgroundColor: "#f1f5f9" }}
              >
                {event.authorName.charAt(0).toUpperCase()}
              </View>
            )}

            <Text
              style={{
                fontSize: 12,
                color: "#64748b",
              }}
            >
              <Text>Organisé par</Text><strong>{event.authorName}</strong>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
