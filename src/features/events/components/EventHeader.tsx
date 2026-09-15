// src/features/events/components/EventHeader.tsx
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Heart,
} from "lucide-react-native";

import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  STATUS_LABELS,
} from "../types";
import type { Event } from "../types";

interface Props {
  event: Event;
  onLike?: () => void;
  onShare?: () => void;
  onFollow?: () => void;
}

export function EventHeader({ event, onLike, onShare, onFollow }: Props) {
  const router = useRouter();

  const categoryColor = CATEGORY_COLORS[event.category] || "#8B5CF6";
  const statusCfg = STATUS_LABELS[event.status] || STATUS_LABELS.upcoming;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAuthorPress = () => {
    if (event.authorId) {
      router.push(`/profile/${event.authorId}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header : catégorie + actions */}
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.categoryIconWrapper,
              { backgroundColor: `${categoryColor}22` },
            ]}
          >
            <Text style={styles.categoryEmoji}>
              {CATEGORY_ICONS[event.category]}
            </Text>
          </View>

          <View style={styles.titleColumn}>
            <View style={styles.categoryRow}>
              <Text style={[styles.categoryLabel, { color: categoryColor }]}>
                {CATEGORY_LABELS[event.category]}
              </Text>
              <Text
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusCfg.bg, color: statusCfg.color },
                ]}
              >
                {statusCfg.label}
              </Text>
            </View>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onLike}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: event.likedByMe
                  ? "rgba(236,72,153,0.15)"
                  : "rgba(255,255,255,0.06)",
              },
              pressed && styles.pressed,
            ]}
            hitSlop={6}
            accessibilityLabel="Aimer"
          >
            <Heart
              size={18}
              color={event.likedByMe ? "#EC4899" : "rgba(255,255,255,0.4)"}
              fill={event.likedByMe ? "#EC4899" : "transparent"}
            />
          </Pressable>

          <Pressable
            onPress={onShare}
            style={({ pressed }) => [
              styles.iconButton,
              styles.iconButtonNeutral,
              pressed && styles.pressed,
            ]}
            hitSlop={6}
            accessibilityLabel="Partager"
          >
            <Share2 size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>
      </View>

      {/* Info cards : date / heure / lieu / participants */}
      <View style={styles.infoGrid}>
        <InfoCard
          icon={<Calendar size={14} color="#A78BFA" />}
          label="Date"
          value={formatDate(event.startDate)}
        />
        <InfoCard
          icon={<Clock size={14} color="#F472B6" />}
          label="Heure"
          value={formatTime(event.startDate)}
        />
        <InfoCard
          icon={<MapPin size={14} color="#FB923C" />}
          label="Lieu"
          value={event.location}
          numberOfLines={1}
        />
        <InfoCard
          icon={<Users size={14} color="#4ADE80" />}
          label="Participants"
          value={String(event.attendingCount)}
        />
      </View>

      {/* Organisateur */}
      {event.authorName && (
        <View style={styles.authorCard}>
          {event.authorAvatar ? (
            <Image
              source={{ uri: event.authorAvatar }}
              style={styles.avatar}
              accessibilityLabel={event.authorName}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { backgroundColor: `${categoryColor}33` },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {event.authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.authorInfo}>
            <Pressable onPress={handleAuthorPress} hitSlop={4}>
              <Text style={styles.authorName}>{event.authorName}</Text>
            </Pressable>
            <Text style={styles.authorRole}>Organisateur</Text>
          </View>

          <Pressable
            onPress={onFollow}
            style={({ pressed }) => [
              styles.followButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Suivre l'organisateur"
          >
            <Text style={styles.followButtonText}>Suivre</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── InfoCard ─────────────────────────────────────────────────────────────
function InfoCard({
  icon,
  label,
  value,
  numberOfLines,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoCardIcon}>{icon}</View>
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue} numberOfLines={numberOfLines}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEmoji: {
    fontSize: 22,
  },
  titleColumn: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontWeight: "700",
    overflow: "hidden",
  },
  eventTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonNeutral: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: 140,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },
  infoCardIcon: {
    marginBottom: 2,
  },
  infoCardLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
  },
  infoCardValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  authorRole: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#8B5CF6",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
