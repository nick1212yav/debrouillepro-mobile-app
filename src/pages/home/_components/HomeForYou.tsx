import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface Props {
  onNavigate: (page: string) => void;
}

type FeedPublication = {
  _id: Id<"publications">;
  _creationTime: number;
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
  author: {
    name?: string;
    avatar?: string;
  } | null;
  likedByMe: boolean;
};

type PersonalizedFeedResult = {
  page: FeedPublication[];
  isDone: boolean;
  continueCursor: string;
  preferredTypes: string[];
  favoriteModules: string[];
};

const MAX_ITEMS = 6;

const MODULE_BY_PUBLICATION_TYPE: Record<string, string> = {
  immo: "immo",
  job: "jobs",
  service: "services",
  evenement: "evenements",
  community: "community",
  agri: "agri",
  sante: "sante",
  transport: "transport",
  annonce: "annonces",
  restauration: "restauration",
  hebergement: "hebergement",
  energie: "energie",
  ong: "ong",
  video: "reels",
  sondage: "community",
  marketplace: "marketplace",
  network: "network",
  voyages: "voyages",
};

const TYPE_LABELS: Record<string, string> = {
  immo: "Immobilier",
  job: "Emploi",
  service: "Service",
  evenement: "Événement",
  community: "Communauté",
  agri: "Agriculture",
  sante: "Santé",
  transport: "Transport",
  annonce: "Annonce",
  restauration: "Restauration",
  hebergement: "Hébergement",
  energie: "Énergie",
  ong: "ONG",
  video: "Vidéo",
  article: "Article",
  sondage: "Sondage",
  marketplace: "Commerce",
  network: "Réseau",
  voyages: "Voyage",
};

function getModuleId(type: string): string | null {
  return MODULE_BY_PUBLICATION_TYPE[type] ?? null;
}

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? "Pour vous";
}

function getRecommendationReason(
  publication: FeedPublication,
  preferredTypes: string[],
  favoriteModules: string[],
): string {
  const moduleId = getModuleId(publication.type);

  if (moduleId && favoriteModules.includes(moduleId)) {
    return "Un de vos modules favoris";
  }

  if (preferredTypes.includes(publication.type)) {
    return `Selon vos intérêts · ${getTypeLabel(publication.type)}`;
  }

  if (publication.category) {
    return publication.category;
  }

  return getTypeLabel(publication.type);
}

function getPrimaryImage(publication: FeedPublication): string | null {
  const image = publication.images[0];

  if (!image || image.trim().length === 0) {
    return null;
  }

  return image;
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

function RecommendationSkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImage} />

      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineLarge} />
        <View style={styles.skeletonLineSmall} />
        <View style={styles.skeletonLineTiny} />
      </View>
    </View>
  );
}

export default function HomeForYou({ onNavigate }: Props) {
  const result = useQuery(api.feed.listPersonalizedFeed, {
    paginationOpts: {
      numItems: MAX_ITEMS,
      cursor: null,
    },
  }) as PersonalizedFeedResult | undefined;

  if (result === undefined) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>POUR VOUS</Text>

            <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          <RecommendationSkeleton />
          <RecommendationSkeleton />
          <RecommendationSkeleton />
        </ScrollView>
      </View>
    );
  }

  const publications = result.page
    .filter((publication) => publication.status === "active")
    .slice(0, MAX_ITEMS);

  if (publications.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>POUR VOUS</Text>

          <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir davantage de contenus personnalisés"
          accessibilityHint="Ouvre le module Découvrir"
          onPress={() => onNavigate("decouverte")}
          style={({ pressed }) => [
            styles.seeAllButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.seeAllText}>Tout voir</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
      >
        {publications.map((publication) => {
          const image = getPrimaryImage(publication);
          const moduleId = getModuleId(publication.type);

          const reason = getRecommendationReason(
            publication,
            result.preferredTypes,
            result.favoriteModules,
          );

          const engagement =
            publication.likeCount +
            publication.commentCount +
            publication.viewCount;

          return (
            <Pressable
              key={publication._id}
              accessibilityRole="button"
              accessibilityLabel={publication.title}
              accessibilityHint={
                moduleId
                  ? `Ouvre ${getTypeLabel(publication.type)}`
                  : "Ouvre le contenu"
              }
              onPress={() => {
                if (moduleId) {
                  onNavigate(moduleId);
                  return;
                }

                onNavigate("decouverte");
              }}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.media}>
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                    accessibilityLabel=""
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.fallbackLabel}>
                      {getTypeLabel(publication.type)}
                    </Text>
                  </View>
                )}

                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {getTypeLabel(publication.type)}
                  </Text>
                </View>
              </View>

              <View style={styles.body}>
                <Text numberOfLines={2} style={styles.title}>
                  {publication.title}
                </Text>

                <Text numberOfLines={1} style={styles.reason}>
                  {reason}
                </Text>

                <View style={styles.metaRow}>
                  {publication.location ? (
                    <Text numberOfLines={1} style={styles.location}>
                      {publication.location}
                    </Text>
                  ) : null}

                  {engagement > 0 ? (
                    <Text style={styles.engagement}>
                      {formatMetric(engagement)}
                    </Text>
                  ) : null}
                </View>
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

  eyebrow: {
    marginBottom: 3,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
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
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  seeAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.72)",
  },

  pressed: {
    opacity: 0.72,
  },

  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },

  card: {
    width: 190,
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
    height: 118,
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
    paddingHorizontal: 20,
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  fallbackLabel: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
  },

  typeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: 130,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(5,8,18,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  typeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  body: {
    minHeight: 96,
    padding: 12,
  },

  title: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  reason: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.46)",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
  },

  location: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12,
    color: "rgba(255,255,255,0.36)",
  },

  engagement: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.38)",
  },

  skeletonCard: {
    width: 190,
    height: 214,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  skeletonImage: {
    height: 118,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  skeletonBody: {
    gap: 9,
    padding: 12,
  },

  skeletonLineLarge: {
    width: "88%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.065)",
  },

  skeletonLineSmall: {
    width: "68%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  skeletonLineTiny: {
    width: "45%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});
