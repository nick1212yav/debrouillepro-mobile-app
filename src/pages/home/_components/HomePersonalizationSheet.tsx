// src/pages/home/_components/HomePersonalizationSheet.tsx
import {
  View,
  Pressable,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  useWindowDimensions,
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
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Heart,
  Layers3,
  MapPin,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface HomeModulePreference {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  route: string;
  priority?: number;
}

export interface HomePersonalizationPreferences {
  favoriteModules: string[];
  hiddenSections: string[];
  customSectionOrder: string[];
  notificationPreferences: {
    newRecommendations: boolean;
    nearbyAlerts: boolean;
    opportunities: boolean;
  };
}

interface HomePersonalizationSheetProps {
  open: boolean;
  onClose: () => void;
  modules: HomeModulePreference[];
  preferences?: Partial<HomePersonalizationPreferences>;
  onSave?: (preferences: HomePersonalizationPreferences) => void;
  onReset?: () => void;
}

/* ============================================================================
 * MODULE VISUALS
 * ========================================================================== */

const MODULE_VISUALS: Record<string, { color: string; emoji: string }> = {
  jobs: { color: "#A78BFA", emoji: "💼" },
  immo: { color: "#FB923C", emoji: "🏠" },
  evenements: { color: "#F472B6", emoji: "🎉" },
  events: { color: "#F472B6", emoji: "🎉" },
  pay: { color: "#34D399", emoji: "💳" },
  education: { color: "#22D3EE", emoji: "🎓" },
  live: { color: "#F87171", emoji: "🔴" },
  community: { color: "#C084FC", emoji: "👥" },
  transport: { color: "#60A5FA", emoji: "🚗" },
  sante: { color: "#4ADE80", emoji: "❤️" },
  voyages: { color: "#818CF8", emoji: "✈️" },
  boutique: { color: "#F472B6", emoji: "🛍️" },
  agri: { color: "#A3E635", emoji: "🌱" },
};

const DEFAULT_PREFERENCES: HomePersonalizationPreferences = {
  favoriteModules: [],
  hiddenSections: [],
  customSectionOrder: [],
  notificationPreferences: {
    newRecommendations: true,
    nearbyAlerts: true,
    opportunities: true,
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function visualFor(id: string) {
  return (
    MODULE_VISUALS[id.toLowerCase()] ?? {
      color: "#818CF8",
      emoji: "✨",
    }
  );
}

function normalizePreferences(
  value?: Partial<HomePersonalizationPreferences>,
): HomePersonalizationPreferences {
  return {
    favoriteModules:
      value?.favoriteModules ?? DEFAULT_PREFERENCES.favoriteModules,
    hiddenSections: value?.hiddenSections ?? DEFAULT_PREFERENCES.hiddenSections,
    customSectionOrder:
      value?.customSectionOrder ?? DEFAULT_PREFERENCES.customSectionOrder,
    notificationPreferences: {
      ...DEFAULT_PREFERENCES.notificationPreferences,
      ...(value?.notificationPreferences ?? {}),
    },
  };
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
 * MINI STAT
 * ========================================================================== */

function MiniStat({
  Icon,
  value,
  label,
  color,
  delay,
}: {
  Icon: typeof Layers3;
  value: number;
  label: string;
  color: string;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.miniStatWrap,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.miniStat}>
        <LinearGradient
          colors={[`${color}22`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.miniStatIcon,
            {
              backgroundColor: `${color}22`,
              borderColor: `${color}55`,
            },
          ]}
        >
          <Icon size={11} color={color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.miniStatValue}>{value}</Text>
          <Text style={styles.miniStatLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * TAB BUTTON
 * ========================================================================== */

function TabButton({
  active,
  Icon,
  label,
  onPress,
}: {
  active: boolean;
  Icon: typeof Layers3;
  label: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
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
    <Animated.View style={[styles.tabBtnWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.tabBtn}
      >
        {active ? (
          <LinearGradient
            colors={["#A78BFA", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabBtnActiveGradient}
          />
        ) : null}
        <Icon size={11} color={active ? "#fff" : "rgba(255,255,255,0.55)"} />
        <Text style={[styles.tabBtnText, active && { color: "#fff" }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * SECTION TITLE
 * ========================================================================== */

function SectionTitle({
  Icon,
  title,
  subtitle,
}: {
  Icon: typeof Layers3;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleIcon}>
        <Icon size={12} color="#A5B4FC" />
      </View>
      <View>
        <Text style={styles.sectionTitleText}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionTitleSub}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================================
 * NOTIFICATION PREFERENCE
 * ========================================================================== */

function NotificationPreference({
  Icon,
  color,
  title,
  description,
  enabled,
  onToggle,
}: {
  Icon: typeof Bell;
  color: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const toggleAnim = useRef(new Animated.Value(enabled ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: enabled ? 1 : 0,
      useNativeDriver: false,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [enabled, toggleAnim]);

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

  const bgColor = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", color],
  });

  const knobX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 8 }}>
      <Pressable
        onPress={onToggle}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.notifRow,
          {
            backgroundColor: enabled
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.025)",
          },
        ]}
      >
        <View
          style={[
            styles.notifIcon,
            { backgroundColor: `${color}22`, borderColor: `${color}55` },
          ]}
        >
          <Icon size={14} color={color} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.notifTitle}>{title}</Text>
          <Text style={styles.notifDesc}>{description}</Text>
        </View>

        <Animated.View
          style={[styles.toggleTrack, { backgroundColor: bgColor }]}
        >
          <Animated.View
            style={[styles.toggleKnob, { transform: [{ translateX: knobX }] }]}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MODULE ROW (with up/down reorder)
 * ========================================================================== */

function ModuleRow({
  module,
  index,
  total,
  favorite,
  hidden,
  onToggleFavorite,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
}: {
  module: HomeModulePreference;
  index: number;
  total: number;
  favorite: boolean;
  hidden: boolean;
  onToggleFavorite: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const visual = visualFor(module.id);
  const scale = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(hidden ? 0.55 : 1)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: hidden ? 0.55 : 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hidden, opacityAnim]);

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

  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;

  return (
    <FadeUp delay={index * 40} distance={10}>
      <Animated.View
        style={[
          {
            transform: [{ scale }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View
          style={[
            styles.moduleRow,
            {
              backgroundColor: hidden
                ? "rgba(255,255,255,0.02)"
                : "rgba(255,255,255,0.04)",
            },
          ]}
        >
          {/* Position */}
          <View style={styles.modulePosition}>
            <Text style={styles.modulePositionText}>
              {String(index + 1).padStart(2, "0")}
            </Text>
          </View>

          {/* Icon */}
          <View
            style={[
              styles.moduleIconWrap,
              {
                backgroundColor: `${visual.color}22`,
                borderColor: `${visual.color}55`,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{visual.emoji}</Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.moduleTitleRow}>
              <Text style={styles.moduleTitle} numberOfLines={1}>
                {module.label}
              </Text>
              {favorite ? (
                <Star size={9} color={visual.color} fill={visual.color} />
              ) : null}
            </View>
            <Text style={styles.moduleSub}>
              {hidden ? "Masqué de votre Home" : "Visible dans votre Home"}
            </Text>
          </View>

          {/* Favorite toggle */}
          <Pressable
            onPress={onToggleFavorite}
            accessibilityLabel={
              favorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
            hitSlop={6}
            style={({ pressed }) => [
              styles.moduleIconBtn,
              {
                backgroundColor: favorite
                  ? `${visual.color}22`
                  : "rgba(255,255,255,0.04)",
                borderColor: favorite
                  ? `${visual.color}55`
                  : "rgba(255,255,255,0.08)",
              },
              pressed && styles.pressed,
            ]}
          >
            <Star
              size={13}
              color={favorite ? visual.color : "rgba(255,255,255,0.5)"}
              fill={favorite ? visual.color : "transparent"}
            />
          </Pressable>

          {/* Visibility toggle */}
          <Pressable
            onPress={onToggleVisibility}
            accessibilityLabel={hidden ? "Afficher" : "Masquer"}
            hitSlop={6}
            style={({ pressed }) => [
              styles.moduleIconBtn,
              pressed && styles.pressed,
            ]}
          >
            {hidden ? (
              <EyeOff size={13} color="rgba(255,255,255,0.5)" />
            ) : (
              <Eye size={13} color="rgba(255,255,255,0.65)" />
            )}
          </Pressable>

          {/* Reorder buttons (up/down) */}
          <View style={styles.reorderCol}>
            <Pressable
              onPress={onMoveUp}
              disabled={!canMoveUp}
              accessibilityLabel="Monter"
              hitSlop={4}
              style={[
                styles.reorderBtn,
                !canMoveUp && styles.reorderBtnDisabled,
              ]}
            >
              <ChevronUp
                size={11}
                color={
                  canMoveUp
                    ? "rgba(255,255,255,0.65)"
                    : "rgba(255,255,255,0.15)"
                }
                strokeWidth={2.8}
              />
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              disabled={!canMoveDown}
              accessibilityLabel="Descendre"
              hitSlop={4}
              style={[
                styles.reorderBtn,
                !canMoveDown && styles.reorderBtnDisabled,
              ]}
            >
              <ChevronDown
                size={11}
                color={
                  canMoveDown
                    ? "rgba(255,255,255,0.65)"
                    : "rgba(255,255,255,0.15)"
                }
                strokeWidth={2.8}
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function HomePersonalizationSheet({
  open,
  onClose,
  modules,
  preferences,
  onSave,
  onReset,
}: HomePersonalizationSheetProps) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const initial = useMemo(
    () => normalizePreferences(preferences),
    [preferences],
  );

  const [activeTab, setActiveTab] = useState<"home" | "notifications">("home");

  const [localFavorites, setLocalFavorites] = useState<string[]>(
    initial.favoriteModules,
  );

  const [localHidden, setLocalHidden] = useState<string[]>(
    initial.hiddenSections,
  );

  const [localOrder, setLocalOrder] = useState<string[]>(() => {
    const preferred = initial.customSectionOrder;
    const existing = modules.map((module) => module.id);
    return [
      ...preferred.filter((id) => existing.includes(id)),
      ...existing.filter((id) => !preferred.includes(id)),
    ];
  });

  const [localNotifications, setLocalNotifications] = useState(
    initial.notificationPreferences,
  );

  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(open);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  /* ─── mount / unmount ─── */
  useEffect(() => {
    if (open) {
      setMounted(true);
      backdropAnim.setValue(0);
      slideAnim.setValue(0);
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
    } else if (mounted) {
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
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ─── tab content slide ─── */
  useEffect(() => {
    tabAnim.setValue(0);
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabAnim]);

  /* ─── sync external preferences when opening ─── */
  useEffect(() => {
    if (!open) return;
    const norm = normalizePreferences(preferences);
    setLocalFavorites(norm.favoriteModules);
    setLocalHidden(norm.hiddenSections);
    const existing = modules.map((m) => m.id);
    const preferred = norm.customSectionOrder;
    setLocalOrder([
      ...preferred.filter((id) => existing.includes(id)),
      ...existing.filter((id) => !preferred.includes(id)),
    ]);
    setLocalNotifications(norm.notificationPreferences);
    setSaved(false);
    setActiveTab("home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ─── derived ─── */
  const orderedModules = useMemo(() => {
    const map = new Map(modules.map((m) => [m.id, m]));
    return localOrder
      .map((id) => map.get(id))
      .filter((m): m is HomeModulePreference => Boolean(m));
  }, [localOrder, modules]);

  const visibleCount = modules.length - localHidden.length;
  const favoriteCount = localFavorites.length;

  /* ─── actions ─── */
  const toggleFavorite = useCallback((moduleId: string) => {
    setSaved(false);
    setLocalFavorites((cur) =>
      cur.includes(moduleId)
        ? cur.filter((id) => id !== moduleId)
        : [...cur, moduleId],
    );
  }, []);

  const toggleVisibility = useCallback((moduleId: string) => {
    setSaved(false);
    setLocalHidden((cur) =>
      cur.includes(moduleId)
        ? cur.filter((id) => id !== moduleId)
        : [...cur, moduleId],
    );
  }, []);

  const moveModule = useCallback((index: number, direction: -1 | 1) => {
    setSaved(false);
    setLocalOrder((cur) => {
      const next = [...cur];
      const target = index + direction;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const save = useCallback(() => {
    const next: HomePersonalizationPreferences = {
      favoriteModules: localFavorites,
      hiddenSections: localHidden,
      customSectionOrder: localOrder,
      notificationPreferences: localNotifications,
    };
    onSave?.(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, [localFavorites, localHidden, localOrder, localNotifications, onSave]);

  const reset = useCallback(() => {
    const fallback = modules.map((m) => m.id);
    setLocalFavorites([]);
    setLocalHidden([]);
    setLocalOrder(fallback);
    setLocalNotifications(DEFAULT_PREFERENCES.notificationPreferences);
    setSaved(false);
    onReset?.();
  }, [modules, onReset]);

  const handleClose = useCallback(() => {
    if (!saved) onClose();
    else onClose();
  }, [onClose, saved]);

  if (!mounted) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const tabOpacity = tabAnim;
  const tabTranslateX = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [activeTab === "home" ? -12 : 12, 0],
  });

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* ───── BACKDROP ───── */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Fermer"
        />
      </Animated.View>

      {/* ───── SHEET ───── */}
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: SCREEN_HEIGHT * 0.94,
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
            colors={["rgba(139,92,246,0.35)", "rgba(139,92,246,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </View>

        {/* Top light line */}
        <View style={styles.topLine} pointerEvents="none" />

        {/* Border ring */}
        <View style={styles.borderRing} pointerEvents="none" />

        {/* ───── HANDLE ───── */}
        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <LinearGradient
              colors={["#A78BFA", "#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <Sparkles size={19} color="#fff" />
            </LinearGradient>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headerEyebrow}>MA HOME</Text>
              <Text style={styles.headerTitle}>Personnaliser</Text>
            </View>

            <Pressable
              onPress={handleClose}
              hitSlop={8}
              accessibilityLabel="Fermer"
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.pressed,
              ]}
            >
              <X size={15} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <MiniStat
              Icon={Layers3}
              value={visibleCount}
              label="visibles"
              color="#818CF8"
              delay={80}
            />
            <MiniStat
              Icon={Heart}
              value={favoriteCount}
              label="favoris"
              color="#F472B6"
              delay={140}
            />
            <MiniStat
              Icon={Zap}
              value={localNotifications.opportunities ? 3 : 2}
              label="alertes"
              color="#FBBF24"
              delay={200}
            />
          </View>
        </View>

        {/* ───── TABS ───── */}
        <View style={styles.tabsWrap}>
          <View style={styles.tabsContainer}>
            <TabButton
              active={activeTab === "home"}
              Icon={Layers3}
              label="Ma Home"
              onPress={() => setActiveTab("home")}
            />
            <TabButton
              active={activeTab === "notifications"}
              Icon={Bell}
              label="Alertes"
              onPress={() => setActiveTab("notifications")}
            />
          </View>
        </View>

        {/* ───── CONTENT ───── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: tabOpacity,
              transform: [{ translateX: tabTranslateX }],
            }}
          >
            {activeTab === "home" ? (
              <View>
                {/* Personalization hero */}
                <View style={styles.heroCard}>
                  <LinearGradient
                    colors={[
                      "rgba(99,102,241,0.16)",
                      "rgba(15,7,32,0.6)",
                      "rgba(10,6,24,0.85)",
                    ]}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.heroBorder} pointerEvents="none" />

                  <View style={styles.heroRow}>
                    <View style={styles.heroIcon}>
                      <Target size={14} color="#A5B4FC" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.heroTitle}>
                        Construisez votre Home idéale
                      </Text>
                      <Text style={styles.heroSub}>
                        Placez vos univers préférés en premier, masquez ce qui
                        ne vous intéresse pas et laissez DébrouillePro adapter
                        votre expérience.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Modules */}
                <View style={{ marginBottom: 20 }}>
                  <SectionTitle
                    Icon={Layers3}
                    title="Vos univers"
                    subtitle="Utilisez ↑↓ pour réorganiser"
                  />
                  <View style={{ marginTop: 12 }}>
                    {orderedModules.map((module, index) => (
                      <ModuleRow
                        key={module.id}
                        module={module}
                        index={index}
                        total={orderedModules.length}
                        favorite={localFavorites.includes(module.id)}
                        hidden={localHidden.includes(module.id)}
                        onToggleFavorite={() => toggleFavorite(module.id)}
                        onToggleVisibility={() => toggleVisibility(module.id)}
                        onMoveUp={() => moveModule(index, -1)}
                        onMoveDown={() => moveModule(index, 1)}
                      />
                    ))}
                  </View>
                </View>

                {/* Favorites explainer */}
                <View style={styles.explainerCard}>
                  <LinearGradient
                    colors={["rgba(244,114,182,0.14)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.explainerBorder} pointerEvents="none" />
                  <Heart size={13} color="#F9A8D4" />
                  <Text style={styles.explainerText}>
                    Vos favoris influencent également les recommandations. Le
                    moteur de feed leur attribue déjà davantage de poids.
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                {/* Notifications hero */}
                <View style={styles.notifHeroCard}>
                  <LinearGradient
                    colors={["rgba(245,158,11,0.16)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.notifHeroBorder} pointerEvents="none" />

                  <View style={styles.heroRow}>
                    <View style={styles.notifHeroIcon}>
                      <Bell size={15} color="#FBBF24" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.heroTitle}>
                        Seulement ce qui compte
                      </Text>
                      <Text style={styles.heroSub}>
                        Choisissez les signaux que DébrouillePro doit surveiller
                        pour vous.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Notification toggles */}
                <View style={{ marginBottom: 20 }}>
                  <NotificationPreference
                    Icon={Sparkles}
                    color="#A78BFA"
                    title="Nouvelles recommandations"
                    description="Les nouveautés susceptibles de vous intéresser."
                    enabled={localNotifications.newRecommendations}
                    onToggle={() => {
                      setSaved(false);
                      setLocalNotifications((c) => ({
                        ...c,
                        newRecommendations: !c.newRecommendations,
                      }));
                    }}
                  />
                  <NotificationPreference
                    Icon={MapPin}
                    color="#22D3EE"
                    title="À proximité"
                    description="Les nouveautés et opportunités autour de vous."
                    enabled={localNotifications.nearbyAlerts}
                    onToggle={() => {
                      setSaved(false);
                      setLocalNotifications((c) => ({
                        ...c,
                        nearbyAlerts: !c.nearbyAlerts,
                      }));
                    }}
                  />
                  <NotificationPreference
                    Icon={TrendingUp}
                    color="#34D399"
                    title="Opportunités"
                    description="Jobs, immobilier, événements et occasions pertinentes."
                    enabled={localNotifications.opportunities}
                    onToggle={() => {
                      setSaved(false);
                      setLocalNotifications((c) => ({
                        ...c,
                        opportunities: !c.opportunities,
                      }));
                    }}
                  />
                </View>

                {/* Smart mode */}
                <View style={styles.smartCard}>
                  <LinearGradient
                    colors={["rgba(139,92,246,0.14)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.smartBorder} pointerEvents="none" />

                  <View style={styles.smartRow}>
                    <View style={styles.smartIcon}>
                      <Sparkles size={15} color="#A5B4FC" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.smartHeaderRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.smartTitle}>
                            Home intelligente
                          </Text>
                          <Text style={styles.smartSub}>
                            DébrouillePro adapte progressivement votre Home à
                            vos usages.
                          </Text>
                        </View>
                        <View style={styles.smartBadge}>
                          <Text style={styles.smartBadgeText}>IA</Text>
                        </View>
                      </View>

                      <View style={styles.smartProgressRow}>
                        <View style={styles.smartProgressTrack}>
                          <LinearGradient
                            colors={["#A78BFA", "#6366F1"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.smartProgressFill}
                          />
                        </View>
                        <Text style={styles.smartProgressText}>76%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* ───── FOOTER ───── */}
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Platform.OS === "android" ? 20 : Math.max(20, 30),
            },
          ]}
        >
          <View style={styles.footerRow}>
            <Pressable
              onPress={reset}
              accessibilityLabel="Réinitialiser"
              hitSlop={8}
              style={({ pressed }) => [
                styles.resetBtn,
                pressed && styles.pressed,
              ]}
            >
              <RotateCcw size={15} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable
              onPress={save}
              accessibilityRole="button"
              accessibilityLabel={
                saved ? "Préférences enregistrées" : "Enregistrer ma Home"
              }
              style={({ pressed }) => [
                styles.saveBtnOuter,
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={
                  saved
                    ? ["#34D399", "#10B981", "#059669"]
                    : ["#A78BFA", "#7C3AED", "#6366F1"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtnGradient}
              >
                {saved ? (
                  <>
                    <Check size={14} color="#fff" strokeWidth={3} />
                    <Text style={styles.saveBtnText}>
                      Préférences enregistrées
                    </Text>
                  </>
                ) : (
                  <>
                    <Save size={14} color="#fff" />
                    <Text style={styles.saveBtnText}>Enregistrer ma Home</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },

  // ── Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  // ── Sheet
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 28,
  },
  topGlowWrap: {
    position: "absolute",
    top: -100,
    left: "25%",
    right: "25%",
    height: 180,
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
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.16)",
  },

  // ── Handle
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

  // ── Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(165,180,252,0.85)",
  },
  headerTitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  // ── Stats row
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  miniStatWrap: {
    flex: 1,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  miniStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  miniStatValue: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.2,
  },
  miniStatLabel: {
    marginTop: 2,
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },

  // ── Tabs
  tabsWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 4,
  },
  tabBtnWrap: {
    flex: 1,
  },
  tabBtn: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabBtnActiveGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  tabBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.2,
  },

  // ── Content
  contentScroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 8,
  },

  // ── Hero cards
  heroCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: "rgba(12,10,28,0.6)",
  },
  heroBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.22)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
  },
  heroTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.2,
  },
  heroSub: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  // ── Section title
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.2,
  },
  sectionTitleSub: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // ── Module row
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 8,
  },
  modulePosition: {
    width: 22,
    alignItems: "center",
  },
  modulePositionText: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.5,
  },
  moduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  moduleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moduleTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.2,
  },
  moduleSub: {
    marginTop: 3,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  moduleIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  // ── Reorder
  reorderCol: {
    width: 22,
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderBtn: {
    width: 20,
    height: 18,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  reorderBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  // ── Explainer
  explainerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(244,114,182,0.06)",
  },
  explainerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.16)",
  },
  explainerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },

  // ── Notification hero
  notifHeroCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: "rgba(12,10,28,0.6)",
  },
  notifHeroBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  notifHeroIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.22)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },

  // ── Notification row
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notifTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  notifDesc: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // ── Smart card
  smartCard: {
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(12,10,28,0.6)",
  },
  smartBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },
  smartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  smartIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.22)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
  },
  smartHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  smartTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  smartSub: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  smartBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.2)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
  },
  smartBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#A5B4FC",
  },
  smartProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  smartProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  smartProgressFill: {
    width: "76%",
    height: "100%",
    borderRadius: 3,
  },
  smartProgressText: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.45)",
  },

  // ── Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,8,24,0.85)",
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  saveBtnOuter: {
    flex: 1,
    borderRadius: 17,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  saveBtnGradient: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 17,
  },
  saveBtnText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
