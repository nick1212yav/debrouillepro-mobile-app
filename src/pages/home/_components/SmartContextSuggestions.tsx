// src/pages/home/_components/SmartContextSuggestions.tsx
import {
  View,
  Pressable,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
  type ComponentType,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  GraduationCap,
  HeartPulse,
  Home,
  MapPin,
  MessageCircle,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface SmartContextSuggestionsProps {
  onNavigate: (page: string) => void;
  onDismiss?: () => void;
}

type SuggestionIcon = ComponentType<{ size?: number; color?: string }>;

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  route: string;
  Icon: SuggestionIcon;
  accent: string;
  priority: number;
}

interface ModuleConfig {
  label: string;
  route: string;
  Icon: SuggestionIcon;
  accent: string;
}

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const MODULE_CONFIG: Record<string, ModuleConfig> = {
  immo: { label: "Immobilier", route: "immo", Icon: Home, accent: "#A78BFA" },
  jobs: {
    label: "Emplois",
    route: "jobs",
    Icon: BriefcaseBusiness,
    accent: "#34D399",
  },
  emploi: {
    label: "Emploi",
    route: "emploi",
    Icon: BriefcaseBusiness,
    accent: "#34D399",
  },
  transport: {
    label: "Transport",
    route: "transport",
    Icon: Compass,
    accent: "#60A5FA",
  },
  sante: {
    label: "Santé",
    route: "sante",
    Icon: HeartPulse,
    accent: "#F87171",
  },
  marketplace: {
    label: "Marketplace",
    route: "marketplace",
    Icon: Store,
    accent: "#FB923C",
  },
  community: {
    label: "Communauté",
    route: "community",
    Icon: MessageCircle,
    accent: "#C084FC",
  },
  evenements: {
    label: "Événements",
    route: "evenements",
    Icon: Ticket,
    accent: "#F472B6",
  },
  "evenements-pro": {
    label: "Événements pro",
    route: "evenements-pro",
    Icon: Ticket,
    accent: "#F472B6",
  },
  voyages: {
    label: "Voyages",
    route: "voyages",
    Icon: Compass,
    accent: "#2DD4BF",
  },
  apprendre: {
    label: "Apprendre",
    route: "apprendre",
    Icon: GraduationCap,
    accent: "#818CF8",
  },
  cours: {
    label: "Cours",
    route: "cours",
    Icon: GraduationCap,
    accent: "#818CF8",
  },
  finances: {
    label: "Finances",
    route: "finances",
    Icon: TrendingUp,
    accent: "#FACC15",
  },
  paiement: {
    label: "Paiement",
    route: "paiement",
    Icon: Wallet,
    accent: "#FBBF24",
  },
  wallet: { label: "Wallet", route: "wallet", Icon: Wallet, accent: "#FACC15" },
  agri: {
    label: "Agriculture",
    route: "agri",
    Icon: TrendingUp,
    accent: "#4ADE80",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}

function findModuleForText(value: string): ModuleConfig | undefined {
  const normalized = normalize(value);

  const aliases: Record<string, string> = {
    immobilier: "immo",
    logement: "immo",
    maison: "immo",
    appartement: "immo",
    emploi: "jobs",
    emplois: "jobs",
    travail: "jobs",
    carrière: "jobs",
    carriere: "jobs",
    santé: "sante",
    sante: "sante",
    médical: "sante",
    medical: "sante",
    commerce: "marketplace",
    achat: "marketplace",
    achats: "marketplace",
    vente: "marketplace",
    marketplace: "marketplace",
    communauté: "community",
    communaute: "community",
    social: "community",
    événement: "evenements",
    événements: "evenements",
    evenement: "evenements",
    evenements: "evenements",
    voyage: "voyages",
    voyages: "voyages",
    tourisme: "voyages",
    formation: "apprendre",
    formations: "apprendre",
    éducation: "apprendre",
    education: "apprendre",
    apprentissage: "apprendre",
    finance: "finances",
    finances: "finances",
    argent: "finances",
    paiement: "paiement",
    paiements: "paiement",
    agriculture: "agri",
    agriculteur: "agri",
    agricole: "agri",
  };

  const moduleId = aliases[normalized] ?? normalized;
  return MODULE_CONFIG[moduleId];
}

/* ============================================================================
 * FADE UP WRAPPER
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
 * SPARKLES HEADER ICON
 * ========================================================================== */

function SparklesHeaderIcon() {
  const pop = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      delay: 120,
      stiffness: 360,
      damping: 20,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pop, ring, glow]);

  const popScale = pop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const popRotate = pop.interpolate({
    inputRange: [0, 1],
    outputRange: ["-20deg", "0deg"],
  });

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.65],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0],
  });

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.15],
  });
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.85],
  });

  return (
    <View style={styles.headerIconWrap}>
      <Animated.View
        style={[
          styles.headerIconRing,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.headerIconGlow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={{
          transform: [{ scale: popScale }, { rotate: popRotate }],
        }}
      >
        <LinearGradient
          colors={["#A78BFA", "#7C3AED", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIconGradient}
        >
          <Sparkles size={18} color="#fff" strokeWidth={2.3} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * SUGGESTION ROW
 * ========================================================================== */

function SuggestionRow({
  suggestion,
  index,
  isTop,
  onPress,
}: {
  suggestion: Suggestion;
  index: number;
  isTop: boolean;
  onPress: () => void;
}) {
  const { Icon } = suggestion;
  const scale = useRef(new Animated.Value(1)).current;
  const anim = useRef(new Animated.Value(0)).current;
  const arrowShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: 180 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.985,
        useNativeDriver: true,
        speed: 40,
      }),
      Animated.spring(arrowShift, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
      }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }),
      Animated.spring(arrowShift, {
        toValue: 0,
        useNativeDriver: true,
        speed: 40,
      }),
    ]).start();
  };

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const arrowTranslateX = arrowShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateX }, { scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel={`${suggestion.title} — ${suggestion.action}`}
        style={styles.row}
      >
        {/* Base gradient wash */}
        <LinearGradient
          colors={[`${suggestion.accent}16`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Accent left bar */}
        <View
          pointerEvents="none"
          style={[
            styles.rowAccentBar,
            {
              backgroundColor: suggestion.accent,
              shadowColor: suggestion.accent,
            },
          ]}
        />

        {/* Icon */}
        <View style={styles.rowIconOuter}>
          <LinearGradient
            colors={[`${suggestion.accent}2E`, `${suggestion.accent}0E`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.rowIcon, { borderColor: `${suggestion.accent}55` }]}
          >
            <Icon size={18} color={suggestion.accent} />
          </LinearGradient>
          <View
            style={[
              styles.rowIconDot,
              {
                backgroundColor: suggestion.accent,
                shadowColor: suggestion.accent,
              },
            ]}
          />
        </View>

        {/* Content */}
        <View style={styles.rowBody}>
          <View style={styles.rowTitleRow}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {suggestion.title}
            </Text>
            {isTop ? (
              <View
                style={[
                  styles.rowPriorityBadge,
                  {
                    backgroundColor: `${suggestion.accent}22`,
                    borderColor: `${suggestion.accent}44`,
                  },
                ]}
              >
                <Text
                  style={[styles.rowPriorityText, { color: suggestion.accent }]}
                >
                  PRIORITÉ
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowDescription} numberOfLines={2}>
            {suggestion.description}
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.rowCta}>
          <Text
            style={[styles.rowCtaText, { color: suggestion.accent }]}
            numberOfLines={1}
          >
            {suggestion.action}
          </Text>
          <Animated.View
            style={{ transform: [{ translateX: arrowTranslateX }] }}
          >
            <View
              style={[
                styles.rowCtaIcon,
                { backgroundColor: `${suggestion.accent}22` },
              ]}
            >
              <ArrowRight
                size={13}
                color={suggestion.accent}
                strokeWidth={2.4}
              />
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function SuggestionSkeleton() {
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
    outputRange: [0.4, 0.85],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.skeletonCard}>
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.12)",
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

        <View style={{ gap: 8, padding: 12 }}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[styles.skeletonRow, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function SmartContextSuggestions({
  onNavigate,
  onDismiss,
}: SmartContextSuggestionsProps) {
  const context = useQuery(api.globalContext.getMyContext, {});

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!context) return [];

    const result: Suggestion[] = [];

    const favoriteModules = Array.isArray(context.home.favoriteModules)
      ? context.home.favoriteModules
      : [];

    const hiddenSections = new Set(
      Array.isArray(context.home.hiddenSections)
        ? context.home.hiddenSections
        : [],
    );

    const interests = Array.isArray(context.profile.interests)
      ? context.profile.interests
      : [];

    const profession = context.profile.profession?.trim() ?? "";

    /* ─── 1. MODULES FAVORIS ─── */
    favoriteModules.forEach((moduleId, index) => {
      const config = MODULE_CONFIG[moduleId];
      if (!config) return;

      result.push({
        id: `favorite-${moduleId}`,
        title: config.label,
        description: "Votre espace favori est prêt à être découvert.",
        action: "Ouvrir",
        route: config.route,
        Icon: config.Icon,
        accent: config.accent,
        priority: 100 - index,
      });
    });

    /* ─── 2. INTÉRÊTS ─── */
    interests.forEach((interest, index) => {
      const config = findModuleForText(interest);
      if (!config) return;

      const alreadyExists = result.some((item) => item.route === config.route);
      if (alreadyExists) return;

      result.push({
        id: `interest-${normalize(interest)}`,
        title: config.label,
        description: `Découvrez les possibilités liées à « ${interest} ».`,
        action: "Explorer",
        route: config.route,
        Icon: config.Icon,
        accent: config.accent,
        priority: 80 - index,
      });
    });

    /* ─── 3. PROFESSION ─── */
    if (profession) {
      const jobConfig = MODULE_CONFIG.jobs;
      const alreadyExists = result.some(
        (item) => item.route === jobConfig.route,
      );

      if (!alreadyExists) {
        result.push({
          id: "profession-jobs",
          title: "Développez votre activité",
          description:
            "Des outils et espaces adaptés à votre profil professionnel.",
          action: "Explorer",
          route: jobConfig.route,
          Icon: BriefcaseBusiness,
          accent: jobConfig.accent,
          priority: 75,
        });
      }
    }

    /* ─── 4. CONTEXTE LOCAL ─── */
    if (context.location.city || context.location.country) {
      const locationLabel = [context.location.city, context.location.country]
        .filter(Boolean)
        .join(", ");

      result.push({
        id: "local-discovery",
        title: "Autour de vous",
        description: locationLabel
          ? `Découvrez ce qui peut être pertinent à ${locationLabel}.`
          : "Découvrez ce qui peut être pertinent autour de vous.",
        action: "Découvrir",
        route: "explorer",
        Icon: MapPin,
        accent: "#22D3EE",
        priority: 70,
      });
    }

    /* ─── 5. ONBOARDING ─── */
    if (!context.onboardingCompleted) {
      result.push({
        id: "complete-profile",
        title: "Personnalisez votre expérience",
        description:
          "Complétez votre profil pour rendre votre Home plus pertinent.",
        action: "Commencer",
        route: "profile",
        Icon: Sparkles,
        accent: "#C4B5FD",
        priority: 120,
      });
    }

    /* ─── 6. FILTRAGE ─── */
    const filtered = result.filter((item) => !hiddenSections.has(item.route));

    /* ─── 7. DÉDUPLICATION + LIMITE ─── */
    const seen = new Set<string>();

    return filtered
      .sort((a, b) => b.priority - a.priority)
      .filter((item) => {
        if (seen.has(item.route)) return false;
        seen.add(item.route);
        return true;
      })
      .slice(0, 3);
  }, [context]);

  /* ───── loading ───── */
  if (context === undefined) {
    return <SuggestionSkeleton />;
  }

  /* ───── no context / no suggestions ───── */
  if (!context || suggestions.length === 0) {
    return null;
  }

  const greetingName = firstName(context.identity.name);

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <FadeUp distance={18}>
      <View
        style={styles.wrapper}
        accessibilityLabel="Suggestions personnalisées"
      >
        <View style={styles.card}>
          <LinearGradient
            colors={[
              "rgba(139,92,246,0.16)",
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
          <View style={styles.orbTop} pointerEvents="none" />
          <View style={styles.orbBottom} pointerEvents="none" />

          {/* ───── HEADER ───── */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <SparklesHeaderIcon />

              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.headerEyebrowRow}>
                  <Text style={styles.headerEyebrow}>POUR VOUS</Text>
                  <View style={styles.headerDot} />
                </View>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {greetingName}, voici ce qui peut vous servir.
                </Text>
                <Text style={styles.headerSub} numberOfLines={2}>
                  Votre Home s'adapte progressivement à vos besoins.
                </Text>
              </View>

              {onDismiss ? (
                <Pressable
                  onPress={onDismiss}
                  hitSlop={8}
                  accessibilityLabel="Masquer les suggestions"
                  style={({ pressed }) => [
                    styles.dismissBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <X size={14} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* ───── SUGGESTIONS ───── */}
          <View style={styles.rowsWrap}>
            {suggestions.map((suggestion, index) => (
              <SuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                index={index}
                isTop={index === 0}
                onPress={() => onNavigate(suggestion.route)}
              />
            ))}
          </View>

          {/* ───── FOOTER ───── */}
          <FadeUp delay={480} distance={6}>
            <View style={styles.footer}>
              <Zap size={11} color="#C4B5FD" fill="#C4B5FD" />
              <Text style={styles.footerText} numberOfLines={1}>
                Suggestions générées à partir de votre contexte
              </Text>
              <View style={styles.footerLive}>
                <View style={styles.footerLiveDot} />
                <Text style={styles.footerLiveText}>EN DIRECT</Text>
              </View>
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
  card: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    backgroundColor: "#0B061E",
    shadowColor: "#000",
    shadowOpacity: 0.4,
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
    borderColor: "rgba(167,139,250,0.12)",
  },
  orbTop: {
    position: "absolute",
    top: -110,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -100,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.16)",
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.6)",
  },
  headerIconGlow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(167,139,250,0.45)",
  },
  headerIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#C4B5FD",
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A78BFA",
    shadowColor: "#A78BFA",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerTitle: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* ── Rows ───────────────────────────────────────── */
  rowsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
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
  rowIconOuter: {
    width: 44,
    height: 44,
    position: "relative",
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowIconDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#0B061E",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowTitle: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  rowPriorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  rowPriorityText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  rowDescription: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  rowCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowCtaText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.2,
    maxWidth: 60,
  },
  rowCtaIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
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
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },
  footerLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  footerLiveText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
  },

  /* ── Skeleton ───────────────────────────────────── */
  skeletonCard: {
    borderRadius: 30,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(10,6,24,0.5)",
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  skeletonLogo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  skeletonLine1: {
    height: 12,
    width: 112,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  skeletonLine2: {
    height: 10,
    width: 192,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonRow: {
    height: 80,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
});
