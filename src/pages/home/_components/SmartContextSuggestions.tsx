// src/pages/home/_components/SmartContextSuggestions.tsx

import {
  View,
  Pressable,
  Text,
  Animated,
  Easing,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
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
 * ICON ADAPTER
 *
 * IMPORTANT:
 * The installed lucide-react-native typings in this project currently reject
 * normal visual props such as size/color.
 *
 * We therefore keep Lucide behind zero-prop adapters.
 * No `any`, no type assertion, no library typing suppression.
 * ========================================================================== */

type SuggestionIcon = ComponentType;

function SparklesIcon() {
  return <Sparkles />;
}

function BriefcaseIcon() {
  return <BriefcaseBusiness />;
}

function CompassIcon() {
  return <Compass />;
}

function GraduationIcon() {
  return <GraduationCap />;
}

function HeartIcon() {
  return <HeartPulse />;
}

function HomeIcon() {
  return <Home />;
}

function MapPinIcon() {
  return <MapPin />;
}

function MessageIcon() {
  return <MessageCircle />;
}

function StoreIcon() {
  return <Store />;
}

function TicketIcon() {
  return <Ticket />;
}

function TrendingIcon() {
  return <TrendingUp />;
}

function WalletIcon() {
  return <Wallet />;
}

function ArrowIcon() {
  return <ArrowRight />;
}

function CloseIcon() {
  return <X />;
}

function ZapIcon() {
  return <Zap />;
}

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface SmartContextSuggestionsProps {
  onNavigate: (page: string) => void;
  onDismiss?: () => void;
}

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
 * MODULE CONFIGURATION
 * ========================================================================== */

const MODULE_CONFIG: Record<string, ModuleConfig> = {
  immo: {
    label: "Immobilier",
    route: "immo",
    Icon: HomeIcon,
    accent: "#A78BFA",
  },

  jobs: {
    label: "Emplois",
    route: "jobs",
    Icon: BriefcaseIcon,
    accent: "#34D399",
  },

  emploi: {
    label: "Emploi",
    route: "emploi",
    Icon: BriefcaseIcon,
    accent: "#34D399",
  },

  transport: {
    label: "Transport",
    route: "transport",
    Icon: CompassIcon,
    accent: "#60A5FA",
  },

  sante: {
    label: "Santé",
    route: "sante",
    Icon: HeartIcon,
    accent: "#F87171",
  },

  marketplace: {
    label: "Marketplace",
    route: "marketplace",
    Icon: StoreIcon,
    accent: "#FB923C",
  },

  community: {
    label: "Communauté",
    route: "community",
    Icon: MessageIcon,
    accent: "#C084FC",
  },

  evenements: {
    label: "Événements",
    route: "evenements",
    Icon: TicketIcon,
    accent: "#F472B6",
  },

  "evenements-pro": {
    label: "Événements pro",
    route: "evenements-pro",
    Icon: TicketIcon,
    accent: "#F472B6",
  },

  voyages: {
    label: "Voyages",
    route: "voyages",
    Icon: CompassIcon,
    accent: "#2DD4BF",
  },

  apprendre: {
    label: "Apprendre",
    route: "apprendre",
    Icon: GraduationIcon,
    accent: "#818CF8",
  },

  cours: {
    label: "Cours",
    route: "cours",
    Icon: GraduationIcon,
    accent: "#818CF8",
  },

  finances: {
    label: "Finances",
    route: "finances",
    Icon: TrendingIcon,
    accent: "#FACC15",
  },

  paiement: {
    label: "Paiement",
    route: "paiement",
    Icon: WalletIcon,
    accent: "#FBBF24",
  },

  wallet: {
    label: "Wallet",
    route: "wallet",
    Icon: WalletIcon,
    accent: "#FACC15",
  },

  agri: {
    label: "Agriculture",
    route: "agri",
    Icon: TrendingIcon,
    accent: "#4ADE80",
  },
};

/* ============================================================================
 * ALIASES
 * ========================================================================== */

const MODULE_ALIASES: Record<string, string> = {
  immobilier: "immo",
  logement: "immo",
  maison: "immo",
  appartement: "immo",

  emploi: "jobs",
  emplois: "jobs",
  travail: "jobs",
  carriere: "jobs",

  sante: "sante",
  medical: "sante",
  médical: "sante",

  commerce: "marketplace",
  achat: "marketplace",
  achats: "marketplace",
  vente: "marketplace",
  marketplace: "marketplace",

  communaute: "community",
  communauté: "community",
  social: "community",

  evenement: "evenements",
  evenements: "evenements",
  événement: "evenements",
  événements: "evenements",

  voyage: "voyages",
  voyages: "voyages",
  tourisme: "voyages",

  formation: "apprendre",
  formations: "apprendre",
  education: "apprendre",
  éducation: "apprendre",
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
  const normalized = value.trim();

  if (!normalized) {
    return "Utilisateur";
  }

  return normalized.split(/\s+/)[0] ?? normalized;
}

function findModuleForText(value: string): ModuleConfig | undefined {
  const normalized = normalize(value);
  const moduleId = MODULE_ALIASES[normalized] ?? normalized;

  return MODULE_CONFIG[moduleId];
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
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
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
 * HEADER ICON
 * ========================================================================== */

function SparklesHeaderIcon() {
  const pop = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const popAnimation = Animated.spring(pop, {
      toValue: 1,
      delay: 120,
      stiffness: 360,
      damping: 20,
      useNativeDriver: true,
    });

    const ringAnimation = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );

    const glowAnimation = Animated.loop(
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
    );

    popAnimation.start();
    ringAnimation.start();
    glowAnimation.start();

    return () => {
      popAnimation.stop();
      ringAnimation.stop();
      glowAnimation.stop();
    };
  }, [glow, pop, ring]);

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
        pointerEvents="none"
        style={[
          styles.headerIconRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.headerIconGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
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
          <SparklesIcon />
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
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: 180 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
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
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
      }),
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
        accessibilityRole="button"
        accessibilityLabel={`${suggestion.title} — ${suggestion.action}`}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <LinearGradient
          colors={[`${suggestion.accent}16`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

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

        <View style={styles.rowIconOuter}>
          <LinearGradient
            colors={[`${suggestion.accent}2E`, `${suggestion.accent}0E`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.rowIcon,
              {
                borderColor: `${suggestion.accent}55`,
              },
            ]}
          >
            <View style={styles.iconVisual}>
              <Icon />
            </View>
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
                  style={[
                    styles.rowPriorityText,
                    {
                      color: suggestion.accent,
                    },
                  ]}
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

        <View style={styles.rowCta}>
          <Text
            style={[
              styles.rowCtaText,
              {
                color: suggestion.accent,
              },
            ]}
            numberOfLines={1}
          >
            {suggestion.action}
          </Text>

          <Animated.View
            style={{
              transform: [{ translateX: arrowTranslateX }],
            }}
          >
            <View
              style={[
                styles.rowCtaIcon,
                {
                  backgroundColor: `${suggestion.accent}22`,
                },
              ]}
            >
              <ArrowIcon />
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
    const animation = Animated.loop(
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
    );

    animation.start();

    return () => {
      animation.stop();
    };
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

          <View style={styles.skeletonHeaderText}>
            <Animated.View style={[styles.skeletonLine1, { opacity }]} />

            <Animated.View style={[styles.skeletonLine2, { opacity }]} />
          </View>
        </View>

        <View style={styles.skeletonRows}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[styles.skeletonRow, { opacity }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function SmartContextSuggestions({
  onNavigate,
  onDismiss,
}: SmartContextSuggestionsProps) {
  const context = useQuery(api.globalContext.getMyContext, {});

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!context) {
      return [];
    }

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

    /* ========================================================================
     * FAVORITES
     * ====================================================================== */

    favoriteModules.forEach((moduleId, index) => {
      const config = MODULE_CONFIG[moduleId];

      if (!config) {
        return;
      }

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

    /* ========================================================================
     * INTERESTS
     * ====================================================================== */

    interests.forEach((interest, index) => {
      const config = findModuleForText(interest);

      if (!config) {
        return;
      }

      const alreadyExists = result.some((item) => item.route === config.route);

      if (alreadyExists) {
        return;
      }

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

    /* ========================================================================
     * PROFESSION
     * ====================================================================== */

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
          Icon: jobConfig.Icon,
          accent: jobConfig.accent,
          priority: 75,
        });
      }
    }

    /* ========================================================================
     * LOCAL CONTEXT
     * ====================================================================== */

    const city = context.location.city?.trim();
    const country = context.location.country?.trim();

    if (city || country) {
      const locationLabel = [city, country]
        .filter((value): value is string => Boolean(value))
        .join(", ");

      result.push({
        id: "local-discovery",
        title: "Autour de vous",
        description: locationLabel
          ? `Découvrez ce qui peut être pertinent à ${locationLabel}.`
          : "Découvrez ce qui peut être pertinent autour de vous.",
        action: "Découvrir",
        route: "explorer",
        Icon: MapPinIcon,
        accent: "#22D3EE",
        priority: 70,
      });
    }

    /* ========================================================================
     * ONBOARDING
     * ====================================================================== */

    if (!context.onboardingCompleted) {
      result.push({
        id: "complete-profile",
        title: "Personnalisez votre expérience",
        description:
          "Complétez votre profil pour rendre votre Home plus pertinente.",
        action: "Commencer",
        route: "profile",
        Icon: SparklesIcon,
        accent: "#C4B5FD",
        priority: 120,
      });
    }

    /* ========================================================================
     * HIDDEN SECTIONS
     * ====================================================================== */

    const filtered = result.filter((item) => !hiddenSections.has(item.route));

    /* ========================================================================
     * DEDUPLICATION + PRIORITY
     * ====================================================================== */

    const seenRoutes = new Set<string>();

    return filtered
      .sort((a, b) => b.priority - a.priority)
      .filter((item) => {
        if (seenRoutes.has(item.route)) {
          return false;
        }

        seenRoutes.add(item.route);
        return true;
      })
      .slice(0, 3);
  }, [context]);

  /* ==========================================================================
   * LOADING
   * ======================================================================== */

  if (context === undefined) {
    return <SuggestionSkeleton />;
  }

  /* ==========================================================================
   * EMPTY
   * ======================================================================== */

  if (context === null || suggestions.length === 0) {
    return null;
  }

  const greetingName = firstName(context.identity.name);

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

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

          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerRow}>
              <SparklesHeaderIcon />

              <View style={styles.headerTextContainer}>
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
                  accessibilityRole="button"
                  accessibilityLabel="Masquer les suggestions"
                  style={({ pressed }) => [
                    styles.dismissBtn,
                    pressed && styles.dismissBtnPressed,
                  ]}
                >
                  <CloseIcon />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* SUGGESTIONS */}

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

          {/* FOOTER */}

          <FadeUp delay={480} distance={6}>
            <View style={styles.footer}>
              <View style={styles.footerIcon}>
                <ZapIcon />
              </View>

              <Text style={styles.footerText} numberOfLines={1}>
                Suggestions basées sur votre contexte
              </Text>
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

  card: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    backgroundColor: "#0B061E",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 18,
    },
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
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  headerTitle: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
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

  dismissBtnPressed: {
    opacity: 0.7,
  },

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

  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.065)",
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
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

  iconVisual: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
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
    color: "#FFFFFF",
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
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },

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

  skeletonHeaderText: {
    flex: 1,
    gap: 8,
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

  skeletonRows: {
    gap: 8,
    padding: 12,
  },

  skeletonRow: {
    height: 80,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
});
