import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { MapPin, Navigation2, ChevronRight } from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface Props {
  latitude: number;
  longitude: number;
  onNavigate: (page: string) => void;
}

type NearbyItem = {
  _id: Id<"publications">;
  _creationTime: number;
  authorId: Id<"users">;
  type: string;
  title: string;
  description: string;
  price?: string;
  location?: string;
  category?: string;
  images: string[];
  tags: string[];
  likeCount: number;
  viewCount: number;
  commentCount: number;
  status: "active" | "sold" | "closed";
  latitude: number;
  longitude: number;
  distanceKm: number;
  score: number;
  reason: string;
};

type NearbyResult = {
  page: NearbyItem[];
  isDone: boolean;
  continueCursor: string;
};

const MAX_ITEMS = 6;

const TYPE_LABELS: Record<string, string> = {
  job: "Emploi",
  service: "Service",
  evenement: "Événement",
  annonce: "Annonce",
  marketplace: "Commerce",
};

const MODULE_BY_TYPE: Record<string, string> = {
  job: "jobs",
  service: "services",
  evenement: "evenements",
  annonce: "annonces",
  marketplace: "marketplace",
};

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? "À proximité";
}

function getModuleId(type: string): string {
  return MODULE_BY_TYPE[type] ?? "decouverte";
}

function getImage(item: NearbyItem): string | null {
  const image = item.images[0];

  if (!image || image.trim().length === 0) {
    return null;
  }

  return image;
}

function formatDistance(distanceKm: number): string {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return "";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  return `${Math.round(distanceKm)} km`;
}

function formatMetric(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} k`;
  }

  return String(value);
}

function NearbySkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImage} />

      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonLineSmall} />
      </View>
    </View>
  );
}

export default function HomeNearby({ latitude, longitude, onNavigate }: Props) {
  const result = useQuery(api.homeNearby.list, {
    latitude,
    longitude,
    radiusKm: 15,
    paginationOpts: {
      numItems: MAX_ITEMS,
      cursor: null,
    },
  }) as NearbyResult | undefined;

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (result === undefined) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.headingRow}>
              <View style={styles.locationIcon}>
                <MapPin size={14} color="#8B5CF6" />
              </View>

              <View>
                <Text style={styles.eyebrow}>AUTOUR DE VOUS</Text>

                <Text style={styles.sectionTitle}>À proximité</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          <NearbySkeleton />
          <NearbySkeleton />
          <NearbySkeleton />
        </ScrollView>
      </View>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Data normalization                                                       */
  /* ------------------------------------------------------------------------ */

  const items = result.page
    .filter(
      (item) =>
        item.status === "active" &&
        Number.isFinite(item.distanceKm) &&
        item.distanceKm >= 0,
    )
    .slice(0, MAX_ITEMS);

  /* ------------------------------------------------------------------------ */
  /* Empty                                                                    */
  /* ------------------------------------------------------------------------ */

  if (items.length === 0) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Categories                                                               */
  /* ------------------------------------------------------------------------ */

  /*
   * Les pills sont dérivées exclusivement des éléments
   * réellement renvoyés par le backend.
   *
   * Une catégorie absente des résultats n'est jamais affichée.
   * Le clic ouvre directement le module correspondant.
   */
  const seenTypes = new Set<string>();

  const typeCategories: Array<{
    type: string;
    label: string;
    moduleId: string;
  }> = [];

  for (const item of items) {
    if (seenTypes.has(item.type)) {
      continue;
    }

    seenTypes.add(item.type);

    typeCategories.push({
      type: item.type,
      label: getTypeLabel(item.type),
      moduleId: getModuleId(item.type),
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={styles.headingRow}>
            <View style={styles.locationIcon}>
              <MapPin size={14} color="#8B5CF6" />
            </View>

            <View style={styles.headingContent}>
              <Text style={styles.eyebrow}>AUTOUR DE VOUS</Text>

              <Text style={styles.sectionTitle}>À proximité</Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir tout ce qui est disponible à proximité"
          accessibilityHint="Ouvre le module Découvrir"
          onPress={() => onNavigate("decouverte")}
          style={({ pressed }) => [
            styles.seeAllButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.seeAllText}>Tout voir</Text>

          <ChevronRight size={14} color="rgba(255,255,255,0.55)" />
        </Pressable>
      </View>

      {typeCategories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {typeCategories.map((category) => (
            <Pressable
              key={category.type}
              accessibilityRole="button"
              accessibilityLabel={`Voir les contenus : ${category.label}`}
              accessibilityHint={`Ouvre le module ${category.label}`}
              onPress={() => onNavigate(category.moduleId)}
              style={({ pressed }) => [
                styles.pill,
                pressed && styles.pillPressed,
              ]}
            >
              <Text style={styles.pillText}>{category.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
      >
        {items.map((item) => {
          const image = getImage(item);
          const distance = formatDistance(item.distanceKm);
          const typeLabel = getTypeLabel(item.type);
          const moduleId = getModuleId(item.type);

          const engagement =
            item.likeCount + item.commentCount + item.viewCount;

          return (
            <Pressable
              key={item._id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${typeLabel}, ${distance}`}
              accessibilityHint={`Ouvre ${typeLabel}`}
              onPress={() => onNavigate(moduleId)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.media}>
                {image ? (
                  <Image
                    source={{ uri: image }}
                    resizeMode="cover"
                    style={styles.image}
                    accessibilityLabel=""
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <MapPin size={24} color="rgba(139,92,246,0.72)" />
                  </View>
                )}

                <View style={styles.distanceBadge}>
                  <Navigation2 size={10} color="#FFFFFF" />

                  <Text style={styles.distanceText}>{distance}</Text>
                </View>

                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{typeLabel}</Text>
                </View>
              </View>

              <View style={styles.body}>
                <Text numberOfLines={2} style={styles.title}>
                  {item.title}
                </Text>

                {item.category ? (
                  <Text numberOfLines={1} style={styles.category}>
                    {item.category}
                  </Text>
                ) : null}

                <View style={styles.metaRow}>
                  {item.location ? (
                    <View style={styles.locationRow}>
                      <MapPin size={10} color="rgba(255,255,255,0.32)" />

                      <Text numberOfLines={1} style={styles.location}>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}

                  {engagement > 0 ? (
                    <Text style={styles.engagement}>
                      {formatMetric(engagement)}
                    </Text>
                  ) : null}
                </View>

                {item.reason ? (
                  <Text numberOfLines={1} style={styles.reason}>
                    {item.reason}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  titleBlock: {
    flex: 1,
    minWidth: 0,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  headingContent: {
    minWidth: 0,
  },

  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  eyebrow: {
    marginBottom: 2,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: 1.25,
    color: "rgba(139,92,246,0.85)",
  },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },

  seeAllButton: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  seeAllText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.68)",
  },

  pressed: {
    opacity: 0.7,
  },

  /* ------------------------------------------------------------------------ */
  /* Category pills                                                           */
  /* ------------------------------------------------------------------------ */

  pillsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },

  pill: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.16)",
  },

  pillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  pillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.15,
    color: "#C4B5FD",
  },

  /* ------------------------------------------------------------------------ */
  /* Cards                                                                    */
  /* ------------------------------------------------------------------------ */

  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },

  card: {
    width: 205,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  media: {
    height: 124,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.07)",
  },

  distanceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(5,8,18,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  distanceText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  typeBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(5,8,18,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
  },

  typeBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "rgba(255,255,255,0.88)",
  },

  body: {
    minHeight: 108,
    padding: 12,
  },

  title: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  category: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: "rgba(139,92,246,0.75)",
  },

  metaRow: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 8,
  },

  locationRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  location: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12,
    color: "rgba(255,255,255,0.35)",
  },

  engagement: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.32)",
  },

  reason: {
    marginTop: 7,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.38)",
  },

  /* ------------------------------------------------------------------------ */
  /* Skeleton                                                                 */
  /* ------------------------------------------------------------------------ */

  skeletonCard: {
    width: 205,
    height: 232,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  skeletonImage: {
    height: 124,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  skeletonBody: {
    gap: 9,
    padding: 12,
  },

  skeletonLineWide: {
    width: "88%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.065)",
  },

  skeletonLineMedium: {
    width: "66%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  skeletonLineSmall: {
    width: "43%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});
