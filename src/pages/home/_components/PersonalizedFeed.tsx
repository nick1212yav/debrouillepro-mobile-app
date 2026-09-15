// src/pages/home/_components/PersonalizedFeed.tsx
"use no memo";

import {
  Pressable,
  View,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import {
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Plus,
  RefreshCw,
} from "lucide-react-native";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { PublicationRenderer } from "@/features/publications/components/PublicationRenderer";
import { usePublicationActions } from "@/features/publications/hooks/usePublicationActions";
import type {
  Publication,
  PublicationType,
} from "@/features/publications/types";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import CommentsSheet from "./CommentsSheet";
import { useHomeFeed } from "@/home/hooks/useHomeFeed";

/* ============================================================
 * TYPE → API
 * ============================================================ */

function mapTypeToAPI(type: PublicationType): string {
  const mapping: Record<string, string> = {
    emploi: "job",
    logement: "immo",
    tourisme: "voyages",
    marketplace: "service",
    premium: "service",
    boost: "service",
    reputation: "community",
    recompenses: "community",
    parrainage: "community",
    sos: "community",
    groupes: "community",
    cours: "education",
    quiz: "education",
    certifications: "education",
    apprendre: "education",
    ecole: "education",
    mentorat: "education",
    freelance: "job",
    evenements: "evenement",
    annonces: "annonce",
    voyages: "voyages",
    hebergement: "hebergement",
  };
  return mapping[type] ?? type;
}

/* ============================================================
 * FILTER TYPES
 * ============================================================ */

type FilterType = PublicationType | "all";

interface FilterDefinition {
  value: FilterType;
  label: string;
  color: string;
}

const FILTER_TYPES: FilterDefinition[] = [
  { value: "all", label: "Tous", color: "#A78BFA" },
  { value: "community", label: "Community", color: "#60A5FA" },
  { value: "evenement", label: "Événements", color: "#A78BFA" },
  { value: "job", label: "Emploi", color: "#34D399" },
  { value: "immo", label: "Immobilier", color: "#818CF8" },
  { value: "service", label: "Services", color: "#FBBF24" },
  { value: "sante", label: "Santé", color: "#F87171" },
  { value: "annonce", label: "Annonces", color: "#818CF8" },
  { value: "restauration", label: "Restauration", color: "#FB923C" },
  { value: "hebergement", label: "Hébergement", color: "#A78BFA" },
  { value: "agri", label: "Agriculture", color: "#4ADE80" },
  { value: "energie", label: "Énergie", color: "#FBBF24" },
  { value: "ong", label: "ONG", color: "#34D399" },
  { value: "media", label: "Médias", color: "#F472B6" },
  { value: "education", label: "Éducation", color: "#A78BFA" },
  { value: "finance", label: "Finance", color: "#FBBF24" },
  { value: "voyages", label: "Voyages", color: "#22D3EE" },
];

/* ============================================================
 * PUBLICATION VALIDATION
 * ============================================================ */

function isRenderablePublication(value: unknown): value is Publication {
  if (value === null || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item._id === "string" &&
    item._id.length > 0 &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.type === "string" &&
    item.type.trim().length > 0
  );
}

/* ============================================================
 * FADE UP WRAPPER
 * ============================================================ */

function FadeUp({
  delay = 0,
  distance = 18,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================
 * BOOKMARK BUTTON
 * ============================================================ */

function BookmarkButton({
  publicationId,
}: {
  publicationId: Id<"publications">;
}) {
  const { isAuthenticated } = useConvexAuth();

  const isBookmarked = useQuery(
    api.bookmarks.isBookmarked,
    isAuthenticated ? { publicationId } : "skip",
  );

  const toggleBookmark = useMutation(api.bookmarks.toggle);

  const [pending, setPending] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const saved = isBookmarked === true;

  const handleClick = async () => {
    if (!isAuthenticated || pending) return;

    setPending(true);

    try {
      const result = await toggleBookmark({ publicationId });

      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.35,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      toast.success(
        result
          ? "Publication enregistrée"
          : "Publication retirée des enregistrements",
        { icon: result ? "🔖" : "📌" },
      );
    } catch {
      toast.error("Impossible de modifier l'enregistrement.");
    } finally {
      setPending(false);
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-14deg"],
  });

  return (
    <Pressable
      onPress={() => void handleClick()}
      disabled={!isAuthenticated || pending}
      accessibilityLabel={
        saved
          ? "Retirer la publication des enregistrements"
          : "Enregistrer la publication"
      }
      accessibilityState={{ selected: saved }}
      style={({ pressed }) => [
        styles.bookmarkBtn,
        saved ? styles.bookmarkBtnSaved : styles.bookmarkBtnIdle,
        pressed && { opacity: 0.75 },
        (!isAuthenticated || pending) && { opacity: 0.5 },
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { rotate }],
        }}
      >
        {saved ? (
          <BookmarkCheck size={14} color="#FACC15" />
        ) : (
          <Bookmark size={14} color="rgba(255,255,255,0.55)" />
        )}
      </Animated.View>
      <Text
        style={[
          styles.bookmarkText,
          { color: saved ? "#FACC15" : "rgba(255,255,255,0.6)" },
        ]}
      >
        {saved ? "Enregistré" : "Enregistrer"}
      </Text>
    </Pressable>
  );
}

/* ============================================================
 * COMMENTS BUTTON
 * ============================================================ */

function CommentsButton({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={
        count > 0
          ? `${count} commentaire${count > 1 ? "s" : ""}`
          : "Ajouter un commentaire"
      }
      style={({ pressed }) => [
        styles.commentsBtn,
        pressed && { opacity: 0.75 },
      ]}
    >
      <MessageCircle size={14} color="rgba(255,255,255,0.6)" />
      <Text style={styles.commentsBtnText}>
        {count > 0 ? (count > 999 ? "999+" : count) : "Commenter"}
      </Text>
    </Pressable>
  );
}

/* ============================================================
 * CATEGORY CHIP
 * ============================================================ */

function CategoryChip({
  item,
  active,
  onPress,
}: {
  item: FilterDefinition;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  // Couleurs calculées en JS (pas d'Animated) → évite l'attache
  // d'un AnimatedStyle non-natif dans l'arbre CSS-interop.
  const borderColor = active ? `${item.color}66` : "rgba(255,255,255,0.09)";

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={styles.categoryChip}
      >
        {/* Base bg */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor,
            },
          ]}
        />

        {/* Active gradient (opacité gérée en JS, pas via Animated) */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: active ? 1 : 0,
              borderRadius: 999,
              overflow: "hidden",
              shadowColor: item.color,
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            },
          ]}
        >
          <LinearGradient
            colors={[`${item.color}E6`, `${item.color}AA`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <Text
          style={[
            styles.categoryChipText,
            {
              color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
            },
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
 * CATEGORY BAR
 * ============================================================ */

function CategoryBar({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (type: FilterType) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryBarContent}
      accessibilityLabel="Filtrer le fil d'actualité"
    >
      {FILTER_TYPES.map((item) => (
        <CategoryChip
          key={item.value}
          item={item}
          active={active === item.value}
          onPress={() => onChange(item.value)}
        />
      ))}
    </ScrollView>
  );
}

/* ============================================================
 * FEED SKELETON
 * ============================================================ */

function FeedSkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <View
      style={styles.skeletonWrap}
      accessibilityLabel="Chargement du fil"
      accessibilityState={{ busy: true }}
    >
      {[0, 1, 2].map((index) => (
        <Animated.View key={index} style={[styles.skeletonCard, { opacity }]}>
          <Skeleton style={styles.skeletonHero} />
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonAuthorRow}>
              <Skeleton style={styles.skeletonAvatar} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={styles.skeletonLine1} />
                <Skeleton style={styles.skeletonLine2} />
              </View>
            </View>
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonText} />
            <Skeleton style={styles.skeletonTextShort} />
            <View style={styles.skeletonActionsRow}>
              <Skeleton style={styles.skeletonAction} />
              <Skeleton style={styles.skeletonAction} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/* ============================================================
 * EMPTY FEED
 * ============================================================ */

function EmptyFeed({
  onCreateOpen,
  activeType,
}: {
  onCreateOpen: () => void;
  activeType: FilterType;
}) {
  const isFiltered = activeType !== "all";
  const float = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    const spring = Animated.spring(iconScale, {
      toValue: 1,
      delay: 100,
      stiffness: 260,
      damping: 20,
      useNativeDriver: true,
    });
    spring.start();

    return () => {
      loop.stop();
      spring.stop();
    };
  }, [float, iconScale]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <FadeUp distance={18}>
      <View style={styles.emptyWrap}>
        <View style={styles.emptyCard}>
          <LinearGradient
            colors={[
              "rgba(139,92,246,0.14)",
              "rgba(15,7,32,0.6)",
              "rgba(10,6,24,0.85)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.emptyBorder} pointerEvents="none" />
          <View style={styles.emptyOrb} pointerEvents="none" />

          <Animated.View
            style={[
              styles.emptyIconWrap,
              {
                transform: [{ scale: iconScale }, { translateY }],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(167,139,250,0.32)", "rgba(99,102,241,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconGradient}
            >
              <Plus size={28} color="#C4B5FD" strokeWidth={2.2} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.emptyTitle}>
            {isFiltered
              ? "Aucun contenu dans cette catégorie"
              : "Votre fil est prêt à vivre"}
          </Text>

          <Text style={styles.emptySub}>
            {isFiltered
              ? "Essayez une autre catégorie pour découvrir davantage de contenu."
              : "Publiez quelque chose et commencez à construire votre espace dans la communauté."}
          </Text>

          <Pressable
            onPress={onCreateOpen}
            style={({ pressed }) => [
              styles.emptyCtaOuter,
              pressed && { opacity: 0.85 },
            ]}
          >
            <LinearGradient
              colors={["#A78BFA", "#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyCta}
            >
              <Plus size={16} color="#fff" strokeWidth={2.6} />
              <Text style={styles.emptyCtaText}>Créer une publication</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================
 * PAGINATION FOOTER
 * ============================================================ */

function PaginationFooter({
  canLoadMore,
  loadingMore,
  count,
  onLoadMore,
}: {
  canLoadMore: boolean;
  loadingMore: boolean;
  count: number;
  onLoadMore: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dots = useMemo(() => [dot1, dot2, dot3], [dot1, dot2, dot3]);

  useEffect(() => {
    if (!loadingMore) return;

    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [loadingMore, dots]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  if (loadingMore) {
    return (
      <View
        style={styles.loadingDotsWrap}
        accessibilityLabel="Chargement de publications supplémentaires"
        accessibilityState={{ busy: true }}
      >
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.loadingDot,
              {
                opacity: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.25, 1],
                }),
                transform: [
                  {
                    scale: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (canLoadMore) {
    return (
      <View style={styles.paginationWrap}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPress={onLoadMore}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={({ pressed }) => [
              styles.loadMoreBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            <RefreshCw size={14} color="rgba(255,255,255,0.75)" />
            <Text style={styles.loadMoreText}>Charger plus</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  if (count > 0) {
    return (
      <FadeUp distance={6}>
        <View style={styles.exhaustedWrap}>
          <View style={styles.exhaustedLine} />
          <Text style={styles.exhaustedText}>Vous avez tout vu</Text>
          <View style={styles.exhaustedLine} />
        </View>
      </FadeUp>
    );
  }

  return null;
}

/* ============================================================
 * PROPS
 * ============================================================ */

interface PersonalizedFeedProps {
  onNavigate: (page: string) => void;
  onCreateOpen: () => void;
  onViewProfile: (userId: string) => void;
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function PersonalizedFeed({
  onCreateOpen,
}: PersonalizedFeedProps) {
  const [activeType, setActiveType] = useState<FilterType>("all");
  const [commentsItem, setCommentsItem] = useState<Publication | null>(null);

  const { handleAction, handleCTA } = usePublicationActions();

  /* ───── query ───── */
  const queryType = activeType !== "all" ? mapTypeToAPI(activeType) : undefined;

  const { feed, loading, loadingMore, canLoadMore, loadMore } = useHomeFeed({
    type: queryType,
  });

  /* ───── mutations ───── */
  const likePublication = useMutation(api.publications.likePublication);
  const deletePublication = useMutation(api.publications.deletePublication);

  /* ───── publications ───── */
  const publications = useMemo<Publication[]>(() => {
    if (!Array.isArray(feed)) return [];
    const seen = new Set<string>();
    return feed.filter((item): item is Publication => {
      if (!isRenderablePublication(item)) return false;
      if (seen.has(item._id)) return false;
      seen.add(item._id);
      return true;
    });
  }, [feed]);

  /* ───── handlers ───── */
  const handleLike = useCallback(
    async (publicationId: Id<"publications">) => {
      try {
        await likePublication({ publicationId });
      } catch {
        toast.error("Impossible de modifier la publication.");
      }
    },
    [likePublication],
  );

  const handleDelete = useCallback(
    async (publicationId: Id<"publications">) => {
      try {
        await deletePublication({ publicationId });
        toast.success("Publication supprimée.");
      } catch {
        toast.error("Impossible de supprimer la publication.");
      }
    },
    [deletePublication],
  );

  const handleFilterChange = useCallback(
    (type: FilterType) => {
      if (type === activeType) return;
      setCommentsItem(null);
      setActiveType(type);
    },
    [activeType],
  );

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={styles.root} accessibilityLabel="Fil personnalisé">
      {/* ───── CATEGORY FILTER ───── */}
      <View style={styles.categoryBarWrap}>
        <CategoryBar active={activeType} onChange={handleFilterChange} />
      </View>

      {/* ───── FEED ───── */}
      {loading ? (
        <FeedSkeleton />
      ) : publications.length === 0 ? (
        <EmptyFeed activeType={activeType} onCreateOpen={onCreateOpen} />
      ) : (
        <View style={styles.feedWrap}>
          {publications.map((item, index) => (
            <FadeUp
              key={`${activeType}-${item._id}`}
              delay={Math.min(index * 45, 250)}
              distance={18}
            >
              <PublicationRenderer
                publication={item}
                index={index}
                onLike={() => {
                  void handleLike(item._id);
                }}
                onDelete={() => {
                  void handleDelete(item._id);
                }}
                onAction={(actionId) => handleAction(actionId, item)}
                onCTA={() => handleCTA(item)}
                actionsSlot={
                  <View style={styles.actionsRow}>
                    <CommentsButton
                      count={item.commentCount ?? 0}
                      onPress={() => setCommentsItem(item)}
                    />
                    <BookmarkButton publicationId={item._id} />
                  </View>
                }
              />
            </FadeUp>
          ))}

          {/* ───── PAGINATION ───── */}
          <PaginationFooter
            canLoadMore={canLoadMore}
            loadingMore={loadingMore}
            count={publications.length}
            onLoadMore={() => {
              void loadMore();
            }}
          />
        </View>
      )}

      {/* ───── COMMENTS ───── */}
      <CommentsSheet
        open={commentsItem !== null}
        onClose={() => setCommentsItem(null)}
        publicationId={commentsItem?._id ?? null}
        publicationTitle={commentsItem?.title}
      />
    </View>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    gap: 0,
  },

  /* ── Category bar ───────────────────────────────── */
  categoryBarWrap: {
    paddingBottom: 12,
  },
  categoryBarContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  categoryChip: {
    height: 36,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    overflow: "hidden",
    minWidth: 60,
  },
  categoryChipText: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.1,
    zIndex: 10,
  },

  /* ── Feed ───────────────────────────────────────── */
  feedWrap: {
    paddingHorizontal: 16,
    gap: 16,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /* ── Bookmark button ────────────────────────────── */
  bookmarkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  bookmarkBtnSaved: {
    backgroundColor: "rgba(234,179,8,0.15)",
    borderColor: "rgba(234,179,8,0.35)",
  },
  bookmarkBtnIdle: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.09)",
  },
  bookmarkText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.1,
  },

  /* ── Comments button ────────────────────────────── */
  commentsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  commentsBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.1,
  },

  /* ── Skeleton ───────────────────────────────────── */
  skeletonWrap: {
    paddingHorizontal: 16,
    gap: 16,
  },
  skeletonCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  skeletonHero: {
    height: 176,
    width: "100%",
    borderRadius: 0,
  },
  skeletonBody: {
    padding: 16,
    gap: 12,
  },
  skeletonAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  skeletonLine1: {
    height: 14,
    width: 128,
    borderRadius: 7,
  },
  skeletonLine2: {
    height: 10,
    width: 80,
    borderRadius: 5,
  },
  skeletonTitle: {
    height: 20,
    width: "66%",
    borderRadius: 10,
  },
  skeletonText: {
    height: 12,
    width: "100%",
    borderRadius: 6,
  },
  skeletonTextShort: {
    height: 12,
    width: "80%",
    borderRadius: 6,
  },
  skeletonActionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
  },
  skeletonAction: {
    height: 32,
    width: 80,
    borderRadius: 12,
  },

  /* ── Empty ──────────────────────────────────────── */
  emptyWrap: {
    paddingHorizontal: 16,
  },
  emptyCard: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyOrb: {
    position: "absolute",
    top: -100,
    alignSelf: "center",
    width: 200,
    height: 200,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  emptyIconWrap: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  emptySub: {
    maxWidth: 320,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 22,
  },
  emptyCtaOuter: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyCtaText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  /* ── Pagination ─────────────────────────────────── */
  paginationWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    alignItems: "center",
  },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  loadMoreText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.2,
  },
  loadingDotsWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 20,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A78BFA",
  },
  exhaustedWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  exhaustedLine: {
    height: 1,
    width: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  exhaustedText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.2,
  },
});
