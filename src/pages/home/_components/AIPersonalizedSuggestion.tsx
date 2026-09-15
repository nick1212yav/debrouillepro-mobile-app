// src/pages/home/_components/AIPersonalizedSuggestion.tsx
import {
  View,
  Pressable,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useEffect, useRef, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Wand2,
} from "lucide-react-native";

/* ============================================================================
 * DATA
 * ========================================================================== */

const MODULE_LABELS: Record<string, string> = {
  immo: "Immobilier",
  jobs: "Emplois",
  transport: "Transport",
  sante: "Santé",
  paiement: "Paiement",
  marketplace: "Marché",
  agri: "Agriculture",
  community: "Communauté",
  evenements: "Événements",
  voyages: "Voyages",
  apprendre: "Apprendre",
  fitness: "Fitness",
  media: "Médias",
  wallet: "Wallet",
  dashboard: "Dashboard",
};

const MODULE_COLORS: Record<string, string> = {
  immo: "#818CF8",
  jobs: "#34D399",
  transport: "#60A5FA",
  sante: "#F87171",
  paiement: "#FBBF24",
  marketplace: "#FB923C",
  agri: "#4ADE80",
  community: "#C084FC",
  evenements: "#F472B6",
  voyages: "#2DD4BF",
  apprendre: "#818CF8",
  fitness: "#F87171",
  media: "#F472B6",
  wallet: "#FACC15",
  dashboard: "#A78BFA",
};

const MODULE_ICONS: Record<string, string> = {
  immo: "⌂",
  jobs: "↗",
  transport: "⇄",
  sante: "✚",
  paiement: "₿",
  marketplace: "◇",
  agri: "✦",
  community: "◎",
  evenements: "✦",
  voyages: "✈",
  apprendre: "⌘",
  fitness: "◈",
  media: "▶",
  wallet: "◒",
  dashboard: "◫",
};

/* ============================================================================
 * PROPS
 * ========================================================================== */

interface Props {
  onNavigate: (page: string) => void;
  onOpenStudio: () => void;
}

/* ============================================================================
 * BACKGROUND ORBS
 * ========================================================================== */

function AmbientOrbs() {
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(orbA, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbA, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(orbB, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbB, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loopA.start();
    loopB.start();
    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, [orbA, orbB]);

  const scaleA = orbA.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const opacityA = orbA.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0.62],
  });
  const translateB = orbB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });
  const opacityB = orbB.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.4],
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
            right: -90,
            backgroundColor: "rgba(236,72,153,0.6)",
            opacity: opacityA,
            transform: [{ scale: scaleA }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 200,
            height: 200,
            bottom: -110,
            left: -70,
            backgroundColor: "rgba(168,85,247,0.55)",
            opacity: opacityB,
            transform: [{ translateX: translateB }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * PULSING SPARKLE AVATAR
 * ========================================================================== */

function PulsingSparkle() {
  const glow = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [glow, halo]);

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.9],
  });
  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <View style={styles.avatarWrap}>
      <Animated.View
        style={[
          styles.avatarHalo,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: glowScale }] }}>
        <LinearGradient
          colors={["#F472B6", "#A855F7", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradient}
        >
          <Sparkles size={16} color="#fff" strokeWidth={2.4} />
        </LinearGradient>
      </Animated.View>
      <View style={styles.avatarDot} />
    </View>
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
 * MODULE ROW
 * ========================================================================== */

function ModuleRow({
  moduleId,
  index,
  onPress,
}: {
  moduleId: string;
  index: number;
  onPress: () => void;
}) {
  const color = MODULE_COLORS[moduleId] ?? "#A855F7";
  const label = MODULE_LABELS[moduleId] ?? moduleId;
  const icon = MODULE_ICONS[moduleId] ?? "✦";

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: 120 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX }] }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.moduleRow,
          {
            backgroundColor: `${color}14`,
            borderColor: `${color}30`,
          },
          pressed && styles.pressed,
        ]}
      >
        {/* Gradient wash */}
        <LinearGradient
          colors={[`${color}20`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.moduleIcon,
            {
              backgroundColor: `${color}22`,
              borderColor: `${color}40`,
            },
          ]}
        >
          <Text style={[styles.moduleIconText, { color }]}>{icon}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.moduleLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.moduleSub, { color: `${color}CC` }]}>
            Recommandé pour vous
          </Text>
        </View>

        <ChevronRight size={13} color={`${color}AA`} />
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function AIPersonalizedSuggestion({
  onNavigate,
  onOpenStudio,
}: Props) {
  const { isAuthenticated } = useFirebaseAuth();

  const prefs = useQuery(
    api.aiPreferences.getMyPreferences,
    isAuthenticated ? {} : "skip",
  );

  const modules = useMemo(
    () => (prefs?.recommendedModules ?? []).slice(0, 3),
    [prefs?.recommendedModules],
  );

  const tags = useMemo(
    () => (prefs?.recommendedTags ?? []).slice(0, 5),
    [prefs?.recommendedTags],
  );

  // Bottom pulse light
  const pulse = useRef(new Animated.Value(0)).current;
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

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  /*
   * Rien à afficher tant que l'utilisateur n'a
   * aucune personnalisation IA exploitable.
   *
   * Aucun mock.
   */
  if (
    !prefs ||
    (!prefs.recommendedModules?.length &&
      !prefs.recommendedTags?.length &&
      !prefs.welcomeMessage)
  ) {
    return null;
  }

  return (
    <FadeUp distance={14}>
      <View
        style={styles.wrapper}
        accessibilityLabel="Suggestions personnalisées par IA"
      >
        <View style={styles.surface}>
          {/* Base gradient */}
          <LinearGradient
            colors={[
              "rgba(236,72,153,0.14)",
              "rgba(139,92,246,0.10)",
              "rgba(12,6,26,0.9)",
            ]}
            locations={[0, 0.45, 1]}
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

          {/* ─────────── HEADER ─────────── */}
          <View style={styles.header}>
            <PulsingSparkle />

            <View style={styles.headerText}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerEyebrow}>POUR VOUS</Text>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>IA</Text>
                </View>
              </View>
              <Text style={styles.headerSub} numberOfLines={1}>
                Une sélection construite pour vous
              </Text>
            </View>

            <Pressable
              onPress={onOpenStudio}
              accessibilityRole="button"
              accessibilityLabel="Personnaliser les suggestions IA"
              hitSlop={6}
              style={({ pressed }) => [
                styles.customizeBtn,
                pressed && styles.pressed,
              ]}
            >
              <Wand2 size={11} color="#F9A8D4" />
              <Text style={styles.customizeText}>Personnaliser</Text>
            </Pressable>
          </View>

          {/* ─────────── WELCOME MESSAGE ─────────── */}
          {prefs.welcomeMessage ? (
            <FadeUp delay={80} distance={10} style={styles.welcomeWrap}>
              <View style={styles.welcomeCard}>
                <LinearGradient
                  colors={["#F472B6", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.welcomeBar}
                />
                <Text style={styles.welcomeText}>{prefs.welcomeMessage}</Text>
              </View>
            </FadeUp>
          ) : null}

          {/* ─────────── MODULES ─────────── */}
          {modules.length > 0 ? (
            <View style={styles.modulesBlock}>
              <View style={styles.modulesHeader}>
                <Text style={styles.modulesEyebrow}>
                  À DÉCOUVRIR MAINTENANT
                </Text>
                <Text style={styles.modulesCount}>
                  {modules.length} suggestion
                  {modules.length > 1 ? "s" : ""}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {modules.map((moduleId, index) => (
                  <ModuleRow
                    key={`${moduleId}-${index}`}
                    moduleId={moduleId}
                    index={index}
                    onPress={() => onNavigate(moduleId)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* ─────────── TAGS ─────────── */}
          {tags.length > 0 ? (
            <FadeUp delay={280} distance={8}>
              <View style={styles.tagsRow}>
                <Text style={styles.tagsEyebrow}>VOS INTÉRÊTS</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, paddingRight: 8 }}
                  style={{ flex: 1 }}
                >
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                    </View>
                  ))}
                </ScrollView>

                <Pressable
                  onPress={onOpenStudio}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier vos intérêts"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.tagEditBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <ArrowUpRight size={11} color="rgba(255,255,255,0.55)" />
                </Pressable>
              </View>
            </FadeUp>
          ) : null}

          {/* Bottom pulse light */}
          <Animated.View
            pointerEvents="none"
            style={[styles.bottomLight, { opacity: pulseOpacity }]}
          />
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
    marginTop: 12,
    borderRadius: 28,
    shadowColor: "#EC4899",
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },

  surface: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#100524",
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.22)",
  },

  bottomLight: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(244,114,182,0.85)",
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  // ── Avatar
  avatarWrap: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHalo: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(244,114,182,0.55)",
  },
  avatarGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#F472B6",
    shadowOpacity: 0.75,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  avatarDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F9A8D4",
    borderWidth: 2,
    borderColor: "#100524",
    shadowColor: "#F9A8D4",
    shadowOpacity: 0.95,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#F5D0FE",
  },
  aiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(236,72,153,0.18)",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.35)",
  },
  aiBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#FBCFE8",
  },
  headerSub: {
    marginTop: 4,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },

  customizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(236,72,153,0.14)",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.3)",
  },
  customizeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F9A8D4",
    letterSpacing: 0.2,
  },

  // ── Welcome message
  welcomeWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    paddingLeft: 3,
  },
  welcomeBar: {
    width: 3,
    borderRadius: 2,
  },
  welcomeText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },

  // ── Modules
  modulesBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modulesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modulesEyebrow: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.4)",
  },
  modulesCount: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
  },

  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  moduleIconText: {
    fontSize: 15,
    fontWeight: "900",
  },
  moduleLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.2,
  },
  moduleSub: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── Tags
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  tagsEyebrow: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.35)",
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.22)",
  },
  tagChipText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "rgba(252,211,77,0.9)",
    letterSpacing: 0.2,
  },
  tagEditBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});
