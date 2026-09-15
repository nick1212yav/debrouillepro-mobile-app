// src/pages/home/_components/QuickActions.tsx
import {
  View,
  Pressable,
  Text,
  TextInput,
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
  Wallet,
  Bus,
  Package,
  Heart,
  Briefcase,
  Map,
  Plane,
  Building2,
  Users,
  Leaf,
  Newspaper,
  PartyPopper,
  Shield,
  MessageCircle,
  Compass,
  Settings2,
  RotateCcw,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Gift,
  ShoppingBag,
  Star,
  Bell,
  LayoutDashboard,
  Zap,
  Bookmark,
  DollarSign,
  HelpCircle,
  User,
  Search,
  Calendar,
  Scale,
  Radio,
  Trophy,
  Crown,
  TrendingUp,
  BarChart2,
  PenLine,
  Image as ImageIcon,
  Sparkles,
  LayoutTemplate,
  Dumbbell,
  Salad,
  Moon,
  Globe,
  CalendarDays,
  Award,
  Brain,
  Medal,
  Hotel,
  UtensilsCrossed,
  Tag as TagIcon,
  Building,
  Ruler,
  TreePine,
  Home as HomeIcon,
  Wrench,
  MapPin,
  GraduationCap,
  Church,
  Network,
  Megaphone,
  Database,
  ShieldAlert,
  Box,
} from "lucide-react-native";

import {
  type ActionId,
  ALL_ACTIONS,
  useQuickActions,
} from "@/hooks/use-quick-actions.ts";

/* ============================================================
 * ICON SYSTEM
 * ============================================================ */

const ICON_MAP: Record<ActionId, React.ElementType> = {
  paiement: Wallet,
  wallet: DollarSign,
  transport: Bus,
  livraison: Package,
  sante: Heart,
  emplois: Briefcase,
  carte: Map,
  voyages: Plane,
  immo: Building2,
  community: Users,
  agri: Leaf,
  media: Newspaper,
  evenements: PartyPopper,
  sos: Shield,
  messages: MessageCircle,
  explorer: Compass,
  apprendre: BookOpen,
  parrainage: Gift,
  marketplace: ShoppingBag,
  recompenses: Star,
  dashboard: LayoutDashboard,
  notifications: Bell,
  favorites: Bookmark,
  actions: Zap,
  profile: User,
  agenda: Calendar,
  "events-agenda": Calendar,
  analytics: BarChart2,
  boost: Zap,
  documents: Shield,
  logement: Building2,
  emploi: Briefcase,
  "evenements-pro": PartyPopper,
  juridique: Scale,
  groupes: Users,
  live: Radio,
  reputation: Trophy,
  cocreation: Zap,
  premium: Crown,
  revenus: TrendingUp,
  "marketplace-pro": ShoppingBag,
  "revenus-dashboard": BarChart2,
  editeur: PenLine,
  studio: ImageIcon,
  "stories-creator": Sparkles,
  templates: LayoutTemplate,
  fitness: Dumbbell,
  nutrition: Salad,
  meditation: Moon,
  bienetre: Heart,
  destinations: Globe,
  planificateur: CalendarDays,
  "carnet-voyage": BookOpen,
  "budget-voyage": DollarSign,
  cours: Award,
  quiz: Brain,
  certifications: Medal,
  mentorat: Users,
  hebergement: Hotel,
  restauration: UtensilsCrossed,
  annonces: TagIcon,
  urbanisme: Building,
  amenagement: Ruler,
  environnement: TreePine,
  business: Briefcase,
  "city-habitat": HomeIcon,
  services: Wrench,
  tracking: MapPin,
  ecole: GraduationCap,
  eglise: Church,
  network: Network,
  pub: Megaphone,
  "data-publique": Database,
  securite: ShieldAlert,
  map3d: Box,
  "ai-studio": Sparkles,
  budget: DollarSign,
  aide: HelpCircle,
  actualites: Newspaper,
};

/* ============================================================
 * TYPES
 * ============================================================ */

interface QuickActionsProps {
  onNavigate: (page: string) => void;
}

/* ============================================================
 * CONSTANTS
 * ============================================================ */

const MAX_VISIBLE_ACTIONS = 7;
const isBrowser = typeof window !== "undefined";

/* ============================================================
 * FADE UP WRAPPER
 * ============================================================ */

function FadeUp({
  delay = 0,
  distance = 14,
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
      duration: 460,
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

/* ============================================================
 * ANIMATED HEADER ICON
 * ============================================================ */

function AnimatedHeaderIcon() {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

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
      Animated.timing(halo, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate, pulse, halo]);

  const rotation = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-8deg", "8deg"],
  });
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
        style={[styles.headerIconGlow, { transform: [{ scale: glowScale }] }]}
      />
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <LinearGradient
          colors={["#A78BFA", "#7C3AED", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIconGradient}
        >
          <Zap size={13} color="#fff" strokeWidth={2.4} fill="#fff" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

/* ============================================================
 * ACTIVE ACTION TILE
 * ============================================================ */

function ActiveActionTile({
  action,
  index,
  focused,
  onPress,
}: {
  action: any;
  index: number;
  focused: boolean;
  onPress: () => void;
}) {
  const Icon = ICON_MAP[action.id as ActionId];
  const scale = useRef(new Animated.Value(1)).current;
  const anim = useRef(new Animated.Value(0)).current;
  const auraAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pressPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!Icon) return;
    Animated.spring(anim, {
      toValue: 1,
      delay: Math.min(index * 45, 320),
      stiffness: 420,
      damping: 24,
      useNativeDriver: true,
    }).start();
  }, [anim, index, Icon]);

  useEffect(() => {
    Animated.timing(auraAnim, {
      toValue: focused ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focused, auraAnim]);

  if (!Icon) return null;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 40,
      }),
      Animated.timing(pressPulse, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }),
      Animated.timing(pressPulse, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const tileScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  return (
    <Animated.View
      style={[
        styles.tileWrap,
        {
          opacity: anim,
          transform: [{ scale: tileScale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel={action.label}
        style={styles.tilePress}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          {/* Aura */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tileAura,
              {
                backgroundColor: action.color,
                opacity: auraAnim,
                transform: [
                  {
                    scale: auraAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1.15],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Press pulse ring */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tilePressRing,
              {
                borderColor: action.color,
                opacity: pressPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.6],
                }),
                transform: [
                  {
                    scale: pressPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.35],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Icon tile */}
          <LinearGradient
            colors={[`${action.color}26`, action.bg, `${action.color}10`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.tileGradient,
              {
                borderColor: `${action.color}44`,
                shadowColor: action.color,
              },
              focused && {
                shadowOpacity: 0.45,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
              },
            ]}
          >
            <Icon size={19} color={action.color} strokeWidth={1.9} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.tileLabel} numberOfLines={1}>
          {action.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
 * PROGRESS RING (header counter)
 * ============================================================ */

function ProgressRing({ count, max }: { count: number; max: number }) {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: Math.min(count / max, 1),
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [count, max, fillAnim]);

  const width = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const full = count >= max;

  return (
    <View style={styles.progressRing}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width,
              backgroundColor: full ? "#FBBF24" : "#A78BFA",
              shadowColor: full ? "#FBBF24" : "#A78BFA",
            },
          ]}
        />
      </View>
      <Text
        style={[styles.progressText, { color: full ? "#FCD34D" : "#C4B5FD" }]}
      >
        {count}
      </Text>
    </View>
  );
}

/* ============================================================
 * REORDER ROW (customizer)
 * ============================================================ */

function ReorderRow({
  action,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  action: any;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const Icon = ICON_MAP[action.id as ActionId];
  const scale = useRef(new Animated.Value(1)).current;

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

  if (!Icon) return null;

  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;

  return (
    <FadeUp delay={index * 40} distance={10}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.row}
        >
          <LinearGradient
            colors={[`${action.color}14`, "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Position */}
          <View style={styles.rowPosition}>
            <Text style={styles.rowPositionText}>
              {String(index + 1).padStart(2, "0")}
            </Text>
          </View>

          {/* Icon */}
          <LinearGradient
            colors={[`${action.color}2E`, `${action.color}0E`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.rowIcon, { borderColor: `${action.color}55` }]}
          >
            <Icon size={17} color={action.color} />
          </LinearGradient>

          {/* Label */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {action.label}
            </Text>
            <Text style={styles.rowDesc} numberOfLines={1}>
              {action.description}
            </Text>
          </View>

          {/* Reorder buttons */}
          <View style={styles.reorderCol}>
            <Pressable
              onPress={onMoveUp}
              disabled={!canMoveUp}
              hitSlop={4}
              style={[
                styles.reorderBtn,
                !canMoveUp && styles.reorderBtnDisabled,
              ]}
            >
              <ChevronUp
                size={11}
                color={
                  canMoveUp ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)"
                }
                strokeWidth={2.8}
              />
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              disabled={!canMoveDown}
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
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.15)"
                }
                strokeWidth={2.8}
              />
            </Pressable>
          </View>

          {/* Remove */}
          <Pressable
            onPress={onRemove}
            hitSlop={6}
            accessibilityLabel={`Retirer ${action.label}`}
            style={({ pressed }) => [
              styles.removeBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <X size={13} color="#FCA5A5" strokeWidth={2.6} />
          </Pressable>
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================
 * AVAILABLE ROW (search results)
 * ============================================================ */

function AvailableRow({
  action,
  index,
  disabled,
  onPress,
}: {
  action: any;
  index: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const Icon = ICON_MAP[action.id as ActionId];
  const scale = useRef(new Animated.Value(1)).current;

  if (!Icon) return null;

  const onPressIn = () => {
    if (disabled) return;
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
    <FadeUp delay={Math.min(index * 25, 300)} distance={8}>
      <Animated.View
        style={{ transform: [{ scale }], opacity: disabled ? 0.35 : 1 }}
      >
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          style={styles.availableRow}
        >
          <LinearGradient
            colors={[`${action.color}10`, "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={[`${action.color}26`, `${action.color}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.availableIcon, { borderColor: `${action.color}44` }]}
          >
            <Icon size={17} color={action.color} />
          </LinearGradient>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.availableLabel} numberOfLines={1}>
              {action.label}
            </Text>
            <Text style={styles.availableDesc} numberOfLines={1}>
              {action.description}
            </Text>
          </View>

          <View
            style={[
              styles.availableAddBtn,
              {
                backgroundColor: disabled
                  ? "rgba(255,255,255,0.025)"
                  : `${action.color}22`,
                borderColor: disabled
                  ? "rgba(255,255,255,0.06)"
                  : `${action.color}55`,
              },
            ]}
          >
            <Check
              size={13}
              color={disabled ? "rgba(255,255,255,0.25)" : action.color}
              strokeWidth={3}
            />
          </View>
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const [customizing, setCustomizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedAction, setFocusedAction] = useState<ActionId | null>(null);

  const searchRef = useRef<TextInput>(null);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const { activeIds, activeActions, canAdd, toggle, reorder, reset } =
    useQuickActions();

  /* ───── available ───── */
  const available = useMemo(
    () => ALL_ACTIONS.filter((action) => !activeIds.includes(action.id)),
    [activeIds],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredAvailable = useMemo(() => {
    if (!normalizedSearch) return available;
    return available.filter(
      (action) =>
        action.label.toLowerCase().includes(normalizedSearch) ||
        action.description.toLowerCase().includes(normalizedSearch),
    );
  }, [available, normalizedSearch]);

  /* ───── header entrance ───── */
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 460,
      delay: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  /* ───── sheet mount/unmount ───── */
  useEffect(() => {
    if (customizing) {
      setMounted(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 1,
          stiffness: 320,
          damping: 32,
          mass: 0.85,
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
        Animated.timing(sheetAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizing]);

  /* ───── web shortcuts ───── */
  useEffect(() => {
    if (!isBrowser) return;
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCustomizing(true);
        setSearchQuery("");
        setTimeout(() => searchRef.current?.focus(), 400);
        return;
      }
      if (e.key === "Escape" && customizing) {
        e.preventDefault();
        closeCustomizer();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizing]);

  /* ───── actions ───── */
  const openCustomizer = useCallback(() => {
    setCustomizing(true);
    setSearchQuery("");
  }, []);

  const closeCustomizer = useCallback(() => {
    setCustomizing(false);
    setSearchQuery("");
    setFocusedAction(null);
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setFocusedAction(null);
  }, [reset]);

  const handleNavigate = useCallback(
    (route: string, id: ActionId) => {
      setFocusedAction(id);
      onNavigate(route);
    },
    [onNavigate],
  );

  const moveItem = useCallback(
    (index: number, direction: -1 | 1) => {
      const next = [...activeIds];
      const target = index + direction;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      reorder(next as ActionId[]);
    },
    [activeIds, reorder],
  );

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const sheetScale = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const visibleActions = useMemo(
    () => activeActions.slice(0, MAX_VISIBLE_ACTIONS),
    [activeActions],
  );

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <>
      {/* ═══════════ ACTION CENTER ═══════════ */}
      <Animated.View
        style={[
          styles.root,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
        accessibilityLabel="Actions rapides"
      >
        {/* Ambient orbs */}
        <View style={styles.orbLeft} pointerEvents="none" />
        <View style={styles.orbRight} pointerEvents="none" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AnimatedHeaderIcon />

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>Actions rapides</Text>
                <ProgressRing
                  count={activeIds.length}
                  max={MAX_VISIBLE_ACTIONS}
                />
              </View>
              <Text style={styles.headerSub}>
                Votre espace d'accès instantané
              </Text>
            </View>
          </View>

          <Pressable
            onPress={openCustomizer}
            accessibilityLabel="Personnaliser les actions rapides"
            style={({ pressed }) => [
              styles.customizeBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Settings2 size={12} color="#C4B5FD" />
            <Text style={styles.customizeBtnText}>Personnaliser</Text>
          </Pressable>
        </View>

        {/* Active grid */}
        {visibleActions.length > 0 ? (
          <View style={styles.grid}>
            {visibleActions.map((action, index) => (
              <ActiveActionTile
                key={action.id}
                action={action}
                index={index}
                focused={focusedAction === action.id}
                onPress={() => handleNavigate(action.route, action.id)}
              />
            ))}
          </View>
        ) : (
          <FadeUp delay={80}>
            <Pressable
              onPress={openCustomizer}
              style={({ pressed }) => [
                styles.emptyCta,
                pressed && { opacity: 0.9 },
              ]}
            >
              <LinearGradient
                colors={["rgba(139,92,246,0.14)", "rgba(255,255,255,0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["rgba(167,139,250,0.32)", "rgba(99,102,241,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyCtaIcon}
              >
                <Sparkles size={18} color="#C4B5FD" />
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.emptyCtaTitle}>
                  Créez votre espace express
                </Text>
                <Text style={styles.emptyCtaSub}>
                  Ajoutez vos services les plus utilisés.
                </Text>
              </View>
              <Text style={styles.emptyCtaAction}>Configurer</Text>
            </Pressable>
          </FadeUp>
        )}
      </Animated.View>

      {/* ═══════════ CUSTOMIZER SHEET ═══════════ */}
      {mounted ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable
              onPress={closeCustomizer}
              style={StyleSheet.absoluteFill}
              accessibilityLabel="Fermer"
            />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              {
                maxHeight: SCREEN_HEIGHT * 0.92,
                transform: [
                  { translateY: sheetTranslateY },
                  { scale: sheetScale },
                ],
              },
            ]}
            accessibilityLabel="Personnaliser les actions rapides"
          >
            <LinearGradient
              colors={["#0C0A1F", "#0A0818", "#070512"]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Top glow */}
            <View style={styles.sheetTopGlow} pointerEvents="none">
              <LinearGradient
                colors={["rgba(167,139,250,0.35)", "rgba(167,139,250,0)"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1, borderRadius: 999 }}
              />
            </View>

            <View style={styles.sheetTopLine} pointerEvents="none" />
            <View style={styles.sheetBorder} pointerEvents="none" />

            {/* Handle */}
            <View style={styles.handleWrap}>
              <View style={styles.handleBar} />
            </View>

            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <LinearGradient
                  colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sheetHeaderIcon}
                >
                  <Sparkles size={18} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    Votre Command Center
                  </Text>
                  <Text style={styles.sheetSub} numberOfLines={1}>
                    {activeIds.length} raccourci
                    {activeIds.length !== 1 ? "s" : ""} actif
                    {activeIds.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetHeaderActions}>
                <Pressable
                  onPress={handleReset}
                  hitSlop={6}
                  accessibilityLabel="Réinitialiser les actions"
                  style={({ pressed }) => [
                    styles.sheetIconBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <RotateCcw size={14} color="rgba(255,255,255,0.6)" />
                </Pressable>
                <Pressable
                  onPress={closeCustomizer}
                  hitSlop={6}
                  accessibilityLabel="Fermer"
                  style={({ pressed }) => [
                    styles.sheetIconBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <X size={15} color="rgba(255,255,255,0.65)" />
                </Pressable>
              </View>
            </View>

            {/* Sheet content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Active section */}
              <View>
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.sectionEyebrow}>VOS RACCOURCIS</Text>
                    <Text style={styles.sectionSub}>
                      Utilisez ↑↓ pour réorganiser
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.counterBadge,
                      {
                        backgroundColor: !canAdd
                          ? "rgba(251,191,36,0.14)"
                          : "rgba(139,92,246,0.14)",
                        borderColor: !canAdd
                          ? "rgba(251,191,36,0.3)"
                          : "rgba(167,139,250,0.3)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.counterBadgeText,
                        { color: !canAdd ? "#FCD34D" : "#C4B5FD" },
                      ]}
                    >
                      {activeIds.length}/{MAX_VISIBLE_ACTIONS}
                    </Text>
                  </View>
                </View>

                {activeIds.length > 0 ? (
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {activeIds.map((id, index) => {
                      const action = ALL_ACTIONS.find((a) => a.id === id);
                      if (!action) return null;
                      return (
                        <ReorderRow
                          key={id}
                          action={action}
                          index={index}
                          total={activeIds.length}
                          onRemove={() => toggle(id)}
                          onMoveUp={() => moveItem(index, -1)}
                          onMoveDown={() => moveItem(index, 1)}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <FadeUp>
                    <View style={styles.emptyState}>
                      <LinearGradient
                        colors={[
                          "rgba(167,139,250,0.22)",
                          "rgba(99,102,241,0.06)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emptyStateIcon}
                      >
                        <Zap size={18} color="#C4B5FD" />
                      </LinearGradient>
                      <Text style={styles.emptyStateTitle}>
                        Aucun raccourci
                      </Text>
                      <Text style={styles.emptyStateSub}>
                        Ajoutez vos actions favorites pour construire votre
                        espace personnel.
                      </Text>
                    </View>
                  </FadeUp>
                )}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Available section */}
              <View>
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.sectionEyebrow}>EXPLORER</Text>
                    <Text style={styles.sectionSub}>
                      Découvrez toutes vos possibilités
                    </Text>
                  </View>
                  <Text style={styles.sectionCount}>
                    {filteredAvailable.length}
                  </Text>
                </View>

                {/* Search */}
                <View style={styles.searchWrap}>
                  <Search size={14} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    ref={searchRef}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher une action…"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.searchInput}
                    autoComplete="off"
                    accessibilityLabel="Rechercher une action"
                  />
                  {searchQuery ? (
                    <Pressable
                      onPress={() => setSearchQuery("")}
                      hitSlop={6}
                      accessibilityLabel="Effacer"
                    >
                      <X size={13} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Warning if full */}
                {!canAdd ? (
                  <FadeUp distance={6}>
                    <View style={styles.warningBox}>
                      <LinearGradient
                        colors={["rgba(245,158,11,0.18)", "rgba(15,7,32,0.6)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.warningBorder} pointerEvents="none" />
                      <LinearGradient
                        colors={[
                          "rgba(251,191,36,0.28)",
                          "rgba(245,158,11,0.08)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.warningIcon}
                      >
                        <Star size={13} color="#FBBF24" fill="#FBBF24" />
                      </LinearGradient>
                      <Text style={styles.warningText}>
                        Votre espace est complet. Retirez un raccourci pour en
                        ajouter un nouveau.
                      </Text>
                    </View>
                  </FadeUp>
                ) : null}

                {/* Results */}
                <View style={{ gap: 8, marginTop: 12 }}>
                  {filteredAvailable.map((action, index) => (
                    <AvailableRow
                      key={action.id}
                      action={action}
                      index={index}
                      disabled={!canAdd}
                      onPress={() => {
                        if (canAdd) toggle(action.id);
                      }}
                    />
                  ))}
                </View>

                {/* No result */}
                {filteredAvailable.length === 0 && normalizedSearch ? (
                  <FadeUp>
                    <View style={styles.noResult}>
                      <LinearGradient
                        colors={[
                          "rgba(255,255,255,0.08)",
                          "rgba(255,255,255,0.02)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.noResultIcon}
                      >
                        <Search size={17} color="rgba(255,255,255,0.4)" />
                      </LinearGradient>
                      <Text style={styles.noResultTitle}>
                        Aucun raccourci trouvé
                      </Text>
                      <Text style={styles.noResultSub}>
                        Essayez un autre terme.
                      </Text>
                    </View>
                  </FadeUp>
                ) : null}
              </View>
            </ScrollView>

            {/* Bottom hint */}
            <View style={styles.sheetFooter}>
              <Sparkles size={10} color="rgba(167,139,250,0.7)" />
              <Text style={styles.sheetFooterText}>
                Votre espace évolue avec vos habitudes
              </Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  /* ── Root ───────────────────────────────────────── */
  root: {
    position: "relative",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  orbLeft: {
    position: "absolute",
    left: -40,
    top: 40,
    width: 128,
    height: 128,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
    opacity: 0.5,
  },
  orbRight: {
    position: "absolute",
    right: -40,
    top: 0,
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.18)",
    opacity: 0.4,
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconHalo: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(167,139,250,0.42)",
  },
  headerIconGlow: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(124,58,237,0.22)",
  },
  headerIconGradient: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  /* Progress ring */
  progressRing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  progressTrack: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  progressText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.1,
  },

  /* Customize button */
  customizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  customizeBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#C4B5FD",
    letterSpacing: 0.1,
  },

  /* ── Grid ───────────────────────────────────────── */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tileWrap: {
    width: 56,
    alignItems: "center",
  },
  tilePress: {
    alignItems: "center",
    gap: 8,
  },
  tileAura: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    opacity: 0.4,
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  tilePressRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  tileGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    letterSpacing: 0.1,
  },

  /* ── Empty CTA ──────────────────────────────────── */
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
    overflow: "hidden",
  },
  emptyCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  emptyCtaTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  emptyCtaSub: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  emptyCtaAction: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#C4B5FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.14)",
    overflow: "hidden",
  },

  /* ── Backdrop ───────────────────────────────────── */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  /* ── Sheet ──────────────────────────────────────── */
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.85,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 28,
  },
  sheetTopGlow: {
    position: "absolute",
    top: -100,
    left: "25%",
    right: "25%",
    height: 160,
    opacity: 0.9,
  },
  sheetTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(167,139,250,0.4)",
  },
  sheetBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.16)",
  },

  /* Handle */
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

  /* Sheet header */
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sheetHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  sheetSub: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  sheetHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  sheetIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* Sheet scroll */
  sheetScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.4)",
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255,255,255,0.35)",
  },
  counterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  counterBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 24,
  },

  /* ── Row ────────────────────────────────────────── */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  rowPosition: {
    width: 22,
    alignItems: "center",
  },
  rowPositionText: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.5,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowLabel: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  rowDesc: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  reorderCol: {
    width: 22,
    gap: 3,
    alignItems: "center",
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
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.22)",
  },

  /* ── Available row ──────────────────────────────── */
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  availableIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  availableLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: -0.2,
  },
  availableDesc: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },
  availableAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* ── Search ─────────────────────────────────────── */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    color: "#fff",
    fontWeight: "500",
    paddingVertical: 0,
  },

  /* ── Warning ────────────────────────────────────── */
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.28)",
    marginTop: 12,
  },
  warningBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  warningIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  warningText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(252,211,77,0.85)",
    fontWeight: "600",
  },

  /* ── Empty state ────────────────────────────────── */
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 12,
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.32)",
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: -0.2,
  },
  emptyStateSub: {
    marginTop: 6,
    maxWidth: 240,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    fontWeight: "500",
  },

  /* ── No result ──────────────────────────────────── */
  noResult: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  noResultTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.55)",
  },
  noResultSub: {
    marginTop: 4,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },

  /* ── Sheet footer ───────────────────────────────── */
  sheetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  sheetFooterText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.1,
  },
});
