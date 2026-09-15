// src/pages/home/_components/HomeActivityPulse.tsx
import {
  View,
  Pressable,
  Text,
  Image as RNImage,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export type HomeActivityPulseType =
  | "like"
  | "comment"
  | "message"
  | "follow"
  | "opportunity"
  | "success"
  | "recommendation"
  | "system"
  | "activity";

export interface HomeActivityPulseItem {
  id: string;
  type: HomeActivityPulseType;
  title: string;
  description?: string;
  timestamp: number | string | Date;
  read?: boolean;
  href?: string;
  moduleId?: string;
  actorName?: string;
  actorAvatar?: string;
  metadata?: {
    value?: string | number;
    label?: string;
    image?: string;
  };
}

export interface HomeActivityPulseStats {
  today?: number;
  thisWeek?: number;
  unread?: number;
  streak?: number;
}

interface HomeActivityPulseProps {
  items?: HomeActivityPulseItem[];
  stats?: HomeActivityPulseStats;
  loading?: boolean;
  onOpen?: () => void;
  onItemClick?: (item: HomeActivityPulseItem) => void;
  onMarkRead?: (item: HomeActivityPulseItem) => void;
  onMarkAllRead?: () => void;
  onNavigate?: (route: string) => void;
  maxItems?: number;
  className?: string;
  compact?: boolean;
}

/* ============================================================================
 * VISUAL SYSTEM
 * ========================================================================== */

const TYPE_CONFIG: Record<
  HomeActivityPulseType,
  { icon: typeof Activity; color: string; background: string; label: string }
> = {
  like: {
    icon: Heart,
    color: "#F43F5E",
    background: "rgba(244,63,94,0.16)",
    label: "Interaction",
  },
  comment: {
    icon: MessageCircle,
    color: "#8B5CF6",
    background: "rgba(139,92,246,0.16)",
    label: "Conversation",
  },
  message: {
    icon: MessageCircle,
    color: "#06B6D4",
    background: "rgba(6,182,212,0.16)",
    label: "Message",
  },
  follow: {
    icon: UserPlus,
    color: "#10B981",
    background: "rgba(16,185,129,0.16)",
    label: "Réseau",
  },
  opportunity: {
    icon: BriefcaseBusiness,
    color: "#F59E0B",
    background: "rgba(245,158,11,0.16)",
    label: "Opportunité",
  },
  success: {
    icon: CheckCircle2,
    color: "#22C55E",
    background: "rgba(34,197,94,0.16)",
    label: "Réussi",
  },
  recommendation: {
    icon: Sparkles,
    color: "#A78BFA",
    background: "rgba(167,139,250,0.16)",
    label: "Pour vous",
  },
  system: {
    icon: Bell,
    color: "#60A5FA",
    background: "rgba(96,165,250,0.16)",
    label: "Information",
  },
  activity: {
    icon: Activity,
    color: "#14B8A6",
    background: "rgba(20,184,166,0.16)",
    label: "Activité",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function toTimestamp(value: number | string | Date): number {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function formatRelativeTime(value: number | string | Date): string {
  const timestamp = toTimestamp(value);
  const diff = Math.max(0, Date.now() - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "À l'instant";
  if (diff < hour) return `Il y a ${Math.floor(diff / minute)} min`;
  if (diff < day) return `Il y a ${Math.floor(diff / hour)} h`;
  if (diff < 7 * day) return `Il y a ${Math.floor(diff / day)} j`;

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
    }).format(new Date(timestamp));
  } catch {
    const d = new Date(timestamp);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
}

function sortNewestFirst(items: HomeActivityPulseItem[]) {
  return [...items].sort(
    (a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp),
  );
}

/* ============================================================================
 * ENTRANCE WRAPPER
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 12,
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
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
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

/* ============================================================================
 * HEADER PULSING ICON
 * ========================================================================== */

function PulsingActivityIcon({ unreadCount }: { unreadCount: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(unreadCount > 0 ? 1 : 0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [halo]);

  useEffect(() => {
    Animated.spring(badgeAnim, {
      toValue: unreadCount > 0 ? 1 : 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 14,
    }).start();
  }, [unreadCount, badgeAnim]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.7],
  });
  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.headerIconWrap}>
      <Animated.View
        style={[
          styles.headerIconHalo,
          { opacity: haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      />
      <Animated.View
        style={[styles.headerIconHalo, { transform: [{ scale: glowScale }] }]}
      />
      <LinearGradient
        colors={["#5EEAD4", "#14B8A6", "#0D9488"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        <Activity size={15} color="#fff" strokeWidth={2.2} />
      </LinearGradient>

      {unreadCount > 0 ? (
        <Animated.View
          style={[
            styles.unreadDot,
            {
              opacity: badgeAnim,
              transform: [
                {
                  scale: badgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * PULSE STAT
 * ========================================================================== */

function PulseStat({
  Icon,
  value,
  label,
  color,
  delay,
}: {
  Icon: typeof Zap;
  value: number;
  label: string;
  color: string;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
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

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        {
          opacity: anim,
          transform: [
            { scale },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.statTile}
      >
        <LinearGradient
          colors={[`${color}22`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View
          style={[
            styles.statIcon,
            { backgroundColor: `${color}22`, borderColor: `${color}44` },
          ]}
        >
          <Icon size={11} color={color} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * ACTIVITY ROW
 * ========================================================================== */

function ActivityRow({
  item,
  index,
  isLast,
  onPress,
}: {
  item: HomeActivityPulseItem;
  index: number;
  isLast: boolean;
  onPress: () => void;
}) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.activity;
  const Icon = config.icon;
  const unread = item.read === false;

  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: 120 + index * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.99,
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

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateX }] }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          style={styles.activityRow}
        >
          {/* Timeline connector */}
          {!isLast ? (
            <View style={styles.timelineConnector} pointerEvents="none" />
          ) : null}

          {/* Actor / Icon */}
          <View style={styles.activityIconCol}>
            {item.actorAvatar ? (
              <View style={styles.activityAvatarWrap}>
                <RNImage
                  source={{ uri: item.actorAvatar }}
                  style={styles.activityAvatar}
                  accessibilityLabel={item.actorName ?? ""}
                />
                <View
                  style={[
                    styles.activityBadgeDot,
                    { backgroundColor: config.color },
                  ]}
                >
                  <Icon size={7} color="#fff" strokeWidth={3} />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.activityIcon,
                  {
                    backgroundColor: config.background,
                    borderColor: `${config.color}55`,
                  },
                ]}
              >
                <Icon size={14} color={config.color} />
              </View>
            )}

            {unread ? (
              <Animated.View
                style={[
                  styles.activityUnread,
                  { backgroundColor: config.color },
                ]}
              />
            ) : null}
          </View>

          {/* Content */}
          <View style={styles.activityContent}>
            <View style={styles.activityTitleRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[
                    styles.activityTitle,
                    {
                      color: unread
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(255,255,255,0.55)",
                      fontWeight: unread ? "800" : "600",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {item.actorName ? (
                    <Text style={{ fontWeight: "900", color: "#fff" }}>
                      {item.actorName}{" "}
                    </Text>
                  ) : null}
                  {item.title}
                </Text>

                {item.description ? (
                  <Text style={styles.activityDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.activityTime}>
                {formatRelativeTime(item.timestamp)}
              </Text>
            </View>

            {/* Metadata */}
            {item.metadata ? (
              <View style={styles.metadataRow}>
                {item.metadata.image ? (
                  <RNImage
                    source={{ uri: item.metadata.image }}
                    style={styles.metadataImage}
                    accessibilityLabel=""
                  />
                ) : null}
                {item.metadata.value !== undefined ? (
                  <View
                    style={[
                      styles.metadataBadge,
                      { backgroundColor: `${config.color}1F` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.metadataBadgeText,
                        { color: config.color },
                      ]}
                      numberOfLines={1}
                    >
                      {item.metadata.value}
                    </Text>
                  </View>
                ) : null}
                {item.metadata.label ? (
                  <Text style={styles.metadataLabel} numberOfLines={1}>
                    {item.metadata.label}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Arrow */}
          <View style={styles.activityArrow}>
            <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyActivity({ onOpen }: { onOpen?: () => void }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <FadeUp distance={14}>
      <View style={styles.emptyCard}>
        <LinearGradient
          colors={[
            "rgba(20,184,166,0.14)",
            "rgba(15,7,32,0.65)",
            "rgba(10,6,24,0.9)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyOrb} pointerEvents="none" />
        <View style={styles.emptyBorder} pointerEvents="none" />

        <View style={styles.emptyRow}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <LinearGradient
              colors={["rgba(94,234,212,0.28)", "rgba(20,184,166,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <Activity size={20} color="#5EEAD4" />
            </LinearGradient>
          </Animated.View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.emptyTitle}>Votre espace est calme</Text>
            <Text style={styles.emptySub}>
              Les interactions, opportunités et événements importants
              apparaîtront ici.
            </Text>
          </View>

          {onOpen ? (
            <Pressable
              onPress={onOpen}
              accessibilityLabel="Ouvrir l'activité"
              hitSlop={8}
              style={({ pressed }) => [
                styles.emptyArrowBtn,
                pressed && styles.pressed,
              ]}
            >
              <ArrowRight size={12} color="rgba(255,255,255,0.75)" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function ActivityPulseSkeleton({ compact }: { compact: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <View style={[styles.skeletonRoot, compact && { marginTop: 8 }]}>
      {/* Header */}
      <View style={styles.skeletonHeader}>
        <Animated.View style={[styles.skeletonLogo, { opacity }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <Animated.View style={[styles.skeletonLine1, { opacity }]} />
          <Animated.View style={[styles.skeletonLine2, { opacity }]} />
        </View>
      </View>

      {/* Stats */}
      <View style={{ gap: 8, marginBottom: 12 }}>
        {[0, 1, 2].map((i) => (
          <Animated.View key={i} style={[styles.skeletonStat, { opacity }]} />
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.skeletonTimeline}>
        {[0, 1, 2, 3].map((i, idx) => (
          <Animated.View
            key={i}
            style={[
              styles.skeletonRow,
              idx < 3 && styles.skeletonRowBorder,
              { opacity },
            ]}
          >
            <View style={styles.skeletonRowIcon} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.skeletonRowLine1} />
              <View style={styles.skeletonRowLine2} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function HomeActivityPulse({
  items = [],
  stats,
  loading = false,
  onOpen,
  onItemClick,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  maxItems = 5,
  compact = false,
}: HomeActivityPulseProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const orderedItems = useMemo(
    () => sortNewestFirst(items).slice(0, maxItems),
    [items, maxItems],
  );

  const unreadCount =
    stats?.unread ?? items.filter((item) => item.read === false).length;

  const todayCount =
    stats?.today ??
    items.filter(
      (item) => now - toTimestamp(item.timestamp) < 24 * 60 * 60 * 1000,
    ).length;

  const weekCount =
    stats?.thisWeek ??
    items.filter(
      (item) => now - toTimestamp(item.timestamp) < 7 * 24 * 60 * 60 * 1000,
    ).length;

  const handleItemClick = useCallback(
    (item: HomeActivityPulseItem) => {
      if (!item.read) onMarkRead?.(item);
      if (item.href) {
        onNavigate?.(item.href);
        return;
      }
      onItemClick?.(item);
    },
    [onItemClick, onMarkRead, onNavigate],
  );

  if (loading) {
    return <ActivityPulseSkeleton compact={compact} />;
  }

  return (
    <View style={[styles.root, compact && { marginTop: 8 }]}>
      {/* ───── HEADER ───── */}
      <FadeUp distance={10}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <PulsingActivityIcon unreadCount={unreadCount} />

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Votre activité
                </Text>
                {unreadCount > 0 ? (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadPillText}>
                      {unreadCount} nouveau{unreadCount > 1 ? "x" : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.headerSub}>Ce qui bouge autour de vous</Text>
            </View>
          </View>

          <Pressable
            onPress={onOpen}
            accessibilityLabel="Voir toute l'activité"
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerLink,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.headerLinkText}>Tout voir</Text>
            <ChevronRight size={11} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>
      </FadeUp>

      {/* ───── STATS ───── */}
      <View style={styles.statsCol}>
        <PulseStat
          Icon={Zap}
          value={todayCount}
          label="aujourd'hui"
          color="#14B8A6"
          delay={60}
        />
        <PulseStat
          Icon={TrendingUp}
          value={weekCount}
          label="cette semaine"
          color="#8B5CF6"
          delay={120}
        />
        <PulseStat
          Icon={Clock3}
          value={unreadCount}
          label="à découvrir"
          color="#F59E0B"
          delay={180}
        />
      </View>

      {/* ───── EMPTY ───── */}
      {orderedItems.length === 0 ? <EmptyActivity onOpen={onOpen} /> : null}

      {/* ───── TIMELINE ───── */}
      {orderedItems.length > 0 ? (
        <FadeUp delay={200}>
          <View style={styles.timelineCard}>
            <LinearGradient
              colors={[
                "rgba(20,184,166,0.08)",
                "rgba(12,10,28,0.65)",
                "rgba(10,6,24,0.9)",
              ]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.timelineBorder} pointerEvents="none" />
            <View style={styles.timelineOrb} pointerEvents="none" />

            <View style={{ position: "relative" }}>
              {orderedItems.map((item, index) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  index={index}
                  isLast={index === orderedItems.length - 1}
                  onPress={() => handleItemClick(item)}
                />
              ))}
            </View>

            {items.length > maxItems ? (
              <Pressable
                onPress={onOpen}
                style={({ pressed }) => [
                  styles.moreBtn,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={styles.moreBtnText}>
                  Voir les {items.length - maxItems} autres activités
                </Text>
                <ArrowRight size={11} color="rgba(255,255,255,0.5)" />
              </Pressable>
            ) : null}
          </View>
        </FadeUp>
      ) : null}

      {/* ───── MARK ALL ───── */}
      {unreadCount > 0 && onMarkAllRead ? (
        <FadeUp delay={320} distance={6}>
          <Pressable
            onPress={onMarkAllRead}
            hitSlop={8}
            style={({ pressed }) => [
              styles.markAllBtn,
              pressed && { opacity: 0.65 },
            ]}
          >
            <CheckCircle2 size={10} color="rgba(255,255,255,0.4)" />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </Pressable>
        </FadeUp>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  pressed: { opacity: 0.85 },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconHalo: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(94,234,212,0.4)",
  },
  headerIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#14B8A6",
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#22D3EE",
    borderWidth: 2,
    borderColor: "#09090D",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.95,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: -0.3,
  },
  unreadPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  unreadPillText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#93C5FD",
    letterSpacing: 0.4,
  },
  headerSub: {
    marginTop: 3,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  headerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  headerLinkText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.2,
  },

  // ── Stats
  statsCol: {
    gap: 8,
    marginBottom: 12,
  },
  statTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },

  // ── Timeline
  timelineCard: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  timelineBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(94,234,212,0.1)",
  },
  timelineOrb: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(20,184,166,0.2)",
  },

  // ── Activity Row
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "relative",
  },
  timelineConnector: {
    position: "absolute",
    left: 30,
    top: 54,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  activityIconCol: {
    position: "relative",
    zIndex: 10,
  },
  activityAvatarWrap: {
    position: "relative",
    width: 36,
    height: 36,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 13,
  },
  activityBadgeDot: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#111117",
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  activityUnread: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#111117",
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  activityTitle: {
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  activityDescription: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  activityTime: {
    fontSize: 9,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
    paddingTop: 2,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metadataImage: {
    width: 28,
    height: 28,
    borderRadius: 9,
  },
  metadataBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metadataBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  metadataLabel: {
    flex: 1,
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  activityArrow: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },

  // ── More button
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  moreBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.2,
  },

  // ── Mark all
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "center",
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.2,
  },

  // ── Empty
  emptyCard: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.5)",
    padding: 20,
  },
  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(94,234,212,0.1)",
  },
  emptyOrb: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(20,184,166,0.16)",
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(94,234,212,0.3)",
    shadowColor: "#14B8A6",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  emptyTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  emptySub: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  emptyArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  // ── Skeleton
  skeletonRoot: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  skeletonLogo: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonLine1: {
    height: 10,
    width: 96,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonLine2: {
    height: 8,
    width: 128,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  skeletonStat: {
    height: 46,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  skeletonTimeline: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  skeletonRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  skeletonRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonRowLine1: {
    height: 9,
    width: "72%",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonRowLine2: {
    height: 7,
    width: "45%",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});
