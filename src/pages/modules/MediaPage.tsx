// src/pages/modules/MediaPage.tsx

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Eye,
  Heart,
  Headphones,
  Play,
  Radio,
  Search,
  Share2,
  TrendingUp,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface MediaPageProps {
  onBack: () => void;
}

type MediaTab = "actualites" | "podcasts" | "videos";

type NewsCategory = "Tout" | "RDC" | "Afrique" | "Monde" | "Sport" | "Économie";

const NEWS_CATEGORIES: NewsCategory[] = [
  "Tout",
  "RDC",
  "Afrique",
  "Monde",
  "Sport",
  "Économie",
];

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  Tout: "#06B6D4",
  RDC: "#3B82F6",
  Afrique: "#10B981",
  Monde: "#8B5CF6",
  Sport: "#F97316",
  Économie: "#F59E0B",
};

function formatDate(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category as NewsCategory] ?? "#06B6D4";
}

function MediaHeader({
  tab,
  onTabChange,
  onBack,
}: {
  tab: MediaTab;
  onTabChange: (tab: MediaTab) => void;
  onBack: () => void;
}) {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <Text style={styles.brandMain}>Débrouille</Text>

              <Text style={styles.brandAccent}>Media</Text>
            </View>

            <Text style={styles.headerSubtitle}>
              Information, audio et vidéo
            </Text>
          </View>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>MEDIA</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroller}
      >
        <MediaTabButton
          active={tab === "actualites"}
          icon={
            <Radio
              size={15}
              color={tab === "actualites" ? "#FFFFFF" : "#94A3B8"}
            />
          }
          label="Actualités"
          onPress={() => onTabChange("actualites")}
        />

        <MediaTabButton
          active={tab === "podcasts"}
          icon={
            <Headphones
              size={15}
              color={tab === "podcasts" ? "#FFFFFF" : "#94A3B8"}
            />
          }
          label="Podcasts"
          onPress={() => onTabChange("podcasts")}
        />

        <MediaTabButton
          active={tab === "videos"}
          icon={
            <Play size={15} color={tab === "videos" ? "#FFFFFF" : "#94A3B8"} />
          }
          label="Vidéos"
          onPress={() => onTabChange("videos")}
        />
      </ScrollView>
    </>
  );
}

function MediaTabButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
      accessibilityRole="tab"
      accessibilityState={{
        selected: active,
      }}
    >
      {icon}

      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActualitesTab() {
  const [category, setCategory] = useState<NewsCategory>("Tout");

  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());

  const [likingArticleId, setLikingArticleId] = useState<string | null>(null);

  const articles = useQuery(api.media.listPublishedArticles, {
    category: category !== "Tout" ? category : undefined,
  });

  const likeArticle = useMutation(api.media.likeArticle);

  const sortedArticles = useMemo(() => {
    if (!articles) return [];

    return [...articles].sort((a, b) => {
      const aDate = typeof a._creationTime === "number" ? a._creationTime : 0;

      const bDate = typeof b._creationTime === "number" ? b._creationTime : 0;

      return bDate - aDate;
    });
  }, [articles]);

  const handleLike = async (articleId: string) => {
    if (likingArticleId === articleId) {
      return;
    }

    setLikingArticleId(articleId);

    try {
      await likeArticle({
        articleId: articleId as never,
      });

      setLikedArticles((current) => {
        const next = new Set(current);

        if (next.has(articleId)) {
          next.delete(articleId);
        } else {
          next.add(articleId);
        }

        return next;
      });
    } catch (error) {
      Alert.alert(
        "Action impossible",
        error instanceof Error
          ? error.message
          : "Impossible de modifier votre appréciation.",
      );
    } finally {
      setLikingArticleId(null);
    }
  };

  const handleShare = async (title: string, excerpt?: string) => {
    try {
      await Share.share({
        title,
        message: excerpt ? `${title}\n\n${excerpt}` : title,
      });
    } catch {
      // L'utilisateur peut simplement avoir annulé
      // le dialogue natif de partage.
    }
  };

  const toggleSaved = (articleId: string) => {
    setSavedArticles((current) => {
      const next = new Set(current);

      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }

      return next;
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sectionIntro}>
        <View style={styles.sectionIntroIcon}>
          <TrendingUp size={16} color="#22D3EE" />
        </View>

        <View style={styles.sectionIntroText}>
          <Text style={styles.sectionEyebrow}>FIL D'ACTUALITÉ</Text>

          <Text style={styles.sectionDescription}>
            Découvrez les publications disponibles dans votre sélection
            éditoriale.
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroller}
      >
        {NEWS_CATEGORIES.map((item) => {
          const active = category === item;
          const color = CATEGORY_COLORS[item];

          return (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.categoryChip,
                active && {
                  backgroundColor: `${color}22`,
                  borderColor: `${color}66`,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  active && {
                    color,
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {articles === undefined ? (
        <NewsLoadingState />
      ) : sortedArticles.length === 0 ? (
        <EmptyMediaState
          icon={<Radio size={28} color="#475569" />}
          title="Aucune actualité"
          description={
            category === "Tout"
              ? "Aucune publication média n'est actuellement disponible."
              : `Aucune publication disponible dans la catégorie « ${category} ».`
          }
        />
      ) : (
        <View style={styles.newsList}>
          {sortedArticles.map((article, index) => {
            const articleId = String(article._id);

            const categoryColor = getCategoryColor(article.category);

            const isSaved = savedArticles.has(articleId);

            const isLiked = likedArticles.has(articleId);

            const isLiking = likingArticleId === articleId;

            const date = formatDate(article._creationTime);

            return (
              <View
                key={articleId}
                style={[
                  styles.newsCard,
                  index === 0 && styles.featuredNewsCard,
                ]}
              >
                {article.coverImage ? (
                  <Image
                    source={{
                      uri: article.coverImage,
                    }}
                    style={[
                      styles.newsImage,
                      index === 0 && styles.featuredNewsImage,
                    ]}
                    resizeMode="cover"
                    accessibilityLabel={article.title}
                  />
                ) : (
                  <View
                    style={[
                      styles.newsImagePlaceholder,
                      index === 0 && styles.featuredNewsImage,
                    ]}
                  >
                    <Radio size={index === 0 ? 30 : 22} color="#334155" />
                  </View>
                )}

                <View style={styles.newsBody}>
                  <View style={styles.newsMetaRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor: `${categoryColor}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          {
                            color: categoryColor,
                          },
                        ]}
                      >
                        {article.category}
                      </Text>
                    </View>

                    {date ? <Text style={styles.dateText}>{date}</Text> : null}
                  </View>

                  <Text
                    style={styles.newsTitle}
                    numberOfLines={index === 0 ? 4 : 3}
                  >
                    {article.title}
                  </Text>

                  {article.excerpt ? (
                    <Text
                      style={styles.newsExcerpt}
                      numberOfLines={index === 0 ? 4 : 2}
                    >
                      {article.excerpt}
                    </Text>
                  ) : null}

                  <View style={styles.newsActions}>
                    <Pressable
                      onPress={() => void handleLike(articleId)}
                      disabled={isLiking}
                      style={styles.newsAction}
                      accessibilityLabel={
                        isLiked ? "Retirer mon appréciation" : "Aimer l'article"
                      }
                    >
                      {isLiking ? (
                        <ActivityIndicator size="small" color="#22D3EE" />
                      ) : (
                        <Heart
                          size={15}
                          color={isLiked ? "#22D3EE" : "#64748B"}
                          fill={isLiked ? "#22D3EE" : "none"}
                        />
                      )}

                      <Text
                        style={[
                          styles.actionCount,
                          isLiked && styles.actionCountActive,
                        ]}
                      >
                        {article.likeCount}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        void handleShare(
                          article.title,
                          article.excerpt ?? undefined,
                        )
                      }
                      style={styles.newsAction}
                      accessibilityLabel="Partager l'article"
                    >
                      <Share2 size={15} color="#64748B" />
                    </Pressable>

                    <Pressable
                      onPress={() => toggleSaved(articleId)}
                      style={styles.newsAction}
                      accessibilityLabel={
                        isSaved
                          ? "Retirer des favoris"
                          : "Enregistrer l'article"
                      }
                    >
                      <Bookmark
                        size={15}
                        color={isSaved ? "#22D3EE" : "#64748B"}
                        fill={isSaved ? "#22D3EE" : "none"}
                      />
                    </Pressable>

                    <View style={[styles.newsAction, styles.viewsAction]}>
                      <Eye size={14} color="#475569" />

                      <Text style={styles.actionCount}>
                        {article.viewCount}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.editorialNotice}>
        <Radio size={17} color="#22D3EE" />

        <View style={styles.editorialNoticeBody}>
          <Text style={styles.editorialNoticeTitle}>
            Information vérifiable
          </Text>

          <Text style={styles.editorialNoticeDescription}>
            Les contenus affichés dans cette section proviennent des
            publications disponibles dans le backend Media.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function NewsLoadingState() {
  return (
    <View style={styles.loadingState}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.loadingCard}>
          <View style={styles.loadingImage} />

          <View style={styles.loadingLines}>
            <View style={[styles.loadingLine, { width: "28%" }]} />

            <View style={[styles.loadingLine, { width: "92%" }]} />

            <View style={[styles.loadingLine, { width: "70%" }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyMediaState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function PodcastsTab() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mediaHero}>
        <View style={styles.mediaHeroIcon}>
          <Headphones size={25} color="#A78BFA" />
        </View>

        <Text style={styles.mediaHeroTitle}>Podcasts</Text>

        <Text style={styles.mediaHeroDescription}>
          L'audio éditorial fera partie de Débrouille Media avec des contenus,
          épisodes et métadonnées provenant du backend réel.
        </Text>
      </View>

      <EmptyMediaState
        icon={<Headphones size={28} color="#64748B" />}
        title="Catalogue audio indisponible"
        description="Aucun catalogue Podcast réel n'est actuellement exposé par le backend Media connecté à cette page."
      />

      <CapabilityCard
        icon={<Headphones size={17} color="#A78BFA" />}
        title="Prêt pour le vrai audio"
        description="La structure de l'interface est prête pour connecter les épisodes, auteurs, durées, couvertures, progression et lecture native lorsque les fonctions backend correspondantes seront disponibles."
      />
    </ScrollView>
  );
}

function VideosTab() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mediaHero}>
        <View style={styles.mediaHeroIcon}>
          <Play size={25} color="#38BDF8" />
        </View>

        <Text style={styles.mediaHeroTitle}>Vidéos</Text>

        <Text style={styles.mediaHeroDescription}>
          Une expérience vidéo native pourra exploiter les médias réellement
          publiés sur DébrouillePro.
        </Text>
      </View>

      <EmptyMediaState
        icon={<Play size={28} color="#64748B" />}
        title="Catalogue vidéo indisponible"
        description="Aucun catalogue vidéo réel n'est actuellement exposé par le backend Media connecté à cette page."
      />

      <CapabilityCard
        icon={<Play size={17} color="#38BDF8" />}
        title="Prêt pour la vidéo native"
        description="La couche média pourra ensuite intégrer lecture, plein écran, progression, découverte et contenus réellement stockés sans introduire de vidéos fictives."
      />
    </ScrollView>
  );
}

function CapabilityCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.capabilityCard}>
      <View style={styles.capabilityIcon}>{icon}</View>

      <View style={styles.capabilityBody}>
        <Text style={styles.capabilityTitle}>{title}</Text>

        <Text style={styles.capabilityDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function MediaPage({ onBack }: MediaPageProps) {
  const [tab, setTab] = useState<MediaTab>("actualites");

  const { isAuthenticated, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator size="large" color="#22D3EE" />

        <Text style={styles.authLoadingText}>Préparation de Media...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MediaHeader tab={tab} onTabChange={setTab} onBack={onBack} />

      {tab === "actualites" ? (
        isAuthenticated ? (
          <ActualitesTab />
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <EmptyMediaState
              icon={<Radio size={30} color="#22D3EE" />}
              title="Actualités"
              description="Connectez-vous pour accéder au flux personnalisé des actualités Media."
            />

            <CapabilityCard
              icon={<Search size={17} color="#22D3EE" />}
              title="Media DébrouillePro"
              description="La couche éditoriale est conçue pour évoluer vers une expérience mondiale de découverte de contenus."
            />
          </ScrollView>
        )
      ) : null}

      {tab === "podcasts" ? <PodcastsTab /> : null}

      {tab === "videos" ? <VideosTab /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  brandBlock: {
    marginLeft: 11,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  brandMain: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  brandAccent: {
    color: "#22D3EE",
    fontSize: 18,
    fontWeight: "400",
    marginLeft: 3,
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 2,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(6,182,212,0.10)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.20)",
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#22D3EE",
  },

  liveText: {
    color: "#22D3EE",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  tabScroller: {
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  tabButton: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  tabButtonActive: {
    backgroundColor: "rgba(6,182,212,0.18)",
    borderColor: "rgba(6,182,212,0.42)",
  },

  tabLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
  },

  tabLabelActive: {
    color: "#FFFFFF",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  sectionIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 13,
  },

  sectionIntroIcon: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(6,182,212,0.10)",
  },

  sectionIntroText: {
    flex: 1,
  },

  sectionEyebrow: {
    color: "#22D3EE",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sectionDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  categoryScroller: {
    gap: 7,
    paddingBottom: 13,
  },

  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  categoryText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
  },

  newsList: {
    gap: 11,
  },

  newsCard: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  featuredNewsCard: {
    borderColor: "rgba(6,182,212,0.20)",
  },

  newsImage: {
    width: "100%",
    height: 155,
  },

  featuredNewsImage: {
    height: 205,
  },

  newsImagePlaceholder: {
    width: "100%",
    height: 155,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  newsBody: {
    padding: 14,
  },

  newsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  categoryBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  dateText: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "600",
  },

  newsTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },

  newsExcerpt: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  newsActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  newsAction: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  viewsAction: {
    marginLeft: "auto",
  },

  actionCount: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },

  actionCountActive: {
    color: "#22D3EE",
  },

  loadingState: {
    gap: 10,
  },

  loadingCard: {
    flexDirection: "row",
    minHeight: 105,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  loadingImage: {
    width: 105,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  loadingLines: {
    flex: 1,
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 13,
  },

  loadingLine: {
    height: 9,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 13,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },

  editorialNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 14,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(6,182,212,0.055)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.13)",
  },

  editorialNoticeBody: {
    flex: 1,
  },

  editorialNoticeTitle: {
    color: "#BAF6FF",
    fontSize: 11,
    fontWeight: "900",
  },

  editorialNoticeDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  mediaHero: {
    padding: 20,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  mediaHeroIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(139,92,246,0.10)",
    marginBottom: 13,
  },

  mediaHeroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  mediaHeroDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  capabilityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  capabilityIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  capabilityBody: {
    flex: 1,
  },

  capabilityTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  capabilityDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  authLoadingText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 10,
  },
});
