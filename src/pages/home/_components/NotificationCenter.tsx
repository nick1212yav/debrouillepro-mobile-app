// src/pages/home/_components/NotificationCenter.tsx
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  AccessibilityInfo,
  useWindowDimensions,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Heart,
  MessageCircle,
  UserPlus,
  Package,
  Bus,
  Leaf,
  Home,
  Briefcase,
  Users,
  BellOff,
  BellRing,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Pin,
  AlertCircle,
  CircleDollarSign,
  Megaphone,
  Newspaper,
  ShieldCheck,
  RefreshCw,
} from "lucide-react-native";

import { useNotifications } from "@/hooks/use-notifications";
import type { Id } from "@/convex/_generated/dataModel.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type NotifType =
  | "like"
  | "comment"
  | "follow"
  | "message"
  | "job"
  | "immo"
  | "payment"
  | "system"
  | "delivery"
  | "sante"
  | "agri"
  | "transport"
  | "community"
  | "boost"
  | "event"
  | "streak"
  | "digest"
  | "annonce";

type Priority = "high" | "normal" | "low";

interface NotificationItem {
  id: Id<"notifications">;
  type: NotifType;
  title: string;
  body: string;
  module: string;
  read: boolean;
  timestamp: number;
  pinned?: boolean;
  priority?: Priority;
  initials?: string;
  actionPage?: string;
  amount?: string;
  actionButtons?: Array<{
    label: string;
    variant: "primary" | "danger";
  }>;
}

interface Props {
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface TypeConfig {
  Icon: ComponentType<{ size?: number; color?: string; style?: any }>;
  color: string;
  background: string;
  label: string;
}

/* ============================================================================
 * TYPE CONFIG
 * ========================================================================== */

const TYPE_CONFIG: Record<NotifType, TypeConfig> = {
  like: {
    Icon: Heart,
    color: "#FB7185",
    background: "rgba(251,113,133,0.16)",
    label: "J'aime",
  },
  comment: {
    Icon: MessageCircle,
    color: "#60A5FA",
    background: "rgba(96,165,250,0.16)",
    label: "Commentaires",
  },
  follow: {
    Icon: UserPlus,
    color: "#A78BFA",
    background: "rgba(167,139,250,0.16)",
    label: "Réseau",
  },
  message: {
    Icon: MessageCircle,
    color: "#38BDF8",
    background: "rgba(56,189,248,0.16)",
    label: "Messages",
  },
  job: {
    Icon: Briefcase,
    color: "#A78BFA",
    background: "rgba(167,139,250,0.16)",
    label: "Emploi",
  },
  immo: {
    Icon: Home,
    color: "#FB923C",
    background: "rgba(251,146,60,0.16)",
    label: "Immobilier",
  },
  payment: {
    Icon: CircleDollarSign,
    color: "#34D399",
    background: "rgba(52,211,153,0.16)",
    label: "Finance",
  },
  system: {
    Icon: ShieldCheck,
    color: "#94A3B8",
    background: "rgba(148,163,184,0.12)",
    label: "Système",
  },
  delivery: {
    Icon: Package,
    color: "#FBBF24",
    background: "rgba(251,191,36,0.16)",
    label: "Livraison",
  },
  sante: {
    Icon: Heart,
    color: "#FB7185",
    background: "rgba(251,113,133,0.16)",
    label: "Santé",
  },
  agri: {
    Icon: Leaf,
    color: "#4ADE80",
    background: "rgba(74,222,128,0.16)",
    label: "Agriculture",
  },
  transport: {
    Icon: Bus,
    color: "#22D3EE",
    background: "rgba(34,211,238,0.16)",
    label: "Transport",
  },
  community: {
    Icon: Users,
    color: "#F472B6",
    background: "rgba(244,114,182,0.16)",
    label: "Communauté",
  },
  boost: {
    Icon: Sparkles,
    color: "#FBBF24",
    background: "rgba(251,191,36,0.16)",
    label: "Boost",
  },
  event: {
    Icon: CalendarDays,
    color: "#818CF8",
    background: "rgba(129,140,248,0.16)",
    label: "Événements",
  },
  streak: {
    Icon: BellRing,
    color: "#FB923C",
    background: "rgba(251,146,60,0.16)",
    label: "Série",
  },
  digest: {
    Icon: Newspaper,
    color: "#C084FC",
    background: "rgba(192,132,252,0.16)",
    label: "Résumé",
  },
  annonce: {
    Icon: Megaphone,
    color: "#F59E0B",
    background: "rgba(245,158,11,0.16)",
    label: "Annonce",
  },
};

/* ============================================================================
 * FILTERS
 * ========================================================================== */

const FILTERS = [
  { id: "all", label: "Tout", types: null },
  {
    id: "network",
    label: "Réseau",
    types: ["like", "comment", "follow", "community"] as NotifType[],
  },
  { id: "messages", label: "Messages", types: ["message"] as NotifType[] },
  {
    id: "opportunities",
    label: "Opportunités",
    types: [
      "job",
      "immo",
      "delivery",
      "transport",
      "agri",
      "event",
      "annonce",
    ] as NotifType[],
  },
  {
    id: "finance",
    label: "Finance",
    types: ["payment", "boost"] as NotifType[],
  },
  {
    id: "system",
    label: "Système",
    types: ["system", "streak", "digest", "sante"] as NotifType[],
  },
] as const;

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function normalizeNotification(
  n: ReturnType<typeof useNotifications>["notifs"][number],
): NotificationItem {
  return {
    id: n.id,
    type: n.type as NotifType,
    title: n.title,
    body: n.body,
    module: n.module,
    read: n.read,
    timestamp: n.timestamp,
    pinned: n.pinned,
    priority: n.priority as Priority,
    initials: n.initials,
    actionPage: n.actionPage,
    amount: n.amount,
    actionButtons: n.actionButtons,
  };
}

function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  try {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    const d = new Date(timestamp);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
}

function getConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type as NotifType] ?? TYPE_CONFIG.system;
}

/* ============================================================================
 * FADE UP
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
  style?: ViewStyle;
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
 * PULSING HEADER ICON
 * ========================================================================== */

function PulsingBellIcon() {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse, ring]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.7],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.headerIconWrap}>
      <Animated.View
        style={[
          styles.headerIconRing,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View
        style={[styles.headerIconHalo, { transform: [{ scale: glowScale }] }]}
      />
      <LinearGradient
        colors={["#A78BFA", "#7C3AED", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        <Bell size={18} color="#fff" strokeWidth={2.3} />
      </LinearGradient>
    </View>
  );
}

/* ============================================================================
 * LIVE DOT
 * ========================================================================== */

function LiveDot() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  return (
    <View style={styles.liveDotWrap}>
      <Animated.View
        style={[styles.liveDotPulse, { opacity, transform: [{ scale }] }]}
      />
      <View style={styles.liveDotCore} />
    </View>
  );
}

/* ============================================================================
 * PRIORITY BADGE
 * ========================================================================== */

function PriorityBadge({ priority }: { priority?: Priority }) {
  if (!priority || priority === "normal") return null;

  const high = priority === "high";

  return (
    <View
      style={[
        styles.priorityBadge,
        {
          backgroundColor: high
            ? "rgba(251,113,133,0.14)"
            : "rgba(148,163,184,0.1)",
        },
      ]}
    >
      {high ? <AlertCircle size={9} color="#FB7185" /> : null}
      <Text
        style={[styles.priorityText, { color: high ? "#FB7185" : "#94A3B8" }]}
      >
        {high ? "IMPORTANT" : "FAIBLE"}
      </Text>
    </View>
  );
}

/* ============================================================================
 * NOTIFICATION ICON
 * ========================================================================== */

function NotificationIcon({
  notification,
}: {
  notification: NotificationItem;
}) {
  const config = getConfig(notification.type);
  const Icon = config.Icon;

  if (notification.initials) {
    return (
      <View style={styles.notifIconWrap}>
        <View
          style={[styles.notifInitials, { backgroundColor: config.background }]}
        >
          <Text style={styles.notifInitialsText}>
            {notification.initials.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View
          style={[
            styles.notifIconBadge,
            {
              backgroundColor: "#0B0B18",
              borderColor: config.color,
            },
          ]}
        >
          <Icon size={10} color={config.color} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.notifIconWrap}>
      <View
        style={[styles.notifIconBg, { backgroundColor: config.background }]}
      >
        <Icon size={19} color={config.color} />
      </View>
      {!notification.read ? (
        <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * NOTIFICATION ROW
 * ========================================================================== */

function NotificationRow({
  notification,
  index,
  onMarkRead,
  onDismiss,
  onNavigate,
}: {
  notification: NotificationItem;
  index: number;
  onMarkRead: () => void;
  onDismiss: () => void;
  onNavigate: (page: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = getConfig(notification.type);
  const scale = useRef(new Animated.Value(1)).current;

  const handleOpen = useCallback(() => {
    if (!notification.read) onMarkRead();
    if (notification.actionPage) onNavigate(notification.actionPage);
  }, [notification, onMarkRead, onNavigate]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.985,
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
    <FadeUp delay={index * 40} distance={12}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={[
            styles.rowOuter,
            {
              borderColor: notification.read
                ? "rgba(255,255,255,0.06)"
                : `${config.color}44`,
            },
          ]}
        >
          <Pressable
            onPress={handleOpen}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={styles.rowInner}
          >
            {/* Unread accent bar */}
            {!notification.read ? (
              <View
                style={[
                  styles.rowAccentBar,
                  {
                    backgroundColor: config.color,
                    shadowColor: config.color,
                  },
                ]}
                pointerEvents="none"
              />
            ) : null}

            <NotificationIcon notification={notification} />

            {/* Body */}
            <View style={styles.rowBody}>
              <View style={styles.rowTitleWrap}>
                <Text
                  style={[
                    styles.rowTitle,
                    {
                      color: notification.read
                        ? "rgba(255,255,255,0.7)"
                        : "#fff",
                      fontWeight: notification.read ? "700" : "900",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {notification.title}
                </Text>
                {notification.pinned ? (
                  <Pin
                    size={11}
                    color="rgba(255,255,255,0.55)"
                    style={{ marginTop: 2 }}
                  />
                ) : null}
              </View>

              <Text style={styles.rowSub} numberOfLines={2}>
                {notification.body}
              </Text>

              <View style={styles.rowMetaRow}>
                <View
                  style={[
                    styles.moduleBadge,
                    { backgroundColor: config.background },
                  ]}
                >
                  <Text
                    style={[styles.moduleBadgeText, { color: config.color }]}
                    numberOfLines={1}
                  >
                    {notification.module || config.label}
                  </Text>
                </View>
                <View style={styles.metaDot} />
                <Text style={styles.rowTime}>
                  {formatRelativeTime(notification.timestamp)}
                </Text>
                <PriorityBadge priority={notification.priority} />
              </View>

              {notification.amount ? (
                <Text style={styles.rowAmount}>{notification.amount}</Text>
              ) : null}

              {notification.actionButtons &&
              notification.actionButtons.length > 0 ? (
                <View style={styles.rowActionsRow}>
                  {notification.actionButtons.map((action, i) => {
                    const danger = action.variant === "danger";
                    return (
                      <Pressable
                        key={`${action.label}-${i}`}
                        onPress={() => {
                          if (danger) onDismiss();
                        }}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          {
                            backgroundColor: danger
                              ? "rgba(251,113,133,0.1)"
                              : config.background,
                            borderColor: danger
                              ? "rgba(251,113,133,0.22)"
                              : `${config.color}33`,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            {
                              color: danger ? "#FB7185" : config.color,
                            },
                          ]}
                        >
                          {action.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {/* Chevron */}
            {notification.actionPage ? (
              <ChevronRight
                size={14}
                color="rgba(255,255,255,0.3)"
                style={{ marginLeft: 4 }}
              />
            ) : null}
          </Pressable>

          {/* Menu trigger */}
          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            accessibilityLabel="Options de notification"
            hitSlop={6}
            style={({ pressed }) => [
              styles.menuTrigger,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.menuTriggerText}>•••</Text>
          </Pressable>

          {/* Menu popup */}
          {menuOpen ? (
            <FadeUp distance={-6}>
              <View style={styles.menuPopup}>
                <LinearGradient
                  colors={["#14142A", "#0E0E1E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.menuPopupBorder} pointerEvents="none" />

                {!notification.read ? (
                  <Pressable
                    onPress={() => {
                      onMarkRead();
                      setMenuOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { backgroundColor: "rgba(255,255,255,0.05)" },
                    ]}
                  >
                    <CheckCheck size={12} color="rgba(255,255,255,0.65)" />
                    <Text style={styles.menuItemText}>Marquer comme lu</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={() => {
                    onDismiss();
                    setMenuOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { backgroundColor: "rgba(251,113,133,0.1)" },
                  ]}
                >
                  <Trash2 size={12} color="#FB7185" />
                  <Text style={[styles.menuItemText, { color: "#FB7185" }]}>
                    Supprimer
                  </Text>
                </Pressable>
              </View>
            </FadeUp>
          ) : null}
        </View>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyState({ total }: { total: number }) {
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
    outputRange: [0, -6],
  });

  return (
    <FadeUp distance={12}>
      <View style={styles.emptyWrap}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <LinearGradient
            colors={["rgba(167,139,250,0.28)", "rgba(99,102,241,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconWrap}
          >
            <BellOff size={28} color="#C4B5FD" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.emptyTitle}>
          {total === 0 ? "Rien à afficher ici" : "Tout est à jour"}
        </Text>
        <Text style={styles.emptySub}>
          Les nouvelles activités, messages, opportunités et alertes
          apparaîtront automatiquement ici.
        </Text>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function NotificationCenter({ onClose, onNavigate }: Props) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const {
    notifs: rawNotifications,
    unreadTotal,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications();

  const [filterId, setFilterId] = useState<string>("all");
  const [showRead, setShowRead] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [mounted, setMounted] = useState(true);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  /* ───── entrance ───── */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropAnim, slideAnim]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      onClose();
    });
  }, [backdropAnim, slideAnim, onClose]);

  /* ───── notifications data ───── */
  const notifications = useMemo(
    () =>
      rawNotifications.map(normalizeNotification).sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        if (Boolean(a.read) !== Boolean(b.read)) return a.read ? 1 : -1;
        return b.timestamp - a.timestamp;
      }),
    [rawNotifications],
  );

  const activeFilter = FILTERS.find((f) => f.id === filterId);

  const filteredNotifications = useMemo(() => {
    const types = activeFilter?.types ?? null;
    return notifications.filter((n) => {
      if (!showRead && n.read) return false;
      if (types && !types.includes(n.type)) return false;
      return true;
    });
  }, [activeFilter, notifications, showRead]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const filter of FILTERS) {
      const types = filter.types;
      counts[filter.id] = notifications.filter((n) => {
        if (n.read) return false;
        if (!types) return true;
        return types.includes(n.type);
      }).length;
    }
    return counts;
  }, [notifications]);

  /* ───── web escape key ───── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeSheet]);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadTotal === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await Promise.resolve(markAllRead());
    } finally {
      setIsMarkingAll(false);
    }
  }, [unreadTotal, isMarkingAll, markAllRead]);

  if (!mounted) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* ═══════════ BACKDROP ═══════════ */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable
          onPress={closeSheet}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Fermer"
        />
      </Animated.View>

      {/* ═══════════ SHEET ═══════════ */}
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: Math.min(SCREEN_HEIGHT * 0.92, 860),
            transform: [{ translateY }],
          },
        ]}
      >
        <LinearGradient
          colors={["#0C0A1F", "#0A0818", "#070512"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top ambient glow */}
        <View style={styles.topGlowWrap} pointerEvents="none">
          <LinearGradient
            colors={["rgba(167,139,250,0.35)", "rgba(167,139,250,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </View>

        <View style={styles.topLine} pointerEvents="none" />
        <View style={styles.borderRing} pointerEvents="none" />

        {/* ───── HANDLE ───── */}
        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <PulsingBellIcon />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Notifications
                </Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  Votre activité en temps réel
                </Text>
              </View>
              {unreadTotal > 0 ? (
                <View style={styles.unreadBadge}>
                  <LinearGradient
                    colors={["#FB7185", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.unreadBadgeText}>
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.headerActions}>
              {unreadTotal > 0 ? (
                <Pressable
                  disabled={isMarkingAll}
                  onPress={handleMarkAllRead}
                  style={({ pressed }) => [
                    styles.markAllBtn,
                    pressed && !isMarkingAll && styles.pressed,
                    isMarkingAll && { opacity: 0.5 },
                  ]}
                  accessibilityLabel="Tout marquer comme lu"
                >
                  {isMarkingAll ? (
                    <MarkAllSpinner />
                  ) : (
                    <CheckCheck size={13} color="#C4B5FD" />
                  )}
                  <Text style={styles.markAllBtnText}>Tout lire</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={closeSheet}
                accessibilityLabel="Fermer les notifications"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && styles.pressed,
                ]}
              >
                <X size={16} color="rgba(255,255,255,0.75)" />
              </Pressable>
            </View>
          </View>

          {/* Live status */}
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <LiveDot />
              <Text style={styles.statusText}>Synchronisé en temps réel</Text>
            </View>
            <Pressable
              onPress={() => setShowRead((v) => !v)}
              hitSlop={6}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.statusToggle}>
                {showRead ? "Masquer les lues" : "Afficher les lues"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ───── FILTERS ───── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((filter) => {
            const active = filter.id === filterId;
            const count = filterCounts[filter.id] ?? 0;
            return (
              <FilterChip
                key={filter.id}
                label={filter.label}
                count={count}
                active={active}
                onPress={() => setFilterId(filter.id)}
              />
            );
          })}
        </ScrollView>

        {/* ───── NOTIFICATIONS ───── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.length === 0 ? (
            <EmptyState total={filteredNotifications.length} />
          ) : (
            <View style={{ gap: 8 }}>
              {filteredNotifications.map((notification, index) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onMarkRead={() => markRead(notification.id)}
                  onDismiss={() => dismiss(notification.id)}
                  onNavigate={(page) => {
                    closeSheet();
                    onNavigate(page);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom fade */}
        <LinearGradient
          colors={["rgba(7,5,18,0)", "rgba(7,5,18,0.9)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * FILTER CHIP
 * ========================================================================== */

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.filterChip, active && styles.filterChipActive]}
      >
        {active ? (
          <LinearGradient
            colors={["rgba(167,139,250,0.35)", "rgba(124,58,237,0.2)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Text
          style={[styles.filterChipText, active && styles.filterChipTextActive]}
        >
          {label}
        </Text>
        {count > 0 ? (
          <View
            style={[
              styles.filterChipBadge,
              {
                backgroundColor: active ? "#7C3AED" : "rgba(255,255,255,0.1)",
              },
            ]}
          >
            <Text style={styles.filterChipBadgeText}>
              {count > 99 ? "99+" : count}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MARK ALL SPINNER
 * ========================================================================== */

function MarkAllSpinner() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <RefreshCw size={12} color="#C4B5FD" />
    </Animated.View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },

  /* ── Backdrop ───────────────────────────────────── */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  /* ── Sheet ──────────────────────────────────────── */
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.85,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 28,
  },
  topGlowWrap: {
    position: "absolute",
    top: -120,
    left: "20%",
    right: "20%",
    height: 200,
    opacity: 0.9,
  },
  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(167,139,250,0.4)",
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.16)",
  },

  /* ── Handle ─────────────────────────────────────── */
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconHalo: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(167,139,250,0.42)",
  },
  headerIconRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.65)",
  },
  headerIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  headerSub: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  markAllBtnText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#C4B5FD",
    letterSpacing: 0.1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* ── Status row ─────────────────────────────────── */
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.1,
  },
  statusToggle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#C4B5FD",
    letterSpacing: 0.1,
  },

  /* ── Live dot ───────────────────────────────────── */
  liveDotWrap: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotPulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  liveDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  /* ── Filters row ────────────────────────────────── */
  filtersRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  filterChipActive: {
    borderColor: "rgba(167,139,250,0.55)",
  },
  filterChipText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.1,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  filterChipBadge: {
    minWidth: 18,
    height: 16,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.1,
  },

  /* ── List ───────────────────────────────────────── */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  /* ── Row ────────────────────────────────────────── */
  rowOuter: {
    position: "relative",
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "visible",
  },
  rowInner: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    overflow: "hidden",
  },
  rowAccentBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingRight: 32,
  },
  rowTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  rowSub: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  moduleBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  rowTime: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
  },
  rowAmount: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "900",
    color: "#34D399",
    letterSpacing: -0.3,
  },
  rowActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* ── Priority ───────────────────────────────────── */
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  priorityText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1,
  },

  /* ── Notif icon ─────────────────────────────────── */
  notifIconWrap: {
    width: 44,
    height: 44,
    position: "relative",
  },
  notifIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  notifInitials: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  notifInitialsText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.4,
  },
  notifIconBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  unreadDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#0B0B18",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  /* ── Menu ───────────────────────────────────────── */
  menuTrigger: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  menuTriggerText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 14,
  },
  menuPopup: {
    position: "absolute",
    top: 36,
    right: 8,
    width: 172,
    borderRadius: 14,
    padding: 4,
    overflow: "hidden",
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  menuPopupBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
  },
  menuItemText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },

  /* ── Empty ──────────────────────────────────────── */
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  emptyTitle: {
    marginTop: 22,
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  emptySub: {
    marginTop: 8,
    maxWidth: 300,
    fontSize: 11.5,
    lineHeight: 17,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    fontWeight: "500",
  },

  /* ── Bottom fade ────────────────────────────────── */
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    pointerEvents: "none",
  },
});
