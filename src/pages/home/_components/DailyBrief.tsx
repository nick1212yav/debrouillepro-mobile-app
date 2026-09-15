// src/pages/home/_components/DailyBrief.tsx
import {
  View,
  Pressable,
  Text,
  Image,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
  Flame,
  HeartPulse,
  Home,
  MapPin,
  Newspaper,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface DailyBriefItem {
  id?: string;
  _id?: string;
  title?: string;
  content?: string;
  description?: string;
  moduleId?: string;
  module?: string;
  type?: string;
  authorName?: string;
  authorAvatar?: string;
  city?: string;
  location?: string;
  createdAt?: number;
  _creationTime?: number;
  imageUrl?: string;
  coverUrl?: string;
  score?: number;
  finalScore?: number;
  [key: string]: unknown;
}

interface DailyBriefProps {
  items?: DailyBriefItem[];
  userName?: string;
  city?: string;
  onNavigate: (page: string) => void;
  onOpenItem?: (item: DailyBriefItem) => void;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const MAX_ITEMS = 4;

const MODULE_META: Record<
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
  immo: { label: "Immobilier", color: "#FB923C", icon: Home, route: "immo" },
  annonces: {
    label: "Annonces",
    color: "#FBBF24",
    icon: Newspaper,
    route: "annonces",
  },
  boutique: {
    label: "Boutique",
    color: "#F472B6",
    icon: WalletCards,
    route: "boutique",
  },
  sante: { label: "Santé", color: "#F87171", icon: HeartPulse, route: "sante" },
  health: {
    label: "Santé",
    color: "#F87171",
    icon: HeartPulse,
    route: "sante",
  },
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
  community: {
    label: "Communauté",
    color: "#C084FC",
    icon: Users,
    route: "community",
  },
  transport: {
    label: "Transport",
    color: "#60A5FA",
    icon: MapPin,
    route: "transport",
  },
  agri: {
    label: "Agriculture",
    color: "#4ADE80",
    icon: TrendingUp,
    route: "agri",
  },
  agriculture: {
    label: "Agriculture",
    color: "#4ADE80",
    icon: TrendingUp,
    route: "agri",
  },
  media: {
    label: "Actualités",
    color: "#22D3EE",
    icon: Newspaper,
    route: "media",
  },
  live: { label: "Live", color: "#F87171", icon: Zap, route: "live" },
  voyages: {
    label: "Voyages",
    color: "#818CF8",
    icon: MapPin,
    route: "voyages",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getModuleKey(item: DailyBriefItem): string {
  return String(item.moduleId ?? item.module ?? "").toLowerCase();
}

function getModuleMeta(item: DailyBriefItem) {
  const key = getModuleKey(item);
  return (
    MODULE_META[key] ?? {
      label: "Pour vous",
      color: "#22D3EE",
      icon: Sparkles,
      route: key || "home",
    }
  );
}

function getItemTitle(item: DailyBriefItem): string {
  return (
    item.title?.trim() ||
    item.description?.trim() ||
    item.content
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) ||
    "Une nouveauté pour vous"
  );
}

function getItemDescription(item: DailyBriefItem): string {
  const source = item.description ?? item.content ?? "";
  const clean = source
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}…` : clean;
}

function getTimestamp(item: DailyBriefItem): number {
  return item.createdAt ?? item._creationTime ?? 0;
}

function relativeTime(timestamp: number): string {
  if (!timestamp) return "Récemment";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  const d = new Date(timestamp);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Bonne nuit";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function buildSummary(items: DailyBriefItem[]): {
  total: number;
  moduleCount: number;
  newestModule?: string;
  newestLabel?: string;
} {
  const modules = new Set<string>();
  for (const item of items) {
    const key = getModuleKey(item);
    if (key) modules.add(key);
  }
  const newest = [...items].sort(
    (a, b) => getTimestamp(b) - getTimestamp(a),
  )[0];
  if (!newest) return { total: 0, moduleCount: modules.size };
  const meta = getModuleMeta(newest);
  return {
    total: items.length,
    moduleCount: modules.size,
    newestModule: getModuleKey(newest),
    newestLabel: meta.label,
  };
}

/* ============================================================================
 * ENTRANCE WRAPPER
 * ========================================================================== */

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
      duration: 480,
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
 * PULSING SPARKLE (header logo)
 * ========================================================================== */

function PulsingSparkle() {
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
    outputRange: [0.9, 1.55],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0],
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
        colors={["#A5B4FC", "#818CF8", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        <Sparkles size={20} color="#fff" strokeWidth={2.2} />
      </LinearGradient>
    </View>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function DailyBriefSkeleton() {
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
    <View style={styles.wrapperOuter}>
      <View style={styles.surface}>
        <LinearGradient
          colors={[
            "rgba(99,102,241,0.12)",
            "rgba(15,7,32,0.65)",
            "rgba(10,6,24,0.9)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.borderRing} pointerEvents="none" />

        <View style={styles.skeletonHeader}>
          <Animated.View style={[styles.skeletonLogo, { opacity }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <Animated.View style={[styles.skeletonLine1, { opacity }]} />
            <Animated.View style={[styles.skeletonLine2, { opacity }]} />
          </View>
        </View>

        <View style={{ gap: 10, padding: 12 }}>
          {[1, 2, 3].map((i) => (
            <Animated.View key={i} style={[styles.skeletonRow, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function DailyBriefEmpty({
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
      <View style={styles.wrapperOuter}>
        <View style={styles.surface}>
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
          <View style={styles.borderRing} pointerEvents="none" />
          <View style={styles.emptyOrb} pointerEvents="none" />

          <View style={styles.emptyRow}>
            <Animated.View style={{ transform: [{ translateY }] }}>
              <LinearGradient
                colors={["rgba(129,140,248,0.35)", "rgba(99,102,241,0.15)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIcon}
              >
                <Sparkles size={20} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.emptyTitle}>Votre DailyBrief se prépare</Text>
              <Text style={styles.emptySub}>
                Dès que votre espace contient des nouveautés, nous vous
                montrerons l'essentiel ici.
              </Text>
            </View>

            <Pressable
              onPress={() => onNavigate("community")}
              hitSlop={8}
              style={({ pressed }) => [
                styles.emptyArrowBtn,
                pressed && styles.pressed,
              ]}
            >
              <ArrowRight size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * SUMMARY TILE
 * ========================================================================== */

function SummaryTile({
  icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
  delay: number;
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
        styles.summaryTileWrap,
        {
          opacity: anim,
          transform: [
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
      <View style={styles.summaryTile}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {icon}
          <Text style={[styles.summaryLabel, { color: accent }]}>{label}</Text>
        </View>
        <Text style={styles.summaryValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * BRIEF ITEM
 * ========================================================================== */

function BriefItem({
  item,
  index,
  onNavigate,
  onOpenItem,
}: {
  item: DailyBriefItem;
  index: number;
  onNavigate: (page: string) => void;
  onOpenItem?: (item: DailyBriefItem) => void;
}) {
  const meta = getModuleMeta(item);
  const Icon = meta.icon;
  const title = getItemTitle(item);
  const description = getItemDescription(item);

  const hasImage =
    typeof item.imageUrl === "string" || typeof item.coverUrl === "string";

  const image =
    typeof item.imageUrl === "string"
      ? item.imageUrl
      : typeof item.coverUrl === "string"
        ? item.coverUrl
        : undefined;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 440,
      delay: 220 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const handleClick = () => {
    if (onOpenItem) {
      onOpenItem(item);
      return;
    }
    if (meta.route) {
      onNavigate(meta.route);
    }
  };

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      <Pressable
        onPress={handleClick}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.itemCard,
          {
            borderColor: `${meta.color}33`,
          },
          pressed && styles.pressed,
        ]}
      >
        {/* Gradient wash */}
        <LinearGradient
          colors={[`${meta.color}14`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Accent bar */}
        <View style={[styles.itemAccent, { backgroundColor: meta.color }]} />

        {/* Image / Icon */}
        {hasImage && image ? (
          <View
            style={[styles.itemImageWrap, { borderColor: `${meta.color}55` }]}
          >
            <Image
              source={{ uri: image }}
              style={styles.itemImage}
              accessibilityLabel={title}
            />
          </View>
        ) : (
          <View
            style={[
              styles.itemIconWrap,
              {
                backgroundColor: `${meta.color}22`,
                borderColor: `${meta.color}55`,
              },
            ]}
          >
            <Icon size={18} color={meta.color} />
          </View>
        )}

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.itemMetaRow}>
            <Text style={[styles.itemModuleLabel, { color: meta.color }]}>
              {meta.label}
            </Text>
            <Text style={styles.itemMetaDot}>•</Text>
            <Text style={styles.itemTime}>
              {relativeTime(getTimestamp(item))}
            </Text>
          </View>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {title}
          </Text>
          {description && description !== title ? (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
          {item.city ? (
            <View style={styles.itemCityRow}>
              <MapPin size={9} color="rgba(255,255,255,0.4)" />
              <Text style={styles.itemCity}>{item.city}</Text>
            </View>
          ) : null}
        </View>

        {/* Arrow */}
        <View style={[styles.itemArrow, { borderColor: `${meta.color}33` }]}>
          <ChevronRight size={13} color={`${meta.color}CC`} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function DailyBrief({
  items = [],
  userName,
  city,
  onNavigate,
  onOpenItem,
}: DailyBriefProps) {
  const [dismissed, setDismissed] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  const cleanItems = useMemo(() => {
    const seen = new Set<string>();
    return [...items]
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b.finalScore ?? b.score ?? 0) - (a.finalScore ?? a.score ?? 0),
      )
      .filter((item) => {
        const key = String(item._id ?? item.id ?? getItemTitle(item));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_ITEMS);
  }, [items]);

  const summary = useMemo(() => buildSummary(cleanItems), [cleanItems]);

  if (dismissed) return null;

  if (cleanItems.length === 0) {
    return <DailyBriefEmpty onNavigate={onNavigate} />;
  }

  const greeting = getGreeting();
  const firstName = userName?.trim().split(/\s+/)[0] ?? "";

  const translateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const scale = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  return (
    <Animated.View
      style={[
        styles.wrapperOuter,
        { opacity: cardAnim, transform: [{ translateY }, { scale }] },
      ]}
      accessibilityLabel="DailyBrief"
    >
      <View style={styles.surface}>
        {/* Base gradient */}
        <LinearGradient
          colors={[
            "rgba(99,102,241,0.16)",
            "rgba(15,7,32,0.72)",
            "rgba(10,6,24,0.92)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top highlight */}
        <View style={styles.topHighlight} pointerEvents="none" />

        {/* Ambient orbs */}
        <AmbientOrbs />

        {/* Border ring */}
        <View style={styles.borderRing} pointerEvents="none" />

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          <PulsingSparkle />

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.headerEyebrowRow}>
              <Text style={styles.headerEyebrow}>DAILYBRIEF</Text>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.headerTitle}>
              {greeting}
              {firstName ? ` ${firstName}` : ""}.
            </Text>
            <Text style={styles.headerSub}>
              Voici ce qui mérite votre attention aujourd'hui
              {city ? ` à ${city}` : ""}.
            </Text>
          </View>

          <Pressable
            onPress={() => setDismissed(true)}
            hitSlop={8}
            accessibilityLabel="Masquer DailyBrief"
            style={({ pressed }) => [
              styles.dismissBtn,
              pressed && styles.pressed,
            ]}
          >
            <X size={13} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>

        {/* ───── SUMMARY TILES ───── */}
        <View style={styles.summaryRow}>
          <SummaryTile
            icon={<Bell size={11} color="#A5B4FC" />}
            label="À VOIR"
            value={String(summary.total)}
            accent="#A5B4FC"
            delay={120}
          />
          <SummaryTile
            icon={<Flame size={11} color="#FB923C" />}
            label="TENDANCES"
            value={String(summary.moduleCount)}
            accent="#FB923C"
            delay={180}
          />
          <SummaryTile
            icon={<Clock3 size={11} color="#67E8F9" />}
            label="NOUVEAU"
            value={summary.newestLabel ?? "Pour vous"}
            accent="#67E8F9"
            delay={240}
          />
        </View>

        {/* ───── ITEMS ───── */}
        <View style={styles.itemsWrap}>
          {cleanItems.map((item, index) => (
            <BriefItem
              key={String(item._id ?? item.id ?? index)}
              item={item}
              index={index}
              onNavigate={onNavigate}
              onOpenItem={onOpenItem}
            />
          ))}
        </View>

        {/* ───── FOOTER ───── */}
        <FadeUp delay={520} distance={8}>
          <View style={styles.footer}>
            <View style={styles.footerIcon}>
              <Sparkles size={10} color="#A5B4FC" />
            </View>
            <Text style={styles.footerText} numberOfLines={1}>
              Sélection personnalisée à partir de votre espace.
            </Text>
            <Pressable
              onPress={() => onNavigate("community")}
              hitSlop={8}
              style={({ pressed }) => [
                styles.footerLink,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.footerLinkText}>Tout voir</Text>
              <ArrowRight size={10} color="#A5B4FC" />
            </Pressable>
          </View>
        </FadeUp>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * AMBIENT ORBS
 * ========================================================================== */

function AmbientOrbs() {
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, to: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: to,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    loop(orbA, 1, 5000);
    loop(orbB, 1, 6000);
  }, [orbA, orbB]);

  const scaleA = orbA.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const opacityA = orbA.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.55],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.orb,
          {
            width: 240,
            height: 240,
            top: -120,
            right: -80,
            backgroundColor: "rgba(99,102,241,0.55)",
            opacity: opacityA,
            transform: [{ scale: scaleA }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 220,
            height: 220,
            bottom: -140,
            left: -60,
            backgroundColor: "rgba(139,92,246,0.4)",
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },

  // ── Wrapper / surface
  wrapperOuter: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  surface: {
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#0B061E",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.2)",
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  // ── Header icon
  headerIconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconHalo: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(129,140,248,0.45)",
  },
  headerIconRing: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.55)",
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerEyebrow: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#C7D2FE",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  headerTitle: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  dismissBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  // ── Summary row
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  summaryTileWrap: {
    flex: 1,
  },
  summaryTile: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  summaryLabel: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  summaryValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },

  // ── Items
  itemsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    overflow: "hidden",
  },
  itemAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.9,
  },
  itemImageWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemModuleLabel: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  itemMetaDot: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.25)",
  },
  itemTime: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
  },
  itemTitle: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  itemDescription: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  itemCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  itemCity: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  itemArrow: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
  },

  // ── Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  footerIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.28)",
  },
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#A5B4FC",
    letterSpacing: 0.1,
  },

  // ── Empty
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
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
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  emptySub: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  emptyOrb: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 9999,
    top: -60,
    right: -60,
    backgroundColor: "rgba(99,102,241,0.2)",
  },
  emptyArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  // ── Skeleton
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  skeletonLogo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  skeletonLine1: {
    height: 12,
    width: 130,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonLine2: {
    height: 10,
    width: 200,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonRow: {
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
});
