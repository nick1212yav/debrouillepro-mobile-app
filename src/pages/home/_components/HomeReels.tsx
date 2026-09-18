// src/pages/home/_components/HomeReels.tsx

import React, { memo, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePaginatedQuery } from "convex/react";
import { ArrowRight, Eye, Flame, Play, Sparkles } from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";

export interface HomeReelsProps {
  onNavigate: (page: string) => void;
  city?: string;
}

const PAGE_SIZE = 8;

type ReelItem = {
  _id: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  viewCount?: number;
};

function getDisplayTitle(
  title: string | undefined,
  description: string | undefined,
): string {
  const normalizedTitle = title?.trim();

  if (normalizedTitle) {
    return normalizedTitle;
  }

  const normalizedDescription = description?.trim();

  if (normalizedDescription) {
    return normalizedDescription;
  }

  return "Découvrir ce Reel";
}

function formatViews(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
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

/* -------------------------------------------------------------------------- */
/* Reel card                                                                  */
/* -------------------------------------------------------------------------- */

interface ReelCardProps {
  item: ReelItem;
  onPress: () => void;
}

const ReelCard = memo(function ReelCard({ item, onPress }: ReelCardProps) {
  const title = getDisplayTitle(item.title, item.description);
  const views = formatViews(item.viewCount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Ouvre ce Reel"
      onPress={onPress}
      style={({ pressed }) =>
        pressed ? styles.reelCardPressed : styles.reelCard
      }
    >
      <View style={styles.media}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            accessibilityLabel={title}
            resizeMode="cover"
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.mediaFallback}>
            <Sparkles size={25} color="#CBD5E1" strokeWidth={1.8} />
          </View>
        )}

        <View style={styles.mediaShade} />

        <View style={styles.playButton}>
          <Play size={19} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.8} />
        </View>

        {views ? (
          <View style={styles.viewsBadge}>
            <Eye size={12} color="#FFFFFF" strokeWidth={2} />

            <Text style={styles.viewsText}>{views}</Text>
          </View>
        ) : null}

        <View style={styles.reelLabel}>
          <Text style={styles.reelLabelText}>REEL</Text>
        </View>

        <View style={styles.caption}>
          <Text numberOfLines={2} style={styles.captionText}>
            {title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

const ReelSkeleton = memo(function ReelSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Chargement des Reels"
      style={styles.reelCard}
    >
      <View style={styles.skeletonMedia}>
        <View style={styles.skeletonPlay} />
        <View style={styles.skeletonCaptionLarge} />
        <View style={styles.skeletonCaptionSmall} />
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Section header                                                             */
/* -------------------------------------------------------------------------- */

interface SectionHeaderProps {
  title: string;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
}

const SectionHeader = memo(function SectionHeader({
  title,
  onLoadMore,
  canLoadMore = false,
}: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <View style={styles.sectionIcon}>
          <Flame size={15} color="#FBBF24" fill="#FBBF24" strokeWidth={1.8} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>EN CE MOMENT</Text>

          <Text numberOfLines={1} style={styles.sectionTitle}>
            {title}
          </Text>
        </View>
      </View>

      {canLoadMore && onLoadMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir plus de Reels"
          accessibilityHint="Charge davantage de Reels"
          onPress={onLoadMore}
          style={({ pressed }) =>
            pressed ? styles.seeMorePressed : styles.seeMoreButton
          }
        >
          <Text style={styles.seeMoreText}>Plus</Text>

          <ArrowRight size={15} color="#A5B4FC" strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

function HomeReelsComponent({ onNavigate, city }: HomeReelsProps) {
  /**
   * La ville est normalisée avant la query Convex.
   *
   * Si elle existe :
   *   → shortVideos.list({ city })
   *   → backend filtré sur city + isActive
   *
   * Si elle n'existe pas :
   *   → shortVideos.list({})
   *   → feed global honnête
   */
  const normalizedCity = useMemo(() => {
    const value = city?.trim();

    return value || undefined;
  }, [city]);

  const sectionTitle = normalizedCity
    ? `En ce moment à ${normalizedCity}`
    : "En ce moment";

  const { results, status, loadMore } = usePaginatedQuery(
    api.shortVideos.list,
    normalizedCity ? { city: normalizedCity } : {},
    {
      initialNumItems: PAGE_SIZE,
    },
  );

  const handleOpenReel = useCallback(
    (id: string) => {
      onNavigate(`reel:${id}`);
    },
    [onNavigate],
  );

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(PAGE_SIZE);
    }
  }, [loadMore, status]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (status === "LoadingFirstPage") {
    return (
      <View style={styles.section}>
        <SectionHeader title={sectionTitle} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          <ReelSkeleton />
          <ReelSkeleton />
          <ReelSkeleton />
        </ScrollView>
      </View>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Empty                                                                    */
  /* ------------------------------------------------------------------------ */

  if (results.length === 0) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Loaded                                                                   */
  /* ------------------------------------------------------------------------ */

  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  return (
    <View style={styles.section}>
      <SectionHeader
        title={sectionTitle}
        canLoadMore={canLoadMore}
        onLoadMore={handleLoadMore}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {results.map((item) => (
          <ReelCard
            key={item._id}
            item={item as ReelItem}
            onPress={() => handleOpenReel(item._id)}
          />
        ))}

        {isLoadingMore ? (
          <View
            accessible
            accessibilityLabel="Chargement de Reels supplémentaires"
            style={styles.loadingMore}
          >
            <ActivityIndicator size="small" color="#A5B4FC" />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export const HomeReels = memo(HomeReelsComponent);

HomeReels.displayName = "HomeReels";

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },

  header: {
    minHeight: 46,
    paddingHorizontal: 16,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "rgba(251,191,36,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.14)",
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: "#64748B",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "800",
    letterSpacing: 1.15,
  },

  sectionTitle: {
    marginTop: 1,
    color: "#F8FAFC",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: -0.45,
  },

  seeMoreButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.10)",
  },

  seeMorePressed: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.10)",
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  seeMoreText: {
    color: "#A5B4FC",
    fontSize: 11,
    fontWeight: "800",
  },

  row: {
    paddingHorizontal: 16,
    paddingRight: 8,
  },

  reelCard: {
    width: 142,
    height: 218,
    marginRight: 10,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  reelCardPressed: {
    width: 142,
    height: 218,
    marginRight: 10,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    opacity: 0.88,
    transform: [{ scale: 0.975 }],
  },

  media: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#111827",
  },

  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },

  mediaFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },

  mediaShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,4,18,0.16)",
  },

  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  viewsBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    minHeight: 25,
    paddingHorizontal: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(2,4,18,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  viewsText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  reelLabel: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(2,4,18,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  reelLabelText: {
    color: "#E0E7FF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  caption: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },

  captionText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    letterSpacing: -0.1,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },

  skeletonMedia: {
    flex: 1,
    padding: 10,
    justifyContent: "flex-end",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  skeletonPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonCaptionLarge: {
    width: "76%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonCaptionSmall: {
    width: "48%",
    height: 8,
    marginTop: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  loadingMore: {
    width: 54,
    height: 218,
    marginRight: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
});

export default HomeReels;
