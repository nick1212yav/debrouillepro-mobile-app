import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ArrowLeft,
  Bell,
  BellRing,
  Briefcase,
  Check,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Heart,
  Home,
  Leaf,
  LogIn,
  MessageCircle,
  Moon,
  Package,
  Pin,
  Settings2,
  Sparkles,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Bus,
  X,
} from "lucide-react-native";

import { useConvexAuth } from "@/lib/convex-auth-compat";
import { useNotifications } from "@/hooks/use-notifications.ts";
import type { Notif, NotifType } from "@/hooks/use-notifications.ts";
import { SignInButton } from "@/components/ui/signin.tsx";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type NotificationIcon = ComponentType<IconProps>;

type TypeConfig = {
  icon: NotificationIcon;
  color: string;
  background: string;
};

type FilterConfig = {
  label: string;
  types: NotifType[] | null;
};

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const TYPE_CONFIG: Record<NotifType, TypeConfig> = {
  message: {
    icon: MessageCircle,
    color: "#3B82F6",
    background: "rgba(59,130,246,0.14)",
  },

  job: {
    icon: Briefcase,
    color: "#8B5CF6",
    background: "rgba(139,92,246,0.14)",
  },

  immo: {
    icon: Home,
    color: "#F97316",
    background: "rgba(249,115,22,0.14)",
  },

  payment: {
    icon: CreditCard,
    color: "#10B981",
    background: "rgba(16,185,129,0.14)",
  },

  system: {
    icon: Bell,
    color: "#9CA3AF",
    background: "rgba(156,163,175,0.10)",
  },

  delivery: {
    icon: Package,
    color: "#F59E0B",
    background: "rgba(245,158,11,0.14)",
  },

  sante: {
    icon: Heart,
    color: "#EF4444",
    background: "rgba(239,68,68,0.14)",
  },

  agri: {
    icon: Leaf,
    color: "#22C55E",
    background: "rgba(34,197,94,0.14)",
  },

  transport: {
    icon: Bus,
    color: "#06B6D4",
    background: "rgba(6,182,212,0.14)",
  },

  community: {
    icon: Users,
    color: "#EC4899",
    background: "rgba(236,72,153,0.14)",
  },

  like: {
    icon: Heart,
    color: "#EF4444",
    background: "rgba(239,68,68,0.14)",
  },

  comment: {
    icon: MessageCircle,
    color: "#3B82F6",
    background: "rgba(59,130,246,0.14)",
  },

  follow: {
    icon: Users,
    color: "#8B5CF6",
    background: "rgba(139,92,246,0.14)",
  },

  boost: {
    icon: Bell,
    color: "#F59E0B",
    background: "rgba(245,158,11,0.14)",
  },

  event: {
    icon: Bell,
    color: "#6366F1",
    background: "rgba(99,102,241,0.14)",
  },

  streak: {
    icon: BellRing,
    color: "#F97316",
    background: "rgba(249,115,22,0.14)",
  },

  digest: {
    icon: Sparkles,
    color: "#8B5CF6",
    background: "rgba(139,92,246,0.12)",
  },
};

const MODULE_FILTERS: FilterConfig[] = [
  {
    label: "Tout",
    types: null,
  },
  {
    label: "Messages",
    types: ["message"],
  },
  {
    label: "Santé",
    types: ["sante"],
  },
  {
    label: "Livraison",
    types: ["delivery"],
  },
  {
    label: "Paiements",
    types: ["payment"],
  },
  {
    label: "Jobs",
    types: ["job"],
  },
  {
    label: "Agri",
    types: ["agri"],
  },
  {
    label: "Transport",
    types: ["transport"],
  },
];

const PREF_LABELS: Record<NotifType, string> = {
  message: "Messages",
  job: "Jobs / Pro",
  immo: "Immobilier",
  payment: "Paiements",
  system: "Système",
  delivery: "Livraison",
  sante: "Santé",
  agri: "Agriculture",
  transport: "Transport",
  community: "Communauté",
  like: "J'aime",
  comment: "Commentaires",
  follow: "Abonnements",
  boost: "Boosts",
  event: "Événements",
  streak: "Streak",
  digest: "Résumé quotidien",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getTypeConfig(type: NotifType): TypeConfig {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
}

function getPriorityColor(notif: Notif): string {
  const config = getTypeConfig(notif.type);

  if (notif.priority === "high" && !notif.read) {
    return config.color;
  }

  return "rgba(255,255,255,0.10)";
}

/* ============================================================================
 * NOTIFICATION CARD
 * ========================================================================== */

function NotificationCard({
  notif,
  index,
  onDismiss,
  onAction,
  onMarkRead,
}: {
  notif: Notif;
  index: number;
  onDismiss: () => void;
  onAction: (page: string) => void;
  onMarkRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const entrance = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const dismissProgress = useRef(new Animated.Value(1)).current;

  const config = getTypeConfig(notif.type);
  const Icon = config.icon;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entrance, {
        toValue: 1,
        duration: 220,
        delay: Math.min(index * 35, 220),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay: Math.min(index * 35, 220),
        useNativeDriver: true,
      }),
    ]).start();
  }, [entrance, index, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(dismissProgress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismiss();
      }
    });
  };

  const handleOpen = () => {
    if (!notif.read) {
      onMarkRead();
    }

    if (notif.actionPage) {
      onAction(notif.actionPage);
      return;
    }

    setExpanded((value) => !value);
  };

  const cardBackground = notif.read
    ? "rgba(255,255,255,0.025)"
    : notif.priority === "high"
      ? `${config.color}0D`
      : "rgba(255,255,255,0.045)";

  const borderColor =
    notif.priority === "high" && !notif.read
      ? `${config.color}45`
      : "rgba(255,255,255,0.075)";

  return (
    <Animated.View
      style={[
        styles.notificationAnimated,
        {
          opacity: Animated.multiply(entrance, dismissProgress),
          transform: [
            { translateY },
            {
              scale: dismissProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.97, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.notificationCard,
          {
            backgroundColor: cardBackground,
            borderColor,
          },
        ]}
      >
        {notif.priority === "high" && !notif.read ? (
          <View
            style={[
              styles.priorityLine,
              {
                backgroundColor: config.color,
              },
            ]}
          />
        ) : null}

        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [
            styles.notificationMain,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: config.background,
              },
            ]}
          >
            {notif.initials ? (
              <>
                <Text
                  style={[
                    styles.initials,
                    {
                      color: config.color,
                    },
                  ]}
                >
                  {notif.initials}
                </Text>

                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: config.background,
                      borderColor: "rgba(0,0,0,0.35)",
                    },
                  ]}
                >
                  <Icon size={10} color={config.color} strokeWidth={2.5} />
                </View>
              </>
            ) : (
              <Icon size={21} color={config.color} strokeWidth={2.1} />
            )}
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleWrapper}>
                {notif.pinned ? (
                  <Pin size={11} color="#F59E0B" strokeWidth={2.5} />
                ) : null}

                <Text
                  numberOfLines={expanded ? undefined : 1}
                  style={[
                    styles.notificationTitle,
                    notif.read && styles.readTitle,
                  ]}
                >
                  {notif.title}
                </Text>
              </View>

              {notif.priority === "high" && !notif.read ? (
                <View
                  style={[
                    styles.unreadDot,
                    {
                      backgroundColor: config.color,
                    },
                  ]}
                />
              ) : null}
            </View>

            <Text
              numberOfLines={expanded ? undefined : 3}
              style={[styles.notificationBody, notif.read && styles.readBody]}
            >
              {notif.body}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaLeft}>
                <View
                  style={[
                    styles.modulePill,
                    {
                      backgroundColor: `${config.color}18`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.moduleText,
                      {
                        color: config.color,
                      },
                    ]}
                  >
                    {notif.module}
                  </Text>
                </View>

                <Text style={styles.timeText}>{notif.time}</Text>
              </View>

              {notif.amount ? (
                <Text
                  style={[
                    styles.amount,
                    notif.amount.startsWith("+")
                      ? styles.amountPositive
                      : styles.amountNegative,
                  ]}
                >
                  {notif.amount}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>

        {notif.actionButtons && (notif.priority === "high" || expanded) ? (
          <Animated.View style={styles.actionArea}>
            <View style={styles.actionDivider} />

            <View style={styles.actionRow}>
              <View style={styles.actionButtons}>
                {notif.actionButtons.map((button) => (
                  <Pressable
                    key={button.label}
                    onPress={() => {
                      if (!notif.read) {
                        onMarkRead();
                      }

                      onAction(notif.actionPage ?? "explorer");
                    }}
                    style={({ pressed }) => [
                      styles.actionButton,
                      button.variant === "primary"
                        ? {
                            backgroundColor: config.background,
                            borderColor: `${config.color}45`,
                          }
                        : styles.secondaryAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        {
                          color:
                            button.variant === "primary"
                              ? config.color
                              : "#FCA5A5",
                        },
                      ]}
                    >
                      {button.label}
                    </Text>

                    {button.variant === "primary" ? (
                      <ChevronRight
                        size={13}
                        color={config.color}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Supprimer la notification"
                onPress={handleDismiss}
                style={({ pressed }) => [
                  styles.dismissButton,
                  pressed && styles.pressed,
                ]}
              >
                <Trash2 size={14} color="#F87171" strokeWidth={2} />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * SECTION
 * ========================================================================== */

function NotificationSection({
  title,
  items,
  accent,
  onDismiss,
  onAction,
  onMarkRead,
}: {
  title: string;
  items: Notif[];
  accent?: string;
  onDismiss: (id: string) => void;
  onAction: (page: string) => void;
  onMarkRead: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {accent ? (
          <View
            style={[
              styles.sectionAccent,
              {
                backgroundColor: accent,
              },
            ]}
          />
        ) : null}

        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{items.length}</Text>
        </View>
      </View>

      <View style={styles.sectionList}>
        {items.map((notification, index) => (
          <NotificationCard
            key={notification.id}
            notif={notification}
            index={index}
            onDismiss={() => onDismiss(notification.id)}
            onAction={onAction}
            onMarkRead={() => onMarkRead(notification.id)}
          />
        ))}
      </View>
    </View>
  );
}

/* ============================================================================
 * PREFERENCES
 * ========================================================================== */

function PreferencesModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { prefs, updatePref, updateDnd } = useNotifications();

  const preferenceEntries = useMemo(
    () => Object.entries(PREF_LABELS) as [NotifType, string][],
    [],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.preferencesSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleGroup}>
              <View style={styles.settingsIcon}>
                <Settings2 size={16} color="#A78BFA" />
              </View>

              <View>
                <Text style={styles.sheetTitle}>Préférences</Text>

                <Text style={styles.sheetSubtitle}>Contrôlez vos alertes</Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <X size={16} color="#9CA3AF" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.preferencesContent}
          >
            {/* DND */}

            <View style={styles.dndCard}>
              <View style={styles.preferenceHeader}>
                <View style={styles.preferenceIdentity}>
                  <View
                    style={[
                      styles.preferenceIcon,
                      {
                        backgroundColor: "rgba(139,92,246,0.14)",
                      },
                    ]}
                  >
                    <Moon size={16} color="#A78BFA" />
                  </View>

                  <View style={styles.preferenceText}>
                    <Text style={styles.preferenceTitle}>Ne pas déranger</Text>

                    <Text style={styles.preferenceDescription}>
                      Suspendre les alertes pendant une période définie
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() =>
                    updateDnd({
                      dndEnabled: !prefs.dndEnabled,
                    })
                  }
                  hitSlop={8}
                >
                  {prefs.dndEnabled ? (
                    <ToggleRight size={30} color="#A78BFA" />
                  ) : (
                    <ToggleLeft size={30} color="#4B5563" />
                  )}
                </Pressable>
              </View>

              {prefs.dndEnabled ? (
                <View style={styles.dndTimes}>
                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>De</Text>

                    <TextInput
                      value={prefs.dndFrom}
                      onChangeText={(value) =>
                        updateDnd({
                          dndFrom: value,
                        })
                      }
                      placeholder="22:00"
                      placeholderTextColor="#6B7280"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      style={styles.timeInput}
                    />
                  </View>

                  <Text style={styles.timeSeparator}>→</Text>

                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>À</Text>

                    <TextInput
                      value={prefs.dndTo}
                      onChangeText={(value) =>
                        updateDnd({
                          dndTo: value,
                        })
                      }
                      placeholder="07:00"
                      placeholderTextColor="#6B7280"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      style={styles.timeInput}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            {/* TYPES */}

            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceSectionTitle}>
                Notifications par module
              </Text>

              <View style={styles.preferenceList}>
                {preferenceEntries.map(([type, label]) => {
                  const config = getTypeConfig(type);

                  const Icon = config.icon;

                  const enabled = Boolean(prefs.enabled[type]);

                  return (
                    <View key={type} style={styles.modulePreference}>
                      <View style={styles.modulePreferenceLeft}>
                        <View
                          style={[
                            styles.preferenceIcon,
                            {
                              backgroundColor: config.background,
                            },
                          ]}
                        >
                          <Icon size={15} color={config.color} />
                        </View>

                        <Text style={styles.modulePreferenceLabel}>
                          {label}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => updatePref(type, !enabled)}
                        hitSlop={8}
                      >
                        {enabled ? (
                          <ToggleRight size={28} color={config.color} />
                        ) : (
                          <ToggleLeft size={28} color="#4B5563" />
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.integrityNotice}>
              <BellRing size={15} color="#A78BFA" />

              <Text style={styles.integrityText}>
                Ces réglages contrôlent uniquement les préférences de
                notification disponibles par votre compte.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Bell size={28} color="#4B5563" strokeWidth={1.7} />
      </View>

      <Text style={styles.emptyTitle}>Rien à signaler</Text>

      <Text style={styles.emptyDescription}>
        Les nouvelles notifications apparaîtront ici.
      </Text>
    </View>
  );
}

/* ============================================================================
 * UNAUTHENTICATED
 * ========================================================================== */

function UnauthenticatedState() {
  return (
    <View style={styles.unauthenticated}>
      <View style={styles.loginIcon}>
        <LogIn size={28} color="#A78BFA" strokeWidth={1.8} />
      </View>

      <Text style={styles.loginTitle}>Votre espace de notifications</Text>

      <Text style={styles.loginDescription}>
        Connectez-vous pour accéder à vos notifications personnelles.
      </Text>

      <View style={styles.loginButtonWrapper}>
        <SignInButton />
      </View>
    </View>
  );
}

/* ============================================================================
 * LOADING
 * ========================================================================== */

function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.loadingCard}>
          <View style={styles.loadingIcon} />

          <View style={styles.loadingLines}>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingLineMedium} />
            <View style={styles.loadingLineSmall} />
          </View>
        </View>
      ))}

      <ActivityIndicator
        size="small"
        color="#8B5CF6"
        style={styles.loadingIndicator}
      />
    </View>
  );
}

/* ============================================================================
 * AUTHENTICATED CONTENT
 * ========================================================================== */

function NotificationsContent({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const { notifs, prefs, unreadTotal, markRead, markAllRead, dismiss } =
    useNotifications();

  const [filterIndex, setFilterIndex] = useState(0);

  const [showPreferences, setShowPreferences] = useState(false);

  const filter = MODULE_FILTERS[filterIndex];

  const filtered = useMemo(() => {
    return notifs.filter((notification) => {
      const enabled = prefs.enabled[notification.type];

      if (!enabled) {
        return false;
      }

      if (filter.types === null) {
        return true;
      }

      return filter.types.includes(notification.type);
    });
  }, [filter.types, notifs, prefs.enabled]);

  const pinned = useMemo(
    () =>
      filtered.filter(
        (notification) => notification.pinned && !notification.read,
      ),
    [filtered],
  );

  const important = useMemo(
    () =>
      filtered.filter(
        (notification) =>
          !notification.pinned &&
          notification.priority === "high" &&
          !notification.read,
      ),
    [filtered],
  );

  const recent = useMemo(
    () =>
      filtered.filter(
        (notification) =>
          !notification.pinned &&
          notification.priority !== "high" &&
          !notification.read,
      ),
    [filtered],
  );

  const old = useMemo(
    () => filtered.filter((notification) => notification.read),
    [filtered],
  );

  const handleMarkAllRead = () => {
    if (unreadTotal <= 0) {
      return;
    }

    markAllRead();
  };

  const handleDismiss = (id: string) => {
    dismiss(id);
  };

  const handleAction = (page: string) => {
    onNavigate(page);
  };

  return (
    <>
      {/* ====================================================================
       * TOP CONTROL BAR
       * ================================================================== */}

      <View style={styles.controlArea}>
        <View style={styles.controlTopRow}>
          <View style={styles.summaryBlock}>
            <View style={styles.summaryTitleRow}>
              <Text style={styles.summaryNumber}>{filtered.length}</Text>

              <Text style={styles.summaryLabel}>
                notification
                {filtered.length !== 1 ? "s" : ""}
              </Text>

              {unreadTotal > 0 ? (
                <View style={styles.unreadBadge}>
                  <View style={styles.unreadBadgeDot} />

                  <Text style={styles.unreadBadgeText}>
                    {unreadTotal} non lue
                    {unreadTotal !== 1 ? "s" : ""}
                  </Text>
                </View>
              ) : null}
            </View>

            {prefs.dndEnabled ? (
              <View style={styles.dndStatus}>
                <Moon size={11} color="#A78BFA" />

                <Text style={styles.dndStatusText}>
                  Ne pas déranger · {prefs.dndFrom}–{prefs.dndTo}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.controlActions}>
            {unreadTotal > 0 ? (
              <Pressable
                onPress={handleMarkAllRead}
                style={({ pressed }) => [
                  styles.markAllButton,
                  pressed && styles.pressed,
                ]}
              >
                <CheckCheck size={14} color="#A78BFA" />

                <Text style={styles.markAllButtonText}>Tout lire</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => setShowPreferences(true)}
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir les préférences"
            >
              <Settings2 size={16} color="#A1A1AA" />
            </Pressable>
          </View>
        </View>

        {/* FILTERS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {MODULE_FILTERS.map((item, index) => {
            const count = notifs.filter(
              (notification) =>
                !notification.read &&
                prefs.enabled[notification.type] &&
                (item.types === null || item.types.includes(notification.type)),
            ).length;

            const selected = filterIndex === index;

            return (
              <Pressable
                key={item.label}
                onPress={() => setFilterIndex(index)}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.filterChipActive,
                  pressed && styles.filterChipPressed,
                ]}
              >
                {selected ? <View style={styles.filterActiveDot} /> : null}

                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>

                {count > 0 ? (
                  <View
                    style={[
                      styles.filterCount,
                      selected && styles.filterCountActive,
                    ]}
                  >
                    <Text style={styles.filterCountText}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ====================================================================
       * NOTIFICATION FEED
       * ================================================================== */}

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <NotificationSection
              title="Épinglées"
              accent="#F59E0B"
              items={pinned}
              onDismiss={handleDismiss}
              onAction={handleAction}
              onMarkRead={markRead}
            />

            <NotificationSection
              title="Importantes"
              accent="#EF4444"
              items={important}
              onDismiss={handleDismiss}
              onAction={handleAction}
              onMarkRead={markRead}
            />

            <NotificationSection
              title="Récentes"
              items={recent}
              onDismiss={handleDismiss}
              onAction={handleAction}
              onMarkRead={markRead}
            />

            <NotificationSection
              title="Lues"
              items={old}
              onDismiss={handleDismiss}
              onAction={handleAction}
              onMarkRead={markRead}
            />

            <View style={styles.feedFooter}>
              <Check size={14} color="#52525B" />

              <Text style={styles.feedFooterText}>
                Fin de vos notifications
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <PreferencesModal
        visible={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export interface NotificationsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function NotificationsPage({
  onBack,
  onNavigate,
}: NotificationsPageProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <View style={styles.screen}>
      {/* Ambient premium background */}

      <View pointerEvents="none" style={styles.ambientGlow} />

      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={19} color="#FFFFFF" strokeWidth={2.1} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <BellRing size={17} color="#A78BFA" strokeWidth={2} />
          </View>

          <View>
            <Text style={styles.headerTitle}>Notifications</Text>

            <Text style={styles.headerSubtitle}>Centre d’activité</Text>
          </View>
        </View>

        <View style={styles.headerStatus}>
          <View style={styles.headerStatusDot} />
        </View>
      </View>

      {/* BODY */}

      <View style={styles.body}>
        {isLoading ? (
          <LoadingState />
        ) : !isAuthenticated ? (
          <UnauthenticatedState />
        ) : (
          <NotificationsContent onNavigate={onNavigate} />
        )}
      </View>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  body: {
    flex: 1,
  },

  ambientGlow: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99,102,241,0.055)",
  },

  /* ------------------------------------------------------------------------
   * HEADER
   * ---------------------------------------------------------------------- */

  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.065)",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerCenter: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
    marginRight: 10,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  headerSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    fontWeight: "600",
  },

  headerStatus: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  headerStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.8,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  /* ------------------------------------------------------------------------
   * CONTROLS
   * ---------------------------------------------------------------------- */

  controlArea: {
    paddingTop: 15,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.045)",
  },

  controlTopRow: {
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryBlock: {
    flex: 1,
    minWidth: 0,
  },

  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  summaryLabel: {
    marginLeft: 4,
    color: "rgba(255,255,255,0.40)",
    fontSize: 12,
    fontWeight: "600",
  },

  unreadBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139,92,246,0.11)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.20)",
  },

  unreadBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#A78BFA",
    marginRight: 5,
  },

  unreadBadgeText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "800",
  },

  dndStatus: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  dndStatusText: {
    marginLeft: 5,
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "600",
  },

  controlActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  markAllButton: {
    minHeight: 35,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.11)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  markAllButtonText: {
    marginLeft: 5,
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "800",
  },

  settingsButton: {
    width: 37,
    height: 37,
    marginLeft: 7,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  /* ------------------------------------------------------------------------
   * FILTERS
   * ---------------------------------------------------------------------- */

  filtersContent: {
    paddingHorizontal: 18,
    paddingTop: 13,
    paddingBottom: 5,
  },

  filterChip: {
    minHeight: 34,
    marginRight: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  filterChipActive: {
    backgroundColor: "rgba(139,92,246,0.18)",
    borderColor: "rgba(139,92,246,0.35)",
  },

  filterChipPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  filterActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: "#A78BFA",
  },

  filterText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "700",
  },

  filterTextActive: {
    color: "#E9D5FF",
  },

  filterCount: {
    minWidth: 17,
    height: 17,
    marginLeft: 6,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  filterCountActive: {
    backgroundColor: "#8B5CF6",
  },

  filterCountText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  /* ------------------------------------------------------------------------
   * FEED
   * ---------------------------------------------------------------------- */

  feed: {
    flex: 1,
  },

  feedContent: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 35,
  },

  section: {
    marginBottom: 21,
  },

  sectionHeader: {
    minHeight: 22,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionAccent: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  sectionCount: {
    minWidth: 18,
    height: 18,
    marginLeft: 7,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  sectionCountText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 8,
    fontWeight: "800",
  },

  sectionList: {
    gap: 8,
  },

  /* ------------------------------------------------------------------------
   * NOTIFICATION CARD
   * ---------------------------------------------------------------------- */

  notificationAnimated: {
    width: "100%",
  },

  notificationCard: {
    overflow: "hidden",
    borderRadius: 19,
    borderWidth: 1,
  },

  priorityLine: {
    height: 2,
    width: "100%",
  },

  notificationMain: {
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    position: "relative",
    flexShrink: 0,
  },

  initials: {
    fontSize: 12,
    fontWeight: "900",
  },

  iconBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 19,
  },

  titleWrapper: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  notificationTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },

  readTitle: {
    color: "rgba(255,255,255,0.56)",
  },

  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 8,
  },

  notificationBody: {
    marginTop: 3,
    color: "rgba(255,255,255,0.48)",
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "500",
  },

  readBody: {
    color: "rgba(255,255,255,0.31)",
  },

  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  metaLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  modulePill: {
    maxWidth: 105,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },

  moduleText: {
    fontSize: 8,
    fontWeight: "800",
  },

  timeText: {
    marginLeft: 7,
    color: "rgba(255,255,255,0.20)",
    fontSize: 8.5,
    fontWeight: "600",
  },

  amount: {
    marginLeft: 8,
    fontSize: 10,
    fontWeight: "900",
  },

  amountPositive: {
    color: "#34D399",
  },

  amountNegative: {
    color: "#F87171",
  },

  /* ------------------------------------------------------------------------
   * ACTIONS
   * ---------------------------------------------------------------------- */

  actionArea: {
    paddingHorizontal: 13,
    paddingBottom: 13,
  },

  actionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButtons: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
  },

  actionButton: {
    flex: 1,
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryAction: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.18)",
  },

  actionButtonText: {
    fontSize: 9,
    fontWeight: "800",
  },

  dismissButton: {
    width: 34,
    height: 34,
    marginLeft: 7,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.16)",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },

  /* ------------------------------------------------------------------------
   * EMPTY
   * ---------------------------------------------------------------------- */

  emptyState: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyTitle: {
    marginTop: 15,
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "800",
  },

  emptyDescription: {
    marginTop: 5,
    color: "rgba(255,255,255,0.30)",
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 16,
  },

  feedFooter: {
    paddingTop: 4,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  feedFooterText: {
    marginLeft: 6,
    color: "#52525B",
    fontSize: 9,
    fontWeight: "600",
  },

  /* ------------------------------------------------------------------------
   * PREFERENCES MODAL
   * ---------------------------------------------------------------------- */

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.74)",
  },

  preferencesSheet: {
    maxHeight: "88%",
    minHeight: "55%",
    backgroundColor: "#090D19",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 9,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sheetHeader: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  sheetTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingsIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  sheetSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    fontWeight: "600",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  preferencesContent: {
    padding: 18,
    paddingBottom: 35,
  },

  dndCard: {
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(139,92,246,0.075)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  preferenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  preferenceIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  preferenceIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  preferenceText: {
    flex: 1,
  },

  preferenceTitle: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },

  preferenceDescription: {
    marginTop: 3,
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    lineHeight: 14,
  },

  dndTimes: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  timeField: {
    flex: 1,
  },

  fieldLabel: {
    marginBottom: 5,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    fontWeight: "700",
  },

  timeInput: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  timeSeparator: {
    width: 30,
    paddingBottom: 11,
    color: "#71717A",
    fontSize: 12,
    textAlign: "center",
  },

  preferenceSection: {
    marginTop: 23,
  },

  preferenceSectionTitle: {
    marginBottom: 9,
    color: "rgba(255,255,255,0.36)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  preferenceList: {
    gap: 7,
  },

  modulePreference: {
    minHeight: 57,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  modulePreferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  modulePreferenceLabel: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10.5,
    fontWeight: "700",
  },

  integrityNotice: {
    marginTop: 18,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.12)",
  },

  integrityText: {
    flex: 1,
    marginLeft: 8,
    color: "rgba(255,255,255,0.32)",
    fontSize: 9,
    lineHeight: 14,
  },

  /* ------------------------------------------------------------------------
   * AUTH
   * ---------------------------------------------------------------------- */

  unauthenticated: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },

  loginIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.20)",
  },

  loginTitle: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  loginDescription: {
    maxWidth: 290,
    marginTop: 7,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: "center",
  },

  loginButtonWrapper: {
    marginTop: 18,
  },

  /* ------------------------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------------------- */

  loadingContainer: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  loadingCard: {
    height: 75,
    marginBottom: 9,
    padding: 13,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  loadingIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingLines: {
    flex: 1,
    marginLeft: 11,
  },

  loadingLineLarge: {
    width: "72%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  loadingLineMedium: {
    width: "92%",
    height: 7,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loadingLineSmall: {
    width: "42%",
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  loadingIndicator: {
    marginTop: 5,
  },
});
