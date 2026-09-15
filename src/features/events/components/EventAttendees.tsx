// src/features/events/components/EventAttendees.tsx
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
}

export function EventAttendees({ event }: Props) {
  const router = useRouter();
  const attendees = event.attendees || [];

  if (attendees.length === 0) {
    return null;
  }

  const displayCount = Math.min(attendees.length, 12);
  const remaining = attendees.length - displayCount;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Participants ({attendees.length})</Text>

      <View style={styles.attendeesRow}>
        {attendees.slice(0, displayCount).map((attendee) => (
          <Pressable
            key={attendee.userId}
            onPress={() => router.push(`/profile/${attendee.userId}`)}
            style={({ pressed }) => [
              styles.attendeeChip,
              pressed && styles.pressed,
            ]}
          >
            {attendee.avatar ? (
              <Image
                source={{ uri: attendee.avatar }}
                style={styles.avatar}
                accessibilityLabel={attendee.name}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {attendee.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.name}>{attendee.name}</Text>

            {attendee.status === "attending" && (
              <CheckCircle size={10} color="#4ADE80" />
            )}
          </Pressable>
        ))}

        {remaining > 0 && (
          <View style={styles.remainingChip}>
            <Text style={styles.remainingText}>+{remaining}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  attendeesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attendeeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.2)",
  },
  avatarInitial: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "700",
  },
  name: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  remainingChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  remainingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
});
