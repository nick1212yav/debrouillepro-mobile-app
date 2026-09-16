// src/pages/modules/DecouvertePage.tsx
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image as RNImage,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Car,
  ChevronRight,
  Eye,
  Flame,
  HandHeart,
  Hash,
  Heart,
  Home,
  Leaf,
  MapPin,
  MessageCircle,
  Newspaper,
  Package,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.js";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: Id<"users">) => void;
}

type Tab = "tendances" | "tags" | "utilisateurs" | "categories";

type TrendingPub = {
  _id: Id<"publications">;
  title: string;
  description: string;
  type: string;
  tags: string[];
  images: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  score: number;
  authorName: string;
  authorAvatar?: string;
  location?: string;
};

type TrendingTag = { tag: string; count: number; likeCount: number };

type SuggestedUser = {
  _id: Id<"users">;
  name: string;
  avatar?: string;
  bio?: string;
  city?: string;
  role?: string;
  followerCount: number;
};

type CategorySpot = { type: string; count: number; likeCount: number };

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
  pink: "#EC4899",
  pinkSoft: "#F9A8D4",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
  cyan: "#22D3EE",
} as const;

const TYPE_META: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  immo: { label: "Immobilier", color: "#10B981", icon: Home },
  job: { label: "Emploi", color: "#8B5CF6", icon: Briefcase },
  service: { label: "Services", color: "#F97316", icon: Package },
  evenement: { label: "Événements", color: "#EC4899", icon: CalendarDays },
  community: { label: "Community", color: "#3B82F6", icon: Users },
  agri: { label: "Agriculture", color: "#22C55E", icon: Leaf },
  sante: { label: "Santé", color: "#EF4444", icon: Heart },
  transport: { label: "Transport", color: "#3B82F6", icon: Car },
  annonce: { label: "Annonces", color: "#F59E0B", icon: Newspaper },
  restauration: { label: "Restau.", color: "#F97316", icon: ShoppingBag },
  hebergement: { label: "Hébergement", color: "#0EA5E9", icon: Plane },
  energie: { label: "Énergie", color: "#FBBF24", icon: Zap },
  ong: { label: "ONG", color: "#10B981", icon: HandHeart },
};

const TAG_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F97316",
  "#EF4444",
  "#F59E0B",
  "#06B6D4",
  "#A78BFA",
  "#22C55E",
];

const ROLE_LABEL: Record<string, string> = {
  particulier: "Particulier",
  professionnel: "Professionnel",
  entreprise: "Entreprise",
};

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "tendances", label: "Tendances", icon: TrendingUp },
  { id: "tags", label: "Tags", icon: Hash },
  { id: "utilisateurs", label: "Personnes", icon: Users },
  { id: "categories", label: "Catégories", icon: Sparkles },
];

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

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
          borderRadius: 16,
          opacity,
        },
        style,
      ]}
    />
  );
}

function SectionHeader({
  icon: Icon,
  color,
  label,
  count,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionHead}>
      <View
        style={[styles.sectionIcon, { backgroundColor: alpha(color, 0.16) }]}
      >
        <Icon size={13} color={color} />
      </View>
      <Text style={styles.sectionLabel}>{label}</Text>
      {typeof count === "number" && (
        <View style={styles.sectionCountPill}>
          <Text style={styles.sectionCountText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={26} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TRENDING SECTION
   ════════════════════════════════════════════════════════════════════════════ */

function TrendingSection({
  pubs,
  onNavigate,
}: {
  pubs: TrendingPub[] | undefined;
  onNavigate: (p: string) => void;
}) {
  if (pubs === undefined) return <TrendingSkeleton />;

  if (pubs.length === 0) {
    return (
      <EmptyState
        icon={Flame}
        title="Aucune tendance"
        message="Publie du contenu pour apparaître ici en premier."
      />
    );
  }

  const [top, ...rest] = pubs;

  return (
    <View style={{ gap: 18 }}>
      <SectionHeader icon={Flame} color={T.pink} label="En ce moment" />

      <FeaturedTrendCard pub={top} onNavigate={onNavigate} />

      {rest.length > 0 && (
        <View style={{ gap: 10 }}>
          {rest.map((pub, i) => (
            <TrendRow
              key={pub._id}
              pub={pub}
              rank={i + 2}
              onNavigate={onNavigate}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function FeaturedTrendCard({
  pub,
  onNavigate,
}: {
  pub: TrendingPub;
  onNavigate: (p: string) => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const meta = TYPE_META[pub.type];
  const color = meta?.color ?? T.primary;
  const Icon = meta?.icon;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, pulse]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    if (meta) onNavigate(pub.type);
  };

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ scale: Animated.multiply(enter, scale) }],
      }}
    >
      <Pressable onPress={handlePress}>
        <View
          style={[styles.featuredCard, { borderColor: alpha(color, 0.24) }]}
        >
          {/* Image / placeholder */}
          <View style={styles.featuredImageWrap}>
            {pub.images?.[0] ? (
              <RNImage
                source={{ uri: pub.images[0] }}
                style={styles.featuredImage}
                accessibilityLabel={pub.title}
              />
            ) : (
              <View
                style={[
                  styles.featuredPlaceholder,
                  { backgroundColor: alpha(color, 0.12) },
                ]}
              >
                {Icon && <Icon size={38} color={alpha(color, 0.55)} />}
              </View>
            )}
            <View pointerEvents="none" style={styles.featuredImageOverlay} />

            {/* Badge #1 Tendance animé */}
            <Animated.View
              style={[
                styles.hotBadge,
                {
                  transform: [
                    {
                      scale: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Flame size={11} color="#fff" fill="#fff" />
              <Text style={styles.hotBadgeText}>#1 Tendance</Text>
            </Animated.View>

            {meta && (
              <View
                style={[
                  styles.categoryBadgeOverlay,
                  { backgroundColor: alpha(color, 0.94) },
                ]}
              >
                <Text style={styles.categoryBadgeText}>{meta.label}</Text>
              </View>
            )}
          </View>

          {/* Contenu */}
          <View style={styles.featuredBody}>
            <Text numberOfLines={2} style={styles.featuredTitle}>
              {pub.title}
            </Text>
            {!!pub.description && (
              <Text numberOfLines={2} style={styles.featuredDesc}>
                {pub.description}
              </Text>
            )}

            {/* Auteur */}
            <View style={styles.featuredAuthorRow}>
              <View
                style={[
                  styles.featuredAuthorAvatar,
                  { backgroundColor: alpha(color, 0.18) },
                ]}
              >
                <Text style={[styles.featuredAuthorInitial, { color }]}>
                  {pub.authorName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.featuredAuthorName}>
                {pub.authorName}
              </Text>
              {!!pub.location && (
                <View style={styles.featuredLocation}>
                  <MapPin size={10} color={T.faint} />
                  <Text style={styles.featuredLocationText} numberOfLines={1}>
                    {pub.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.featuredStats}>
              <View style={styles.metaItem}>
                <Heart size={11} color={T.pink} fill={T.pink} />
                <Text style={styles.metaText}>{fmt(pub.likeCount)}</Text>
              </View>
              <View style={styles.metaItem}>
                <MessageCircle size={11} color={T.faint} />
                <Text style={styles.metaText}>{fmt(pub.commentCount)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Eye size={11} color={T.faint} />
                <Text style={styles.metaText}>{fmt(pub.viewCount)}</Text>
              </View>

              <View style={styles.scorePill}>
                <Star size={10} color={T.amberSoft} fill={T.amberSoft} />
                <Text style={styles.scorePillText}>Score {pub.score}</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TrendRow({
  pub,
  rank,
  onNavigate,
}: {
  pub: TrendingPub;
  rank: number;
  onNavigate: (p: string) => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const meta = TYPE_META[pub.type];
  const color = meta?.color ?? T.primary;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(rank * 40, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, rank]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => meta && onNavigate(pub.type)}
        style={({ pressed }) => [
          styles.trendRow,
          {
            borderColor: alpha(color, 0.22),
            backgroundColor: alpha(color, 0.06),
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        {/* Rank badge */}
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor: alpha(color, 0.22),
              borderColor: alpha(color, 0.4),
            },
          ]}
        >
          <Text style={[styles.rankText, { color }]}>#{rank}</Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {meta && (
            <Text numberOfLines={1} style={[styles.trendCategory, { color }]}>
              {meta.label.toUpperCase()}
            </Text>
          )}
          <Text numberOfLines={2} style={styles.trendTitle}>
            {pub.title}
          </Text>
          <View style={styles.trendStats}>
            <View style={styles.metaItemSmall}>
              <Heart size={9} color={T.pink} fill={T.pink} />
              <Text style={styles.metaTextSmall}>{fmt(pub.likeCount)}</Text>
            </View>
            <View style={styles.metaItemSmall}>
              <Eye size={9} color={T.faint} />
              <Text style={styles.metaTextSmall}>{fmt(pub.viewCount)}</Text>
            </View>
          </View>
        </View>

        <ChevronRight size={14} color={T.faint} />
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAGS SECTION
   ════════════════════════════════════════════════════════════════════════════ */

function TagsSection({ tags }: { tags: TrendingTag[] | undefined }) {
  if (tags === undefined) return <TagsSkeleton />;

  if (tags.length === 0) {
    return (
      <EmptyState
        icon={Hash}
        title="Aucun tag tendance"
        message="Utilise des #tags dans tes publications pour en voir ici."
      />
    );
  }

  const maxCount = tags[0]?.count ?? 1;

  return (
    <View style={{ gap: 18 }}>
      <SectionHeader icon={Hash} color={T.cyan} label="Tags populaires" />

      {/* Cloud de pills */}
      <View style={styles.tagsCloud}>
        {tags.slice(0, 15).map((t, i) => (
          <TagPill
            key={t.tag}
            tag={t.tag}
            color={TAG_COLORS[i % TAG_COLORS.length]}
            index={i}
          />
        ))}
      </View>

      {/* Liste avec progress bars */}
      <View style={{ gap: 10 }}>
        {tags.map((t, i) => {
          const color = TAG_COLORS[i % TAG_COLORS.length];
          const pct = Math.round((t.count / maxCount) * 100);
          return (
            <TagProgressRow
              key={t.tag}
              tag={t.tag}
              count={t.count}
              likeCount={t.likeCount}
              color={color}
              rank={i + 1}
              percent={pct}
              index={i}
            />
          );
        })}
      </View>
    </View>
  );
}

function TagPill({
  tag,
  color,
  index,
}: {
  tag: string;
  color: string;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: Math.min(index * 40, 400),
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            scale: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
        ],
      }}
    >
      <View
        style={[
          styles.tagPill,
          {
            backgroundColor: alpha(color, 0.14),
            borderColor: alpha(color, 0.36),
          },
        ]}
      >
        <Text style={[styles.tagPillText, { color }]}>#{tag}</Text>
      </View>
    </Animated.View>
  );
}

function TagProgressRow({
  tag,
  count,
  likeCount,
  color,
  rank,
  percent,
  index,
}: {
  tag: string;
  count: number;
  likeCount: number;
  color: string;
  rank: number;
  percent: number;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index * 40, 400),
      useNativeDriver: true,
    }).start();

    Animated.timing(barAnim, {
      toValue: percent,
      duration: 700,
      delay: 200 + index * 40,
      useNativeDriver: false,
    }).start();
  }, [enter, barAnim, index, percent]);

  return (
    <Animated.View
      style={[
        styles.tagRow,
        {
          opacity: enter,
          transform: [
            {
              translateX: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[styles.tagRankBadge, { backgroundColor: alpha(color, 0.18) }]}
      >
        <Text style={[styles.tagRankText, { color }]}>#{rank}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.tagRowHead}>
          <Text numberOfLines={1} style={styles.tagRowName}>
            #{tag}
          </Text>
          <Text style={styles.tagRowCount}>
            {count} post{count > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.tagRowTrack}>
          <Animated.View
            style={{
              height: "100%",
              borderRadius: 999,
              backgroundColor: color,
              width: barAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>
      </View>

      <View style={styles.tagLikes}>
        <Heart size={9} color={T.pink} fill={T.pink} />
        <Text style={styles.tagLikesText}>{fmt(likeCount)}</Text>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   USERS SECTION
   ════════════════════════════════════════════════════════════════════════════ */

function UsersSection({
  users,
  onFollow,
  onViewProfile,
  isAuthenticated,
}: {
  users: SuggestedUser[] | undefined;
  onFollow: (id: Id<"users">, name: string) => void;
  onViewProfile?: (id: Id<"users">) => void;
  isAuthenticated: boolean;
}) {
  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Users}
        title="Connecte-toi"
        message="Connecte-toi pour découvrir des personnes à suivre."
      />
    );
  }

  if (users === undefined) return <UsersSkeleton />;

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucune suggestion"
        message="Tu suis déjà tout le monde. Reviens plus tard !"
      />
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader
        icon={UserPlus}
        color={T.success}
        label="Personnes à suivre"
        count={users.length}
      />

      <View style={{ gap: 10 }}>
        {users.map((user, i) => (
          <UserRow
            key={user._id}
            user={user}
            index={i}
            onFollow={() => onFollow(user._id, user.name)}
            onPress={() => onViewProfile?.(user._id)}
          />
        ))}
      </View>
    </View>
  );
}

function UserRow({
  user,
  index,
  onFollow,
  onPress,
}: {
  user: SuggestedUser;
  index: number;
  onFollow: () => void;
  onPress: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const followScale = useRef(new Animated.Value(1)).current;
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 50, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handleFollow = () => {
    Animated.sequence([
      Animated.timing(followScale, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(followScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    setFollowed((v) => !v);
    onFollow();
  };

  const roleLabel = user.role ? (ROLE_LABEL[user.role] ?? user.role) : null;

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.userRow}>
        <Pressable onPress={onPress} hitSlop={8}>
          {user.avatar ? (
            <RNImage
              source={{ uri: user.avatar }}
              style={styles.userAvatar}
              accessibilityLabel={user.name}
            />
          ) : (
            <View style={[styles.userAvatar, styles.userAvatarFallback]}>
              <Text style={styles.userAvatarInitial}>
                {initials(user.name)}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.userNameRow}>
            <Text numberOfLines={1} style={styles.userName}>
              {user.name}
            </Text>
            {roleLabel && (
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleLabel}</Text>
              </View>
            )}
          </View>

          {!!user.bio && (
            <Text numberOfLines={1} style={styles.userBio}>
              {user.bio}
            </Text>
          )}

          <View style={styles.userMetaRow}>
            {!!user.city && (
              <View style={styles.userMetaItem}>
                <MapPin size={9} color={T.faint} />
                <Text numberOfLines={1} style={styles.userMetaText}>
                  {user.city}
                </Text>
              </View>
            )}
            <View style={styles.userMetaItem}>
              <Users size={9} color={T.faint} />
              <Text style={styles.userMetaText}>
                {fmt(user.followerCount)} abonné
                {user.followerCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        <Pressable onPress={handleFollow} hitSlop={8}>
          <Animated.View
            style={[
              styles.followBtn,
              followed && styles.followBtnActive,
              { transform: [{ scale: followScale }] },
            ]}
          >
            <UserPlus size={11} color={followed ? "#fff" : "#34D399"} />
            <Text style={[styles.followBtnText, followed && { color: "#fff" }]}>
              {followed ? "Suivi" : "Suivre"}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CATEGORIES SECTION
   ════════════════════════════════════════════════════════════════════════════ */

function CategoriesSection({
  categories,
  onNavigate,
}: {
  categories: CategorySpot[] | undefined;
  onNavigate: (p: string) => void;
}) {
  if (categories === undefined) return <CategoriesSkeleton />;

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Aucune catégorie"
        message="Les catégories actives apparaîtront ici."
      />
    );
  }

  const maxCount = categories[0]?.count ?? 1;

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader
        icon={Sparkles}
        color={T.primarySoft}
        label="Catégories actives"
        count={categories.length}
      />

      <View style={{ gap: 12 }}>
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.type}
            category={cat}
            index={i}
            maxCount={maxCount}
            onPress={() => onNavigate(cat.type)}
          />
        ))}
      </View>
    </View>
  );
}

function CategoryCard({
  category,
  index,
  maxCount,
  onPress,
}: {
  category: CategorySpot;
  index: number;
  maxCount: number;
  onPress: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const meta = TYPE_META[category.type];
  const color = meta?.color ?? TAG_COLORS[index % TAG_COLORS.length];
  const Icon = meta?.icon;
  const pct = Math.round((category.count / maxCount) * 100);

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: Math.min(index * 60, 400),
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();

    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 900,
      delay: 300 + index * 60,
      useNativeDriver: false,
    }).start();
  }, [enter, fillAnim, index, pct]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 100,
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
      style={{
        opacity: enter,
        transform: [{ scale: Animated.multiply(enter, scale) }],
      }}
    >
      <Pressable onPress={handlePress}>
        <View
          style={[
            styles.categoryCard,
            {
              backgroundColor: alpha(color, 0.06),
              borderColor: alpha(color, 0.22),
            },
          ]}
        >
          {/* Barre de fond animée */}
          <View pointerEvents="none" style={styles.categoryFillWrap}>
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: alpha(color, 0.08),
                width: fillAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              }}
            />
          </View>

          <View style={styles.categoryHead}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: alpha(color, 0.18) },
              ]}
            >
              {Icon && <Icon size={18} color={color} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={styles.categoryTitle}>
                {meta?.label ?? category.type}
              </Text>
              <Text style={styles.categoryCount}>
                {category.count} publication{category.count > 1 ? "s" : ""}
              </Text>
            </View>
            <ChevronRight size={16} color={T.faint} />
          </View>

          <View style={styles.categoryFoot}>
            <View style={styles.metaItemSmall}>
              <Heart size={10} color={T.pink} fill={T.pink} />
              <Text style={styles.metaTextSmall}>
                {fmt(category.likeCount)} likes
              </Text>
            </View>
            <View style={styles.categoryProgressPill}>
              <Text style={[styles.categoryProgressText, { color }]}>
                {pct}%
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SKELETONS
   ════════════════════════════════════════════════════════════════════════════ */

function TrendingSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <Skeleton style={{ height: 16, width: 130, borderRadius: 8 }} />
      <Skeleton style={{ height: 280, borderRadius: 26 }} />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} style={{ height: 90, borderRadius: 18 }} />
      ))}
    </View>
  );
}

function TagsSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <Skeleton style={{ height: 16, width: 140, borderRadius: 8 }} />
      <View style={styles.tagsCloud}>
        {[60, 90, 72, 110, 80, 100, 65, 95].map((w, i) => (
          <Skeleton
            key={i}
            style={{ height: 30, width: w, borderRadius: 16 }}
          />
        ))}
      </View>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} style={{ height: 58, borderRadius: 16 }} />
      ))}
    </View>
  );
}

function UsersSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <Skeleton style={{ height: 16, width: 160, borderRadius: 8 }} />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} style={{ height: 80, borderRadius: 20 }} />
      ))}
    </View>
  );
}

function CategoriesSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <Skeleton style={{ height: 16, width: 140, borderRadius: 8 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} style={{ height: 120, borderRadius: 22 }} />
      ))}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function DecouvertePage({
  onBack,
  onNavigate,
  onViewProfile,
}: Props) {
  const [tab, setTab] = useState<Tab>("tendances");
  const { isAuthenticated } = useConvexAuth();

  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  const trendingPubs = useQuery(api.discover.trendingPublications, {
    limit: 12,
  });
  const trendingTags = useQuery(api.discover.trendingTags, {});
  const suggestedUsers = useQuery(
    api.discover.suggestedUsers,
    isAuthenticated ? {} : "skip",
  );
  const categories = useQuery(api.discover.categorySpotlight, {});

  const followMutation = useMutation(api.follows.toggleFollow);

  const handleFollow = useCallback(
    async (userId: Id<"users">, name: string) => {
      if (!isAuthenticated) {
        toast("Connecte-toi pour suivre des utilisateurs");
        return;
      }
      try {
        await followMutation({ targetUserId: userId });
        toast.success(`Tu suis maintenant ${name} !`);
      } catch {
        toast.error("Impossible de suivre cet utilisateur");
      }
    },
    [isAuthenticated, followMutation],
  );

  const switchTab = useCallback(
    (next: Tab) => {
      if (next === tab) return;
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
        setTab(next);
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
    [tab, panelOpacity, panelTranslate],
  );

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={styles.title}>Découverte</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Tendances · Personnes · Contenu</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20, paddingTop: 16 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => switchTab(id)}
                style={({ pressed }) => [
                  styles.tabPill,
                  active && styles.tabPillActive,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Icon size={13} color={active ? T.pinkSoft : T.faint} />
                <Text
                  style={[
                    styles.tabPillText,
                    active && { color: T.pinkSoft, fontWeight: "900" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslate }],
          }}
        >
          {tab === "tendances" && (
            <TrendingSection
              pubs={trendingPubs as TrendingPub[] | undefined}
              onNavigate={onNavigate}
            />
          )}
          {tab === "tags" && (
            <TagsSection tags={trendingTags as TrendingTag[] | undefined} />
          )}
          {tab === "utilisateurs" && (
            <UsersSection
              users={suggestedUsers as SuggestedUser[] | undefined}
              onFollow={handleFollow}
              onViewProfile={onViewProfile}
              isAuthenticated={isAuthenticated}
            />
          )}
          {tab === "categories" && (
            <CategoriesSection
              categories={categories as CategorySpot[] | undefined}
              onNavigate={onNavigate}
            />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glowTop: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.pink, 0.1),
  },
  glowBottom: {
    position: "absolute",
    bottom: 40,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: alpha(T.primary, 0.08),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2, fontWeight: "600" },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: alpha(T.pink, 0.18),
    borderWidth: 1,
    borderColor: alpha(T.pink, 0.38),
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: T.pink,
  },
  livePillText: {
    color: T.pinkSoft,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  /* Tabs */
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  tabPillActive: {
    backgroundColor: alpha(T.pink, 0.16),
    borderColor: alpha(T.pink, 0.42),
  },
  tabPillText: { color: T.faint, fontSize: 12.5, fontWeight: "700" },

  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 60 },

  /* Section header */
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    color: T.dim,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    flex: 1,
  },
  sectionCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sectionCountText: {
    color: T.dim,
    fontSize: 10.5,
    fontWeight: "900",
  },

  /* Featured card */
  featuredCard: {
    borderRadius: 26,
    backgroundColor: T.card,
    borderWidth: 1,
    overflow: "hidden",
  },
  featuredImageWrap: { position: "relative", height: 190 },
  featuredImage: { width: "100%", height: "100%" },
  featuredPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  hotBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.92)",
  },
  hotBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  categoryBadgeOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  featuredBody: { padding: 16, gap: 10 },
  featuredTitle: {
    color: T.text,
    fontSize: 16.5,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  featuredDesc: {
    color: T.dim,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
  },
  featuredAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featuredAuthorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredAuthorInitial: {
    fontSize: 10.5,
    fontWeight: "900",
  },
  featuredAuthorName: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  featuredLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  featuredLocationText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
    maxWidth: 100,
  },
  featuredStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaItemSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "700",
  },
  metaTextSmall: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.amber, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.32),
  },
  scorePillText: {
    color: T.amberSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Trend row */
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  trendCategory: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  trendTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  trendStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
  },

  /* Tags cloud */
  tagsCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: -0.1,
  },

  /* Tag row */
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: T.border,
  },
  tagRankBadge: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tagRankText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  tagRowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 7,
  },
  tagRowName: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    flex: 1,
    letterSpacing: -0.1,
  },
  tagRowCount: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },
  tagRowTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  tagLikes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagLikesText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },

  /* User row */
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
  },
  userAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.18),
  },
  userAvatarInitial: {
    color: T.primarySoft,
    fontSize: 14,
    fontWeight: "900",
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  userName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: alpha(T.primary, 0.16),
  },
  rolePillText: {
    color: T.primarySoft,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  userBio: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    flexWrap: "wrap",
  },
  userMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userMetaText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: alpha(T.success, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.success, 0.32),
  },
  followBtnActive: {
    backgroundColor: alpha(T.success, 0.9),
    borderColor: T.success,
  },
  followBtnText: {
    color: "#34D399",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Category card */
  categoryCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    gap: 12,
  },
  categoryFillWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  categoryHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  categoryCount: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 3,
  },
  categoryFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryProgressPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  categoryProgressText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
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
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
});
