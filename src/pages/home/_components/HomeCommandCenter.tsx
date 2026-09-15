// src/pages/home/_components/HomeCommandCenter.tsx
import {
  View,
  Pressable,
  Text,
  Image as RNImage,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
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
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface HomeCommandItem {
  id?: string;
  _id?: string;
  title?: string;
  content?: string;
  description?: string;
  moduleId?: string;
  module?: string;
  type?: string;
  route?: string;
  city?: string;
  location?: string;
  authorName?: string;
  authorAvatar?: string;
  imageUrl?: string;
  coverUrl?: string;
  score?: number;
  finalScore?: number;
  createdAt?: number;
  _creationTime?: number;
  unread?: boolean;
  urgent?: boolean;
  featured?: boolean;
  [key: string]: unknown;
}

export interface HomeCommandModule {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  route: string;
  priority?: number;
}

interface HomeCommandCenterProps {
  userName?: string;
  city?: string;
  items?: HomeCommandItem[];
  modules?: HomeCommandModule[];
  notificationCount?: number;
  messageCount?: number;
  streak?: number;
  onNavigate: (page: string) => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  onMessages?: () => void;
  onCreate?: () => void;
  onOpenItem?: (item: HomeCommandItem) => void;
  onSettings?: () => void;
}

/* ============================================================================
 * MODULE REGISTRY
 * ========================================================================== */

const MODULES: Record<
  string,
  {
    label: string;
    color: string;
    icon: typeof Sparkles;
    route: string;
  }
> = {
  jobs: {
    label: "Jobs",
    color: "#A78BFA",
    icon: BriefcaseBusiness,
    route: "jobs",
  },
  immo: { label: "Immo", color: "#FB923C", icon: Home, route: "immo" },
  evenements: {
    label: "Événements",
    color: "#F472B6",
    icon: CalendarDays,
    route: "evenements",
  },
  events: {
    label: "Événements",
    color: "#F472B6",
    icon: CalendarDays,
    route: "evenements",
  },
  pay: { label: "Pay", color: "#34D399", icon: WalletCards, route: "pay" },
  community: {
    label: "Communauté",
    color: "#C084FC",
    icon: UserRound,
    route: "community",
  },
  voyages: {
    label: "Voyages",
    color: "#818CF8",
    icon: Compass,
    route: "voyages",
  },
  transport: {
    label: "Transport",
    color: "#60A5FA",
    icon: Navigation,
    route: "transport",
  },
  live: { label: "Live", color: "#F87171", icon: Zap, route: "live" },
  boutique: {
    label: "Boutique",
    color: "#F472B6",
    icon: WalletCards,
    route: "boutique",
  },
  sante: { label: "Santé", color: "#F87171", icon: Sparkles, route: "sante" },
  education: {
    label: "Éducation",
    color: "#22D3EE",
    icon: Sparkles,
    route: "education",
  },
  agri: {
    label: "Agriculture",
    color: "#4ADE80",
    icon: TrendingUp,
    route: "agri",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getMeta(item: HomeCommandItem) {
  const key = String(item.moduleId ?? item.module ?? "").toLowerCase();
  return (
    MODULES[key] ?? {
      label: "Pour vous",
      color: "#818CF8",
      icon: Sparkles,
      route: item.route ?? key ?? "home",
    }
  );
}

function getTimestamp(item: HomeCommandItem) {
  return item.createdAt ?? item._creationTime ?? 0;
}

function cleanText(value?: string) {
  return (
    value
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function getTitle(item: HomeCommandItem) {
  return (
    item.title ||
    cleanText(item.description) ||
    cleanText(item.content).slice(0, 100) ||
    "Nouveauté pour vous"
  );
}

function relativeTime(timestamp: number) {
  if (!timestamp) return "Maintenant";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `${days} j`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
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

/* ============================================================================
 * HEADER
 * ========================================================================== */

function HeaderButton({
  Icon,
  badge,
  onPress,
}: {
  Icon: typeof Search;
  badge?: number;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
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
        hitSlop={4}
        style={styles.headerBtn}
      >
        <Icon size={14} color="rgba(255,255,255,0.65)" />
        {badge && badge > 0 ? (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function CommandHeader({
  userName,
  city,
  notificationCount,
  messageCount,
  onSearch,
  onNotifications,
  onMessages,
  onSettings,
}: {
  userName?: string;
  city?: string;
  notificationCount: number;
  messageCount: number;
  onSearch?: () => void;
  onNotifications?: () => void;
  onMessages?: () => void;
  onSettings?: () => void;
}) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? "";

  return (
    <FadeUp distance={-8}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#818CF8", "#6366F1", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerAvatar}
          >
            <UserRound size={18} color="#fff" />
            <View style={styles.headerOnline} />
          </LinearGradient>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headerEyebrow}>{greeting()}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {firstName || "Bienvenue"}
              {firstName ? "." : ""}
            </Text>
            {city ? (
              <View style={styles.headerCityRow}>
                <MapPin size={8} color="#67E8F9" />
                <Text style={styles.headerCity} numberOfLines={1}>
                  {city}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.headerButtons}>
          <HeaderButton Icon={Search} onPress={onSearch} />
          <HeaderButton
            Icon={Bell}
            badge={notificationCount}
            onPress={onNotifications}
          />
          <HeaderButton
            Icon={MessageCircle}
            badge={messageCount}
            onPress={onMessages}
          />
          <HeaderButton Icon={Settings2} onPress={onSettings} />
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * QUICK COMMAND BAR
 * ========================================================================== */

function QuickCommandBar({
  onSearch,
  onCreate,
}: {
  onSearch?: () => void;
  onCreate?: () => void;
}) {
  const createScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(createScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(createScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <FadeUp delay={60} distance={10}>
      <View style={styles.quickBar}>
        <Pressable
          onPress={onSearch}
          style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
        >
          <Search size={15} color="rgba(255,255,255,0.5)" />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Que cherchez-vous ?
          </Text>
          <View style={styles.searchHint}>
            <Text style={styles.searchHintText}>Rechercher</Text>
          </View>
        </Pressable>

        <Animated.View style={{ transform: [{ scale: createScale }] }}>
          <Pressable
            onPress={onCreate}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            accessibilityLabel="Créer"
            style={styles.createBtnWrap}
          >
            <LinearGradient
              colors={["#A78BFA", "#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createBtn}
            >
              <Plus size={17} color="#fff" strokeWidth={2.6} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * COMMAND STRIP
 * ========================================================================== */

function CommandPill({
  Icon,
  label,
  accent,
  onPress,
}: {
  Icon: typeof Flame;
  label: string;
  accent: string;
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
        style={[
          styles.stripPill,
          {
            backgroundColor: `${accent}14`,
            borderColor: `${accent}3A`,
          },
        ]}
      >
        <Icon size={11} color={accent} />
        <Text style={styles.stripPillText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function CommandStrip({
  streak,
  items,
  onNavigate,
}: {
  streak: number;
  items: HomeCommandItem[];
  onNavigate: (page: string) => void;
}) {
  const nearby = items.find((item) => !!item.city || !!item.location);

  return (
    <FadeUp delay={120} distance={10}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
      >
        <CommandPill
          Icon={Flame}
          label={
            streak > 0 ? `${streak} jour${streak > 1 ? "s" : ""}` : "Commencer"
          }
          accent="#FB923C"
          onPress={() => onNavigate("profile")}
        />
        <CommandPill
          Icon={Sparkles}
          label="Pour vous"
          accent="#A78BFA"
          onPress={() => onNavigate("home")}
        />
        <CommandPill
          Icon={MapPin}
          label={nearby ? "Près de vous" : "À proximité"}
          accent="#22D3EE"
          onPress={() => onNavigate("nearby")}
        />
        <CommandPill
          Icon={TrendingUp}
          label="Tendances"
          accent="#34D399"
          onPress={() => onNavigate("community")}
        />
      </ScrollView>
    </FadeUp>
  );
}

/* ============================================================================
 * PRIORITY PANEL
 * ========================================================================== */

function PriorityPanel({
  items,
  onOpenItem,
  onNavigate,
}: {
  items: HomeCommandItem[];
  onOpenItem?: (item: HomeCommandItem) => void;
  onNavigate: (page: string) => void;
}) {
  const priority = items[0];
  if (!priority) return null;

  const meta = getMeta(priority);
  const Icon = meta.icon;
  const title = getTitle(priority);

  const image =
    typeof priority.imageUrl === "string"
      ? priority.imageUrl
      : typeof priority.coverUrl === "string"
        ? priority.coverUrl
        : undefined;

  const open = () => {
    if (onOpenItem) {
      onOpenItem(priority);
      return;
    }
    onNavigate(meta.route);
  };

  return (
    <FadeUp delay={180} distance={14}>
      <View style={styles.priorityWrap}>
        <Pressable
          onPress={open}
          style={({ pressed }) => [
            styles.priorityCard,
            pressed && styles.pressed,
          ]}
        >
          {/* Base gradient */}
          <LinearGradient
            colors={[
              `${meta.color}30`,
              "rgba(12,10,28,0.72)",
              "rgba(10,6,24,0.92)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Optional image */}
          {image ? (
            <RNImage
              source={{ uri: image }}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.25 }]}
              accessibilityLabel=""
            />
          ) : null}

          {/* Orbs */}
          <View
            style={[styles.priorityOrb, { backgroundColor: `${meta.color}30` }]}
            pointerEvents="none"
          />

          {/* Border ring */}
          <View
            style={[styles.priorityBorder, { borderColor: `${meta.color}44` }]}
            pointerEvents="none"
          />

          <View style={styles.priorityInner}>
            <View style={styles.priorityTopRow}>
              <View
                style={[
                  styles.priorityIcon,
                  {
                    backgroundColor: `${meta.color}24`,
                    borderColor: `${meta.color}55`,
                  },
                ]}
              >
                <Icon size={14} color={meta.color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.priorityLabelRow}>
                  <Text style={[styles.priorityLabel, { color: meta.color }]}>
                    PRIORITÉ
                  </Text>
                  <Text style={styles.priorityDot}>•</Text>
                  <Text style={styles.priorityTime}>
                    {relativeTime(getTimestamp(priority))}
                  </Text>
                </View>
                <Text style={styles.prioritySublabel}>
                  Recommandé pour vous
                </Text>
              </View>
            </View>

            <Text style={styles.priorityTitle} numberOfLines={3}>
              {title}
            </Text>

            <View style={styles.priorityBottomRow}>
              <View
                style={[
                  styles.priorityCta,
                  {
                    backgroundColor: `${meta.color}28`,
                    borderColor: `${meta.color}55`,
                  },
                ]}
              >
                <Text style={styles.priorityCtaText}>Découvrir</Text>
                <ArrowRight size={9} color="#fff" />
              </View>
              {priority.city ? (
                <View style={styles.priorityCityRow}>
                  <MapPin size={8} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.priorityCity} numberOfLines={1}>
                    {priority.city}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * SECTION HEADER
 * ========================================================================== */

function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {action ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * MODULE COMMAND GRID
 * ========================================================================== */

function ModuleCommandGrid({
  modules,
  onNavigate,
}: {
  modules: HomeCommandModule[];
  onNavigate: (page: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? modules : modules.slice(0, 8);

  if (!visible.length) return null;

  return (
    <FadeUp delay={240} distance={14}>
      <View style={styles.sectionWrap}>
        <SectionHeader
          title="Votre univers"
          subtitle="Tout DébrouillePro, en un geste"
          action={
            modules.length > 8
              ? expanded
                ? "Réduire"
                : "Tout voir"
              : undefined
          }
          onAction={() => setExpanded((v) => !v)}
        />

        <View style={styles.gridWrap}>
          {visible.map((module, index) => {
            const meta = MODULES[module.id] ?? {
              label: module.label,
              color: "#818CF8",
              icon: Sparkles,
              route: module.route,
            };
            const Icon = meta.icon;

            return (
              <FadeUp
                key={module.id}
                delay={260 + index * 30}
                distance={10}
                style={styles.gridItemWrap}
              >
                <Pressable
                  onPress={() => onNavigate(meta.route)}
                  style={({ pressed }) => [
                    styles.gridItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={[`${meta.color}18`, "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    style={[
                      styles.gridIcon,
                      {
                        backgroundColor: `${meta.color}22`,
                        borderColor: `${meta.color}55`,
                      },
                    ]}
                  >
                    <Icon size={16} color={meta.color} />
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {module.shortLabel || meta.label}
                  </Text>
                </Pressable>
              </FadeUp>
            );
          })}
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * DAILY ACTIONS
 * ========================================================================== */

function DailyActions({
  items,
  onNavigate,
}: {
  items: HomeCommandItem[];
  onNavigate: (page: string) => void;
}) {
  const actions = useMemo(() => {
    const result: Array<{
      id: string;
      icon: typeof BriefcaseBusiness;
      title: string;
      subtitle: string;
      color: string;
      route: string;
    }> = [];

    const hasJobs = items.some(
      (item) =>
        String(item.moduleId ?? item.module ?? "").toLowerCase() === "jobs",
    );
    const hasImmo = items.some(
      (item) =>
        String(item.moduleId ?? item.module ?? "").toLowerCase() === "immo",
    );

    if (hasJobs) {
      result.push({
        id: "jobs",
        icon: BriefcaseBusiness,
        title: "Opportunités pro",
        subtitle: "Voir les nouvelles offres",
        color: "#A78BFA",
        route: "jobs",
      });
    }
    if (hasImmo) {
      result.push({
        id: "immo",
        icon: Home,
        title: "Immobilier",
        subtitle: "Découvrir les annonces",
        color: "#FB923C",
        route: "immo",
      });
    }

    result.push({
      id: "events",
      icon: CalendarDays,
      title: "Que faire aujourd'hui ?",
      subtitle: "Explorer les événements",
      color: "#F472B6",
      route: "evenements",
    });
    result.push({
      id: "nearby",
      icon: MapPin,
      title: "Autour de moi",
      subtitle: "Voir ce qui est proche",
      color: "#22D3EE",
      route: "nearby",
    });

    return result.slice(0, 4);
  }, [items]);

  return (
    <FadeUp delay={300} distance={14}>
      <View style={styles.sectionWrap}>
        <SectionHeader
          title="À faire maintenant"
          subtitle="Des raccourcis qui ont du sens"
        />

        <View style={{ gap: 8, marginTop: 12 }}>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <FadeUp key={action.id} delay={320 + index * 50} distance={10}>
                <Pressable
                  onPress={() => onNavigate(action.route)}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={[`${action.color}18`, "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    style={[
                      styles.actionRowIcon,
                      {
                        backgroundColor: `${action.color}22`,
                        borderColor: `${action.color}55`,
                      },
                    ]}
                  >
                    <Icon size={15} color={action.color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.actionRowTitle}>{action.title}</Text>
                    <Text style={styles.actionRowSub}>{action.subtitle}</Text>
                  </View>
                  <ChevronRight size={13} color="rgba(255,255,255,0.35)" />
                </Pressable>
              </FadeUp>
            );
          })}
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * INSIGHT STRIP
 * ========================================================================== */

function InsightStrip({
  items,
  onNavigate,
}: {
  items: HomeCommandItem[];
  onNavigate: (page: string) => void;
}) {
  const moduleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = String(item.moduleId ?? item.module ?? "other");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const top = moduleCounts[0];
  if (!top) return null;

  const meta = MODULES[top[0]];

  return (
    <FadeUp delay={380} distance={10}>
      <View style={styles.insightWrap}>
        <Pressable
          onPress={() => onNavigate(meta?.route ?? top[0])}
          style={({ pressed }) => [
            styles.insightCard,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={["rgba(52,211,153,0.14)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.insightIcon}>
            <TrendingUp size={15} color="#6EE7B7" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.insightLabel}>VOTRE TENDANCE</Text>
            <Text style={styles.insightText} numberOfLines={2}>
              <Text style={{ fontWeight: "900" }}>
                {meta?.label ?? "Un univers"}
              </Text>{" "}
              attire particulièrement votre attention.
            </Text>
          </View>
          <ArrowRight size={13} color="rgba(110,231,183,0.7)" />
        </Pressable>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * RECENT MODULES
 * ========================================================================== */

function RecentModules({
  modules,
  onNavigate,
}: {
  modules: HomeCommandModule[];
  onNavigate: (page: string) => void;
}) {
  const recent = modules.slice(0, 5);
  if (!recent.length) return null;

  return (
    <FadeUp delay={420} distance={10}>
      <View style={{ marginTop: 20 }}>
        <View style={styles.recentHeader}>
          <Clock3 size={10} color="rgba(255,255,255,0.4)" />
          <Text style={styles.recentHeaderLabel}>ACCÈS RAPIDE</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentContent}
        >
          {recent.map((module) => {
            const meta = MODULES[module.id] ?? {
              label: module.label,
              color: "#818CF8",
              icon: Sparkles,
              route: module.route,
            };
            const Icon = meta.icon;

            return (
              <Pressable
                key={module.id}
                onPress={() => onNavigate(meta.route)}
                style={({ pressed }) => [
                  styles.recentPill,
                  {
                    backgroundColor: `${meta.color}14`,
                    borderColor: `${meta.color}33`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Icon size={10} color={meta.color} />
                <Text style={styles.recentPillText}>
                  {module.shortLabel || meta.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyCommandCenter({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
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
    <FadeUp distance={12}>
      <View style={styles.emptyWrap}>
        <LinearGradient
          colors={[
            "rgba(99,102,241,0.14)",
            "rgba(15,7,32,0.7)",
            "rgba(10,6,24,0.9)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyBorder} pointerEvents="none" />
        <View style={styles.emptyOrb} pointerEvents="none" />

        <View style={styles.emptyRow}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <LinearGradient
              colors={["rgba(165,180,252,0.28)", "rgba(99,102,241,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <Sparkles size={18} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.emptyTitle}>Votre espace est prêt.</Text>
            <Text style={styles.emptySub}>
              Explorez les modules et commencez à construire votre expérience
              personnalisée.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => onNavigate("community")}
          style={({ pressed }) => [
            styles.emptyBtnOuter,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={["#A78BFA", "#7C3AED", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyBtnGradient}
          >
            <Text style={styles.emptyBtnText}>Explorer DébrouillePro</Text>
            <ArrowRight size={12} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function HomeCommandCenter({
  userName,
  city,
  items = [],
  modules = [],
  notificationCount = 0,
  messageCount = 0,
  streak = 0,
  onNavigate,
  onSearch,
  onNotifications,
  onMessages,
  onCreate,
  onOpenItem,
  onSettings,
}: HomeCommandCenterProps) {
  const [showAll, setShowAll] = useState(false);

  const cleanItems = useMemo(() => {
    const seen = new Set<string>();
    return [...items]
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b.finalScore ?? b.score ?? 0) - (a.finalScore ?? a.score ?? 0),
      )
      .filter((item) => {
        const key = String(item._id ?? item.id ?? getTitle(item));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [items]);

  const visibleItems = showAll ? cleanItems : cleanItems.slice(0, 6);

  return (
    <View style={styles.root}>
      <CommandHeader
        userName={userName}
        city={city}
        notificationCount={notificationCount}
        messageCount={messageCount}
        onSearch={onSearch}
        onNotifications={onNotifications}
        onMessages={onMessages}
        onSettings={onSettings}
      />

      <QuickCommandBar onSearch={onSearch} onCreate={onCreate} />

      <CommandStrip
        streak={streak}
        items={cleanItems}
        onNavigate={onNavigate}
      />

      {cleanItems.length > 0 ? (
        <PriorityPanel
          items={cleanItems}
          onOpenItem={onOpenItem}
          onNavigate={onNavigate}
        />
      ) : (
        <EmptyCommandCenter onNavigate={onNavigate} />
      )}

      <ModuleCommandGrid modules={modules} onNavigate={onNavigate} />

      <DailyActions items={cleanItems} onNavigate={onNavigate} />

      <InsightStrip items={cleanItems} onNavigate={onNavigate} />

      {cleanItems.length > 1 ? (
        <FadeUp delay={440} distance={12}>
          <View style={styles.sectionWrap}>
            <SectionHeader
              title="Votre sélection"
              subtitle="Le meilleur de votre espace"
              action={
                cleanItems.length > 6
                  ? showAll
                    ? "Réduire"
                    : "Tout voir"
                  : undefined
              }
              onAction={() => setShowAll((v) => !v)}
            />

            <View style={{ gap: 8, marginTop: 12 }}>
              {visibleItems.slice(1).map((item, index) => {
                const meta = getMeta(item);
                const Icon = meta.icon;

                return (
                  <FadeUp
                    key={String(item._id ?? item.id ?? index)}
                    delay={index * 40}
                    distance={8}
                  >
                    <Pressable
                      onPress={() => {
                        if (onOpenItem) {
                          onOpenItem(item);
                        } else {
                          onNavigate(meta.route);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.selectRow,
                        pressed && styles.pressed,
                      ]}
                    >
                      <LinearGradient
                        colors={[`${meta.color}18`, "rgba(255,255,255,0)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View
                        style={[
                          styles.selectRowIcon,
                          {
                            backgroundColor: `${meta.color}22`,
                            borderColor: `${meta.color}55`,
                          },
                        ]}
                      >
                        <Icon size={14} color={meta.color} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.selectRowMeta}>
                          <Text
                            style={[
                              styles.selectRowLabel,
                              { color: meta.color },
                            ]}
                          >
                            {meta.label}
                          </Text>
                          <Text style={styles.selectRowDot}>•</Text>
                          <Text style={styles.selectRowTime}>
                            {relativeTime(getTimestamp(item))}
                          </Text>
                        </View>
                        <Text style={styles.selectRowTitle} numberOfLines={2}>
                          {getTitle(item)}
                        </Text>
                      </View>
                      <ChevronRight size={13} color="rgba(255,255,255,0.35)" />
                    </Pressable>
                  </FadeUp>
                );
              })}
            </View>
          </View>
        </FadeUp>
      ) : null}

      <RecentModules modules={modules} onNavigate={onNavigate} />

      <FadeUp delay={560} distance={6}>
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>
            DébrouillePro · Votre espace évolue avec vous
          </Text>
        </View>
      </FadeUp>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    paddingBottom: 24,
  },
  pressed: { opacity: 0.85 },

  // ── HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.65,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerOnline: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#34D399",
    borderWidth: 2,
    borderColor: "#08080C",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.45)",
  },
  headerTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  headerCity: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F43F5E",
    borderWidth: 2,
    borderColor: "#08080C",
  },
  headerBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // ── QUICK BAR
  quickBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  searchBtn: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },
  searchHint: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  searchHintText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.2,
  },
  createBtnWrap: {
    borderRadius: 18,
    shadowColor: "#6366F1",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  createBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  // ── STRIP
  stripContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  stripPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  stripPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.1,
  },

  // ── PRIORITY
  priorityWrap: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  priorityCard: {
    minHeight: 148,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.2)",
    backgroundColor: "#0C0A1E",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  priorityBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
  },
  priorityOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 9999,
  },
  priorityInner: {
    padding: 16,
    justifyContent: "space-between",
    flex: 1,
  },
  priorityTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priorityIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  priorityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  priorityDot: {
    fontSize: 8,
    color: "rgba(255,255,255,0.3)",
  },
  priorityTime: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  prioritySublabel: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  priorityTitle: {
    marginTop: 14,
    maxWidth: "86%",
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.6,
    lineHeight: 22,
  },
  priorityBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  priorityCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityCtaText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  priorityCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  priorityCity: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  // ── SECTION HEADER
  sectionWrap: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  sectionAction: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A5B4FC",
    letterSpacing: 0.2,
  },

  // ── GRID
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  gridItemWrap: {
    flexBasis: "23%",
    flexGrow: 1,
    minWidth: 72,
  },
  gridItem: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    letterSpacing: 0.1,
  },

  // ── ACTION ROW
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  actionRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionRowTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.1,
  },
  actionRowSub: {
    marginTop: 3,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // ── INSIGHT
  insightWrap: {
    marginHorizontal: 20,
    marginTop: 22,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.2)",
    backgroundColor: "rgba(10,6,24,0.55)",
    overflow: "hidden",
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.16)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
  },
  insightLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(110,231,183,0.85)",
  },
  insightText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },

  // ── RECENT
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  recentHeaderLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.4)",
  },
  recentContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  recentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  recentPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.1,
  },

  // ── SELECT ROW
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  selectRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  selectRowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectRowLabel: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  selectRowDot: {
    fontSize: 8,
    color: "rgba(255,255,255,0.3)",
  },
  selectRowTime: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  selectRowTitle: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 15,
    letterSpacing: -0.1,
  },

  // ── EMPTY
  emptyWrap: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 28,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.15)",
  },
  emptyOrb: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.2)",
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
    borderColor: "rgba(165,180,252,0.3)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  emptySub: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  emptyBtnOuter: {
    marginTop: 18,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  emptyBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // ── FOOTER
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 26,
    paddingHorizontal: 20,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  footerText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
});
