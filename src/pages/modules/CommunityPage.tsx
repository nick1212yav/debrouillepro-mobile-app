// src/pages/modules/CommunityPage.tsx
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  Smile,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react-native";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useCommunity } from "@/features/community/hooks/useCommunity";
import { CommunityCard } from "@/features/community/components/CommunityCard";
import { CreatePostSheet } from "@/features/community/components/CreatePost";
import type { Id } from "@/convex/_generated/dataModel";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
  onOpenPost?: (postId: string) => void;
  onOpenProfile?: (userId: string) => void;
  onOpenGroup?: (groupId: string) => void;
}

type FeedFilter = "all" | "mine";

type CommunityGroup = {
  _id: string;
  name: string;
  color: string;
  emoji?: string;
  isMember: boolean;
};

type CommunityFeedPost = {
  _id: Id<"publications">;
  isMine: boolean;
  [key: string]: unknown;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
} as const;

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 18,
          opacity,
        },
        style,
      ]}
    />
  );
}

function PostSkeleton() {
  return (
    <View style={styles.postSkeleton}>
      <View style={styles.postSkeletonHead}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: 14 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton style={{ width: 140, height: 12, borderRadius: 6 }} />
          <Skeleton style={{ width: 80, height: 10, borderRadius: 5 }} />
        </View>
      </View>
      <Skeleton style={{ height: 18, borderRadius: 9, marginTop: 14 }} />
      <Skeleton
        style={{ height: 14, width: "70%", borderRadius: 7, marginTop: 8 }}
      />
      <Skeleton style={{ height: 170, borderRadius: 18, marginTop: 14 }} />
      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <Skeleton style={{ flex: 1, height: 34, borderRadius: 12 }} />
        <Skeleton style={{ flex: 1, height: 34, borderRadius: 12 }} />
        <Skeleton style={{ flex: 1, height: 34, borderRadius: 12 }} />
      </View>
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCta,
  ctaColor = T.primary,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaColor?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={30} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [
            styles.emptyCta,
            {
              backgroundColor: ctaColor,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Plus size={15} color="#fff" />
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GROUP BUBBLE
   ════════════════════════════════════════════════════════════════════════════ */

function GroupBubble({
  group,
  onPress,
  index,
}: {
  group: CommunityGroup;
  onPress: () => void;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: Math.min(index * 40, 300),
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  const color = group.color || T.primary;

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ scale: Animated.multiply(enter, scale) }],
      }}
    >
      <Pressable onPress={handlePress} style={styles.groupBubble}>
        <View
          style={[
            styles.groupAvatar,
            {
              backgroundColor: group.isMember
                ? alpha(color, 0.22)
                : "rgba(255,255,255,0.05)",
              borderColor: group.isMember
                ? alpha(color, 0.45)
                : "rgba(255,255,255,0.12)",
            },
          ]}
        >
          <Users size={18} color={group.isMember ? color : T.dim} />
          {group.isMember && group.emoji && (
            <View style={styles.groupEmojiBadge}>
              <Text style={styles.groupEmojiText}>{group.emoji}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={styles.groupName}>
          {group.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FLOATING ACTION BUTTON
   ════════════════════════════════════════════════════════════════════════════ */

function FloatingComposeButton({ onPress }: { onPress: () => void }) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: 350,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.fabWrap,
        {
          opacity: enter,
          transform: [
            {
              scale: Animated.multiply(
                enter,
                scale.interpolate({
                  inputRange: [0.9, 1],
                  outputRange: [0.9, 1],
                  extrapolate: "clamp",
                }),
              ),
            },
          ],
        },
      ]}
    >
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.fab, { transform: [{ scale }] }]}>
          <Plus size={24} color="#fff" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HERO STATS
   ════════════════════════════════════════════════════════════════════════════ */

function HeroStats({
  postCount,
  groupCount,
  memberCount,
}: {
  postCount: number;
  groupCount: number;
  memberCount: number;
}) {
  return (
    <View style={styles.heroStats}>
      <View pointerEvents="none" style={styles.heroStatsGlow} />

      <View style={styles.heroStatsHead}>
        <View style={styles.heroStatsIcon}>
          <Sparkles size={16} color={T.primarySoft} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.heroStatsTitle}>Ta communauté</Text>
          <Text style={styles.heroStatsSubtitle}>
            Reste connecté, partage, inspire
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>Live</Text>
        </View>
      </View>

      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatBox}>
          <Text style={styles.heroStatValue}>{postCount}</Text>
          <Text style={styles.heroStatLabel}>Publications</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStatBox}>
          <Text style={styles.heroStatValue}>{groupCount}</Text>
          <Text style={styles.heroStatLabel}>Groupes</Text>
        </View>
        <View style={styles.heroStatDivider} />
        <View style={styles.heroStatBox}>
          <Text style={styles.heroStatValue}>{memberCount}</Text>
          <Text style={styles.heroStatLabel}>Membres</Text>
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function CommunityPage({
  onBack,
  onOpenPost,
  onOpenGroup,
}: Props) {
  const { user } = useFirebaseAuth();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [showCompose, setShowCompose] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Data */
  const { posts, groups, likePost, deletePost, votePoll, joinGroup } =
    useCommunity(debouncedSearch);

  const typedGroups = (groups ?? []) as unknown as CommunityGroup[];
  const typedPosts = (posts ?? []) as unknown as CommunityFeedPost[];

  /* Filtre local */
  const filtered = useMemo(
    () =>
      activeFilter === "mine" ? typedPosts.filter((p) => p.isMine) : typedPosts,
    [typedPosts, activeFilter],
  );

  /* Stats dérivées */
  const memberCount = useMemo(
    () => typedGroups.filter((g) => g.isMember).length,
    [typedGroups],
  );

  /* Handlers */
  const handleLike = useCallback(
    async (publicationId: Id<"publications">) => {
      if (!user) {
        toast.error("Connecte-toi pour réagir");
        return;
      }
      try {
        await likePost({ publicationId });
      } catch {
        toast.error("Erreur lors du like");
      }
    },
    [user, likePost],
  );

  const handleDelete = useCallback(
    async (publicationId: Id<"publications">) => {
      try {
        await deletePost({ publicationId });
        toast.success("Post supprimé");
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    },
    [deletePost],
  );

  const handleVote = useCallback(
    async (publicationId: Id<"publications">, optionId: string) => {
      if (!user) {
        toast.error("Connecte-toi pour voter");
        return;
      }
      try {
        await votePoll({ publicationId, optionId });
        toast.success("Vote enregistré");
      } catch {
        toast.error("Erreur lors du vote");
      }
    },
    [user, votePoll],
  );

  const handleBookmark = useCallback(() => {
    toast.info("Favoris bientôt disponibles");
  }, []);

  const handleJoinGroup = useCallback(
    async (groupId: string) => {
      if (!user) {
        toast.error("Connecte-toi pour rejoindre un groupe");
        return;
      }
      try {
        const res = await joinGroup({ groupId: groupId as Id<"groups"> });
        toast.success(
          (res as { joined?: boolean }).joined
            ? "Groupe rejoint !"
            : "Groupe quitté",
        );
      } catch {
        toast.error("Erreur lors de l'action sur le groupe");
      }
    },
    [user, joinGroup],
  );

  const handleOpenPost = useCallback(
    (postId: string) => {
      if (onOpenPost) {
        onOpenPost(postId);
      } else {
        toast.info("Détail du post bientôt disponible");
      }
    },
    [onOpenPost],
  );

  const handleOpenGroup = useCallback(
    (groupId: string) => {
      if (onOpenGroup) {
        onOpenGroup(groupId);
      } else {
        toast.info("Détail du groupe bientôt disponible");
      }
    },
    [onOpenGroup],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const switchFilter = useCallback(
    (next: FeedFilter) => {
      if (next === activeFilter) return;
      Animated.parallel([
        Animated.timing(panelOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslate, {
          toValue: 6,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveFilter(next);
        Animated.parallel([
          Animated.timing(panelOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(panelTranslate, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [activeFilter, panelOpacity, panelTranslate],
  );

  /* Render item */
  const renderPost = useCallback(
    ({ item, index }: { item: CommunityFeedPost; index: number }) => (
      <CommunityCard
        post={item}
        index={index}
        onLike={() => handleLike(item._id)}
        onComment={() => handleOpenPost(item._id)}
        onShare={() => toast.info("Partage bientôt disponible")}
        onBookmark={() => handleBookmark()}
        onVote={(optionId: string) => handleVote(item._id, optionId)}
        onNavigate={() => handleOpenPost(item._id)}
      />
    ),
    [handleLike, handleOpenPost, handleBookmark, handleVote],
  );

  const keyExtractor = useCallback((item: CommunityFeedPost) => item._id, []);

  const isLoading = posts === undefined;

  /* ── Rendu ─────────────────────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.headerBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={19} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={styles.title}>Community</Text>
              <View style={styles.betaPill}>
                <View style={styles.liveDotSmall} />
                <Text style={styles.betaPillText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Rejoindre · Organiser · Partager
            </Text>
          </View>

          <Pressable
            onPress={() => setShowCompose(true)}
            style={({ pressed }) => [
              styles.composeBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Search size={15} color={T.faint} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Rechercher dans les posts…"
            placeholderTextColor={T.faint}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => setSearchInput("")} hitSlop={10}>
              <X size={15} color={T.faint} />
            </Pressable>
          )}
        </View>

        {/* Groupes */}
        {typedGroups.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <View style={styles.groupsHead}>
              <Users size={11} color={T.faint} />
              <Text style={styles.groupsTitle}>MES GROUPES</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 12,
                paddingRight: 20,
                paddingTop: 2,
              }}
              style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
            >
              {typedGroups.map((g, i) => (
                <GroupBubble
                  key={g._id}
                  group={g}
                  index={i}
                  onPress={() => {
                    if (g.isMember) {
                      handleOpenGroup(g._id);
                    } else {
                      void handleJoinGroup(g._id);
                    }
                  }}
                />
              ))}

              <Pressable
                onPress={() => toast.info("Rejoindre un groupe bientôt")}
                style={styles.groupBubble}
              >
                <View style={styles.groupAdd}>
                  <Plus size={16} color={T.faint} />
                </View>
                <Text style={styles.groupName}>Rejoindre</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* Filtres */}
        <View style={styles.segmented}>
          {(
            [
              { id: "all" as FeedFilter, label: "Tous les posts" },
              { id: "mine" as FeedFilter, label: "Mes posts" },
            ] as const
          ).map(({ id, label }) => {
            const active = activeFilter === id;
            return (
              <Pressable
                key={id}
                onPress={() => switchFilter(id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Liste */}
      {isLoading ? (
        <View style={styles.listPad}>
          <PostSkeleton />
          <PostSkeleton />
        </View>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslate }],
          }}
        >
          <FlatList
            data={filtered}
            renderItem={renderPost}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 120,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={T.primarySoft}
                colors={[T.primary]}
              />
            }
            ListHeaderComponent={
              filtered.length > 0 ? (
                <HeroStats
                  postCount={filtered.length}
                  groupCount={typedGroups.length}
                  memberCount={memberCount}
                />
              ) : null
            }
            ListHeaderComponentStyle={{ marginBottom: 16 }}
            ListEmptyComponent={
              <EmptyState
                icon={activeFilter === "mine" ? Smile : TrendingUp}
                title={
                  activeFilter === "mine"
                    ? "Aucun post personnel"
                    : "Aucun post trouvé"
                }
                message={
                  activeFilter === "mine"
                    ? "Partage ta première idée avec la communauté."
                    : "Sois le premier à lancer une discussion ou change ton filtre."
                }
                ctaLabel={activeFilter === "mine" ? "Créer un post" : undefined}
                onCta={
                  activeFilter === "mine"
                    ? () => setShowCompose(true)
                    : undefined
                }
              />
            }
          />
        </Animated.View>
      )}

      {/* FAB */}
      <FloatingComposeButton onPress={() => setShowCompose(true)} />

      {/* Sheet de création */}
      <CreatePostSheet
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSuccess={() => {
          /* toast géré dans le Sheet */
        }}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.12),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  composeBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  betaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: alpha(T.primary, 0.18),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.38),
  },
  betaPillText: {
    color: T.primarySoft,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  liveDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#4ADE80",
  },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },

  /* Groupes */
  groupsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  groupsTitle: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  groupBubble: {
    alignItems: "center",
    gap: 6,
    width: 68,
  },
  groupAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    position: "relative",
  },
  groupEmojiBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E0E14",
    borderWidth: 1,
    borderColor: T.borderUp,
  },
  groupEmojiText: { fontSize: 11 },
  groupName: {
    color: T.dim,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 13,
  },
  groupAdd: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.16)",
  },

  /* Segmented */
  segmented: {
    flexDirection: "row",
    gap: 3,
    marginTop: 18,
    padding: 3,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: T.primary },
  segmentText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },

  /* Hero stats */
  heroStats: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: alpha(T.primary, 0.09),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.28),
    overflow: "hidden",
    gap: 16,
  },
  heroStatsGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: T.primary,
    opacity: 0.1,
  },
  heroStatsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroStatsIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.2),
  },
  heroStatsTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  heroStatsSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.success, 0.15),
    borderWidth: 1,
    borderColor: alpha(T.success, 0.32),
  },
  livePillText: {
    color: "#4ADE80",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStatBox: { flex: 1, alignItems: "center", gap: 4 },
  heroStatValue: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  /* Post skeleton */
  postSkeleton: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 0,
  },
  postSkeletonHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listPad: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },

  /* FAB */
  fabWrap: {
    position: "absolute",
    bottom: 32,
    right: 20,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 4,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 6,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  emptyCtaText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
  },
});
