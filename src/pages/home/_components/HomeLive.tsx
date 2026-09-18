// src/pages/home/_components/HomeLive.tsx

import React, { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { ArrowRight, Radio, Users, Video } from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";

export interface HomeLiveProps {
  onNavigate: (page: string) => void;
}

type LiveStream = NonNullable<
  ReturnType<typeof useQuery<typeof api.liveStreams.listLiveStreams>>
>[number];

function getStreamTitle(stream: LiveStream): string {
  const title = stream.title?.trim();

  return title && title.length > 0 ? title : "Live en cours";
}

function getThumbnail(stream: LiveStream): string | undefined {
  const thumbnail = stream.thumbnailUrl?.trim();

  return thumbnail && thumbnail.length > 0 ? thumbnail : undefined;
}

function getHostName(stream: LiveStream): string {
  const hostName = stream.hostName?.trim();

  return hostName && hostName.length > 0 ? hostName : "Direct en cours";
}

function formatViewerCount(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "";
  }

  if (value < 1_000) {
    return String(value);
  }

  if (value < 1_000_000) {
    const thousands = value / 1_000;

    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1)}k`;
  }

  const millions = value / 1_000_000;

  return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
}

const LiveSkeleton = memo(function LiveSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Chargement du direct"
      style={styles.card}
    >
      <View style={styles.skeletonThumbnail}>
        <ActivityIndicator size="small" color="#FDA4AF" />
      </View>

      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLiveBadge} />
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSubtitle} />
      </View>

      <View style={styles.skeletonViewers} />
    </View>
  );
});

interface LiveCardProps {
  stream: LiveStream;
  onPress: () => void;
}

const LiveCard = memo(function LiveCard({ stream, onPress }: LiveCardProps) {
  const title = getStreamTitle(stream);
  const thumbnail = getThumbnail(stream);
  const hostName = getHostName(stream);
  const viewers = formatViewerCount(stream.viewerCount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Direct : ${title}`}
      accessibilityHint="Ouvre le direct actuellement en cours"
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.cardPressed : styles.card)}
    >
      {/* ─────────────────────────────────────
          THUMBNAIL
      ───────────────────────────────────── */}
      <View style={styles.thumbnailContainer}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            accessibilityLabel=""
            resizeMode="cover"
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Video size={25} color="#CBD5E1" strokeWidth={1.7} />
          </View>
        )}

        <View style={styles.thumbnailLiveBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.thumbnailLiveText}>LIVE</Text>
        </View>
      </View>

      {/* ─────────────────────────────────────
          CONTENT
      ───────────────────────────────────── */}
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {title}
        </Text>

        <Text numberOfLines={1} style={styles.host}>
          {hostName}
        </Text>
      </View>

      {/* ─────────────────────────────────────
          VIEWERS
      ───────────────────────────────────── */}
      {viewers ? (
        <View style={styles.viewerColumn}>
          <Users size={15} color="#FDA4AF" strokeWidth={2} />

          <Text numberOfLines={1} style={styles.viewerText}>
            {viewers}
          </Text>

          <Text style={styles.viewerLabel}>viewers</Text>
        </View>
      ) : (
        <View style={styles.viewerColumn}>
          <Radio size={15} color="#64748B" strokeWidth={1.8} />

          <Text style={styles.viewerLabel}>LIVE</Text>
        </View>
      )}
    </Pressable>
  );
});

const LiveEmptyState = memo(function LiveEmptyState() {
  return (
    <View
      accessible
      accessibilityLabel="Aucun direct actuellement"
      style={styles.emptyCard}
    >
      <View style={styles.emptyIcon}>
        <Radio size={21} color="#94A3B8" strokeWidth={1.8} />
      </View>

      <View style={styles.emptyContent}>
        <Text style={styles.emptyTitle}>Aucun live maintenant</Text>

        <Text style={styles.emptyDescription}>
          Les prochains directs apparaîtront ici dès qu’ils seront en cours.
        </Text>
      </View>
    </View>
  );
});

function HomeLiveComponent({ onNavigate }: HomeLiveProps) {
  const streams = useQuery(api.liveStreams.listLiveStreams, {
    status: "live",
  });

  const handleOpenLive = useCallback(
    (streamId: LiveStream["_id"]) => {
      onNavigate(`live:${streamId}`);
    },
    [onNavigate],
  );

  if (streams === undefined) {
    return (
      <View style={styles.section}>
        <SectionHeader />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          scrollEnabled={false}
        >
          <LiveSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (streams.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader />
        <LiveEmptyState />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader showMore />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {streams.map((stream) => (
          <LiveCard
            key={stream._id}
            stream={stream}
            onPress={() => handleOpenLive(stream._id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface SectionHeaderProps {
  showMore?: boolean;
}

const SectionHeader = memo(function SectionHeader({
  showMore = false,
}: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <View style={styles.headerIcon}>
          <Radio size={16} color="#FDA4AF" strokeWidth={2} />
        </View>

        <View>
          <View style={styles.headerLabelRow}>
            <Text style={styles.eyebrow}>MAINTENANT</Text>

            <View style={styles.statusDot} />
          </View>

          <Text style={styles.sectionTitle}>Live maintenant</Text>
        </View>
      </View>

      {showMore ? (
        <View style={styles.liveNowPill}>
          <Text style={styles.liveNowText}>EN DIRECT</Text>

          <ArrowRight size={14} color="#FDA4AF" strokeWidth={2.2} />
        </View>
      ) : null}
    </View>
  );
});

export const HomeLive = memo(HomeLiveComponent);

HomeLive.displayName = "HomeLive";

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },

  // ─────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────

  header: {
    minHeight: 46,
    marginBottom: 11,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 34,
    height: 34,
    marginRight: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,63,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.13)",
  },

  headerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  eyebrow: {
    color: "#64748B",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "800",
    letterSpacing: 1.15,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FB7185",
  },

  sectionTitle: {
    marginTop: 1,
    color: "#F8FAFC",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: -0.45,
  },

  liveNowPill: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(244,63,94,0.07)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.11)",
  },

  liveNowText: {
    color: "#FDA4AF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.65,
  },

  // ─────────────────────────────────────────
  // HORIZONTAL FEED
  // ─────────────────────────────────────────

  row: {
    paddingHorizontal: 16,
    paddingRight: 6,
  },

  // ─────────────────────────────────────────
  // LIVE CARD — HORIZONTAL
  // ─────────────────────────────────────────

  card: {
    width: 312,
    height: 96,
    marginRight: 10,
    padding: 11,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  cardPressed: {
    width: 312,
    height: 96,
    marginRight: 10,
    padding: 11,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.20)",
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },

  // ─────────────────────────────────────────
  // THUMBNAIL
  // ─────────────────────────────────────────

  thumbnailContainer: {
    width: 72,
    height: 72,
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
  },

  thumbnailFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },

  thumbnailLiveBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    minHeight: 18,
    paddingHorizontal: 5,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(190,24,93,0.90)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  thumbnailLiveText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  // ─────────────────────────────────────────
  // BODY
  // ─────────────────────────────────────────

  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 8,
    justifyContent: "center",
  },

  title: {
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    letterSpacing: -0.15,
  },

  host: {
    marginTop: 5,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },

  // ─────────────────────────────────────────
  // VIEWERS
  // ─────────────────────────────────────────

  viewerColumn: {
    width: 48,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  viewerText: {
    marginTop: 4,
    color: "#F8FAFC",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
  },

  viewerLabel: {
    marginTop: 1,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ─────────────────────────────────────────
  // EMPTY STATE
  // ─────────────────────────────────────────

  emptyCard: {
    minHeight: 86,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyIcon: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148,163,184,0.08)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.09)",
  },

  emptyContent: {
    flex: 1,
    minWidth: 0,
  },

  emptyTitle: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },

  emptyDescription: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },

  // ─────────────────────────────────────────
  // SKELETON
  // ─────────────────────────────────────────

  skeletonThumbnail: {
    width: 72,
    height: 72,
    flexShrink: 0,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  skeletonBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 8,
    justifyContent: "center",
  },

  skeletonLiveBadge: {
    width: 42,
    height: 15,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  skeletonTitle: {
    width: "82%",
    height: 10,
    marginTop: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonSubtitle: {
    width: "52%",
    height: 8,
    marginTop: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  skeletonViewers: {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
});
