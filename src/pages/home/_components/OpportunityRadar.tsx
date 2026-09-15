// src/pages/home/_components/OpportunityRadar.tsx
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
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
  type ComponentType,
} from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Home,
  MapPin,
  Radar,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface OpportunityRadarProps {
  onNavigate: (page: string) => void;
  maxItems?: number;
}

interface FeedRecord extends Record<string, unknown> {
  id?: string;
  _id?: string;
  moduleId?: string;
  type?: string;
  title?: string;
  description?: string;
  image?: string;
  route?: string;
  category?: string;
  location?: string;
  city?: string;
  country?: string;
  price?: string | number;
  createdAt?: string | number | Date;
  _creationTime?: number;
  score?: number;
  relevance?: string | number;
}

interface OpportunityCard {
  id: string;
  moduleId: string;
  type: string;
  title: string;
  description: string;
  image?: string;
  route: string;
  category?: string;
  location?: string;
  price?: string | number;
  accent: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  score: number;
  createdAt?: number;
}

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const OPPORTUNITY_TYPES: Record<
  string,
  { label: string; accent: string; Icon: typeof BriefcaseBusiness }
> = {
  job: { label: "Emploi", accent: "#34D399", Icon: BriefcaseBusiness },
  property: { label: "Immobilier", accent: "#A78BFA", Icon: Home },
  service: { label: "Service", accent: "#60A5FA", Icon: Wrench },
  event: { label: "Événement", accent: "#F472B6", Icon: CalendarDays },
  product: { label: "À découvrir", accent: "#FBBF24", Icon: Store },
};

const MODULE_TO_TYPE: Record<
  string,
  "job" | "property" | "service" | "event" | "product"
> = {
  jobs: "job",
  emploi: "job",
  immo: "property",
  immobilier: "property",
  services: "service",
  sante: "service",
  evenements: "event",
  evenement: "event",
  marketplace: "product",
  annonces: "product",
  boutique: "product",
  agri: "product",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function toRecord(value: unknown): FeedRecord {
  if (value !== null && typeof value === "object") {
    return value as FeedRecord;
  }
  return {};
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getString(value: unknown): string | undefined {
  const result = cleanText(value);
  return result || undefined;
}

function isRealOpportunityCard(item: unknown): boolean {
  const record = toRecord(item);

  const id = getString(record.id ?? record._id);
  const moduleId = getString(record.moduleId);
  const title = getString(record.title);
  const description = getString(record.description);
  const route = getString(record.route);

  if (!id || !moduleId || !title || !description || !route) return false;
  if (moduleId.toLowerCase() === "transport") return false;

  const normalizedType = cleanText(record.type).toLowerCase();
  const validType =
    normalizedType in OPPORTUNITY_TYPES ||
    moduleId.toLowerCase() in MODULE_TO_TYPE;

  if (!validType) return false;

  const normalizedTitle = title.toLowerCase();
  const normalizedModule = moduleId.toLowerCase();

  if (
    normalizedTitle === normalizedModule ||
    normalizedTitle === "transport" ||
    normalizedTitle === "contenu"
  ) {
    return false;
  }

  return true;
}

function resolveOpportunityType(record: FeedRecord): string | undefined {
  const type = cleanText(record.type).toLowerCase();
  if (type && OPPORTUNITY_TYPES[type]) return type;
  const moduleId = cleanText(record.moduleId).toLowerCase();
  return MODULE_TO_TYPE[moduleId];
}

function getLocation(record: FeedRecord): string | undefined {
  const directLocation = getString(record.location);
  if (directLocation) return directLocation;
  const city = getString(record.city);
  const country = getString(record.country);
  return [city, country].filter(Boolean).join(", ") || undefined;
}

function getCreatedAt(record: FeedRecord): number | undefined {
  if (typeof record.createdAt === "number") return record.createdAt;
  if (record.createdAt instanceof Date) return record.createdAt.getTime();
  if (typeof record.createdAt === "string") {
    const parsed = Date.parse(record.createdAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof record._creationTime === "number") return record._creationTime;
  return undefined;
}

function getScore(record: FeedRecord): number {
  if (typeof record.score === "number" && Number.isFinite(record.score)) {
    return record.score;
  }
  if (
    typeof record.relevance === "number" &&
    Number.isFinite(record.relevance)
  ) {
    return record.relevance;
  }
  return 0;
}

function formatPrice(price: string | number | undefined): string | undefined {
  if (price === undefined || price === null) return undefined;
  if (typeof price === "number") {
    try {
      return new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      return String(price);
    }
  }
  const value = price.trim();
  return value || undefined;
}

function relativeDate(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  const diff = Date.now() - timestamp;
  if (!Number.isFinite(diff) || diff < 0) return undefined;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "À l'instant";
  if (diff < hour) return `Il y a ${Math.floor(diff / minute)} min`;
  if (diff < day) return `Il y a ${Math.floor(diff / hour)} h`;
  if (diff < 7 * day) return `Il y a ${Math.floor(diff / day)} j`;
  return undefined;
}

/* ============================================================================
 * NORMALISATION
 * ========================================================================== */

function normalizeOpportunities(
  rawItems: unknown[],
  maxItems: number,
): OpportunityCard[] {
  const seen = new Set<string>();

  return rawItems
    .filter(isRealOpportunityCard)
    .map((item): OpportunityCard | null => {
      const record = toRecord(item);

      const id = getString(record.id ?? record._id);
      const moduleId = getString(record.moduleId);
      const title = getString(record.title);
      const description = getString(record.description);
      const route = getString(record.route);

      if (!id || !moduleId || !title || !description || !route) return null;

      const type = resolveOpportunityType(record);
      if (!type) return null;

      const config = OPPORTUNITY_TYPES[type];
      if (!config) return null;

      const key = `${moduleId}:${id}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        id,
        moduleId,
        type,
        title,
        description,
        image: getString(record.image),
        route,
        category: getString(record.category),
        location: getLocation(record),
        price: record.price,
        accent: config.accent,
        Icon: config.Icon,
        label: config.label,
        score: getScore(record),
        createdAt: getCreatedAt(record),
      };
    })
    .filter((item): item is OpportunityCard => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    })
    .slice(0, maxItems);
}

/* ============================================================================
 * FADE UP WRAPPER
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
 * PULSING RADAR ICON
 * ========================================================================== */

function PulsingRadarIcon() {
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

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
      Animated.timing(sweep, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse, sweep, halo]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const sweepRotate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.7],
  });
  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0],
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
      <LinearGradient
        colors={["#6EE7B7", "#10B981", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        <Radar size={20} color="#fff" strokeWidth={2.2} />
      </LinearGradient>
      <Animated.View
        style={[styles.headerSweep, { transform: [{ rotate: sweepRotate }] }]}
        pointerEvents="none"
      >
        <View style={styles.headerSweepLine} />
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function RadarSkeleton() {
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
    <View style={styles.wrapper}>
      <View style={styles.skeletonCard}>
        <LinearGradient
          colors={[
            "rgba(16,185,129,0.14)",
            "rgba(15,7,32,0.6)",
            "rgba(10,6,24,0.85)",
          ]}
          locations={[0, 0.55, 1]}
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
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[styles.skeletonRow, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * OPPORTUNITY CARD
 * ========================================================================== */

function OpportunityCardView({
  opportunity,
  index,
  isTop,
  onPress,
}: {
  opportunity: OpportunityCard;
  index: number;
  isTop: boolean;
  onPress: () => void;
}) {
  const { Icon } = opportunity;
  const scale = useRef(new Animated.Value(1)).current;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 440,
      delay: 180 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.975,
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

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const time = relativeDate(opportunity.createdAt);
  const price = formatPrice(opportunity.price);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { borderColor: `${opportunity.accent}33` }]}
      >
        <LinearGradient
          colors={[`${opportunity.accent}16`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Accent bar */}
        <View
          style={[
            styles.cardAccentBar,
            {
              backgroundColor: opportunity.accent,
              shadowColor: opportunity.accent,
            },
          ]}
          pointerEvents="none"
        />

        {/* Image OR icon-only header */}
        {opportunity.image ? (
          <View
            style={[
              styles.cardImageWrap,
              { borderColor: `${opportunity.accent}44` },
            ]}
          >
            <RNImage
              source={{ uri: opportunity.image }}
              style={styles.cardImage}
              accessibilityLabel={opportunity.title}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardImageOverlay}
              pointerEvents="none"
            />
            <LinearGradient
              colors={[opportunity.accent, `${opportunity.accent}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.cardImageIcon,
                { shadowColor: opportunity.accent },
              ]}
            >
              <Icon size={13} color="#fff" />
            </LinearGradient>
            {time ? (
              <View style={styles.cardImageTimeBadge}>
                <Text style={styles.cardImageTimeText}>{time}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.cardNoImageRow}>
            <View
              style={[
                styles.cardNoImageIcon,
                {
                  backgroundColor: `${opportunity.accent}22`,
                  borderColor: `${opportunity.accent}55`,
                },
              ]}
            >
              <Icon size={16} color={opportunity.accent} />
            </View>
            <Text
              style={[styles.cardNoImageLabel, { color: opportunity.accent }]}
            >
              {opportunity.label}
            </Text>
          </View>
        )}

        {/* Type + badge */}
        <View style={styles.cardTypeRow}>
          <Text style={[styles.cardTypeLabel, { color: opportunity.accent }]}>
            {opportunity.label.toUpperCase()}
          </Text>
          {isTop ? (
            <View style={styles.cardTopBadge}>
              <Text style={styles.cardTopBadgeText}>À SAISIR</Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {opportunity.title}
        </Text>

        {/* Description */}
        <Text style={styles.cardDescription} numberOfLines={2}>
          {opportunity.description}
        </Text>

        {/* Meta row */}
        <View style={styles.cardMetaRow}>
          {opportunity.location ? (
            <View style={styles.cardLocationRow}>
              <MapPin size={9} color="rgba(255,255,255,0.4)" />
              <Text style={styles.cardLocationText} numberOfLines={1}>
                {opportunity.location}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {price ? (
            <Text
              style={[styles.cardPrice, { color: opportunity.accent }]}
              numberOfLines={1}
            >
              {price}
            </Text>
          ) : null}
        </View>

        {/* CTA footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterLabel}>Découvrir</Text>
          <View
            style={[
              styles.cardFooterArrow,
              { backgroundColor: `${opportunity.accent}22` },
            ]}
          >
            <ChevronRight size={13} color={opportunity.accent} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function OpportunityRadar({
  onNavigate,
  maxItems = 3,
}: OpportunityRadarProps) {
  const { isAuthenticated } = useConvexAuth();

  const home = useQuery(api.home.getHomeData, isAuthenticated ? {} : "skip");

  const opportunities = useMemo(() => {
    if (!home?.feed?.page) return [];
    return normalizeOpportunities(home.feed.page, maxItems);
  }, [home, maxItems]);

  if (!isAuthenticated) return null;

  if (home === undefined) {
    return <RadarSkeleton />;
  }

  if (!home || opportunities.length === 0) {
    return null;
  }

  return (
    <FadeUp distance={18}>
      <View style={styles.wrapper} accessibilityLabel="Opportunités">
        <View style={styles.mainCard}>
          <LinearGradient
            colors={[
              "rgba(16,185,129,0.14)",
              "rgba(15,7,32,0.72)",
              "rgba(10,6,24,0.92)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topHighlight} pointerEvents="none" />
          <View style={styles.mainBorder} pointerEvents="none" />
          <View style={styles.mainOrb1} pointerEvents="none" />
          <View style={styles.mainOrb2} pointerEvents="none" />

          {/* ───── HEADER ───── */}
          <View style={styles.header}>
            <PulsingRadarIcon />

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.headerEyebrowRow}>
                <Text style={styles.headerEyebrow}>RADAR</Text>
                <View style={styles.headerDot} />
                <Text style={styles.headerLive}>EN DIRECT</Text>
              </View>
              <Text style={styles.headerTitle}>Des opportunités à saisir</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                Sélectionnées depuis votre flux réel.
              </Text>
            </View>

            <Sparkles size={15} color="rgba(255,255,255,0.4)" />
          </View>

          {/* ───── CARDS ───── */}
          <View style={styles.cardsWrap}>
            {opportunities.map((opportunity, index) => (
              <OpportunityCardView
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
                isTop={index === 0}
                onPress={() => onNavigate(opportunity.route)}
              />
            ))}
          </View>

          {/* ───── FOOTER ───── */}
          <FadeUp delay={480} distance={6}>
            <View style={styles.footer}>
              <View style={styles.footerIcon}>
                <MapPin size={10} color="#6EE7B7" />
              </View>
              <Text style={styles.footerText} numberOfLines={1}>
                Le radar évolue avec votre activité et votre flux.
              </Text>
              <Pressable
                onPress={() => onNavigate("explorer")}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.footerLink,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.footerLinkText}>Tout voir</Text>
                <ArrowRight size={10} color="#6EE7B7" />
              </Pressable>
            </View>
          </FadeUp>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 16,
  },

  /* ── Main card ──────────────────────────────────── */
  mainCard: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B061E",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mainBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.16)",
  },
  mainOrb1: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: "rgba(16,185,129,0.2)",
  },
  mainOrb2: {
    position: "absolute",
    bottom: -100,
    left: 20,
    width: 180,
    height: 180,
    borderRadius: 9999,
    backgroundColor: "rgba(52,211,153,0.14)",
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconHalo: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(52,211,153,0.45)",
  },
  headerIconGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.22)",
  },
  headerIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#10B981",
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerSweep: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  headerSweepLine: {
    width: 2,
    height: 16,
    borderRadius: 1,
    backgroundColor: "rgba(110,231,183,0.9)",
    shadowColor: "#6EE7B7",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  headerEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#6EE7B7",
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerLive: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
  },
  headerTitle: {
    marginTop: 5,
    fontSize: 15.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  /* ── Cards ──────────────────────────────────────── */
  cardsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  card: {
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.045)",
    overflow: "hidden",
  },
  cardAccentBar: {
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

  /* Card image */
  cardImageWrap: {
    height: 96,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 12,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
  },
  cardImageIcon: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardImageTimeBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardImageTimeText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.2,
  },

  /* Card no image */
  cardNoImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardNoImageIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardNoImageLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  /* Card type */
  cardTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTypeLabel: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  cardTopBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.14)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
  },
  cardTopBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#A7F3D0",
  },

  /* Card body */
  cardTitle: {
    marginTop: 6,
    minHeight: 32,
    fontSize: 12.5,
    fontWeight: "900",
    lineHeight: 16,
    color: "#fff",
    letterSpacing: -0.2,
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
    minHeight: 16,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  cardLocationText: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  cardPrice: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  /* Card footer */
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  cardFooterLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.2,
  },
  cardFooterArrow: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Footer ─────────────────────────────────────── */
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
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.14)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
  },
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#6EE7B7",
    letterSpacing: 0.2,
  },

  /* ── Skeleton ───────────────────────────────────── */
  skeletonCard: {
    borderRadius: 30,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.12)",
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  skeletonLogo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.18)",
  },
  skeletonLine1: {
    height: 12,
    width: 128,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  skeletonLine2: {
    height: 10,
    width: 200,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonRow: {
    height: 96,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
});
