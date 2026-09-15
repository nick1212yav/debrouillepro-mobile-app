// src/pages/home/_components/AIBanner.tsx
import {
  View,
  Pressable,
  Text,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  Brain,
  ChevronRight,
} from "lucide-react-native";

interface AIBannerProps {
  onOpenAI: () => void;
  onOpenStudio?: () => void;
}

/* ============================================================================
 * ANIMATED BACKGROUND (orbs)
 * ========================================================================== */

function BannerAmbient() {
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
    loop(orbA, -40, 8000);
    loop(orbB, 50, 10000);
  }, [orbA, orbB]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Orbe haut-droit */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: 260,
            height: 260,
            top: -130,
            right: -110,
            backgroundColor: "rgba(139,92,246,0.55)",
            transform: [{ translateY: orbA }],
          },
        ]}
      />
      {/* Orbe bas-gauche */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: 220,
            height: 220,
            bottom: -120,
            left: -90,
            backgroundColor: "rgba(99,102,241,0.45)",
            transform: [{ translateY: orbB }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * PULSING AVATAR
 * ========================================================================== */

function PulsingAvatar({ size = 44 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse, rotate]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "8deg"],
  });
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Halo */}
      <Animated.View
        style={[
          styles.avatarHalo,
          {
            width: size,
            height: size,
            borderRadius: size / 3,
            transform: [{ scale: haloScale }],
            opacity: haloOpacity,
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [{ scale }, { rotate: rotation }],
        }}
      >
        <LinearGradient
          colors={["#A78BFA", "#7C3AED", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.avatarGradient,
            { width: size, height: size, borderRadius: size / 3 },
          ]}
        >
          <Sparkles size={size * 0.42} color="#fff" strokeWidth={2.3} />
        </LinearGradient>
      </Animated.View>

      {/* Green dot online */}
      <View
        style={[
          styles.onlineDot,
          {
            width: size * 0.24,
            height: size * 0.24,
            borderRadius: size * 0.12,
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * CAPABILITY CHIP
 * ========================================================================== */

function CapabilityChip({ label, delay }: { label: string; delay: number }) {
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
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.capabilityChip}>
        <Text style={styles.capabilityChipText}>{label}</Text>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN BANNER
 * ========================================================================== */

export default function AIBanner({ onOpenAI, onOpenStudio }: AIBannerProps) {
  const hasStudio = typeof onOpenStudio === "function";

  // Entrance animation
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headlineAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, headlineAnim, actionsAnim]);

  const buildEntrance = (anim: Animated.Value, distance = 14) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.wrapper} accessibilityLabel="Débrouille AI">
      {/* Glass surface with gradient */}
      <View style={styles.surface}>
        {/* Base gradient */}
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.16)",
            "rgba(76,29,149,0.10)",
            "rgba(15,7,32,0.85)",
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Inner top highlight */}
        <LinearGradient
          colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topHighlight}
          pointerEvents="none"
        />

        {/* Ambient orbs */}
        <BannerAmbient />

        {/* Border ring */}
        <View style={styles.borderRing} pointerEvents="none" />

        {/* ─────────── HEADER ─────────── */}
        <Animated.View style={[styles.header, buildEntrance(headerAnim, 12)]}>
          <PulsingAvatar size={44} />

          <View style={styles.headerText}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Débrouille AI</Text>
              <View style={styles.intelligenceBadge}>
                <Text style={styles.intelligenceBadgeText}>INTELLIGENCE</Text>
              </View>
            </View>
            <View style={styles.headerSubRow}>
              <Brain size={9} color="rgba(255,255,255,0.45)" />
              <Text style={styles.headerSub}>Votre copilote numérique</Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Prêt</Text>
          </View>
        </Animated.View>

        {/* ─────────── HEADLINE ─────────── */}
        <Animated.View
          style={[styles.headlineBlock, buildEntrance(headlineAnim, 14)]}
        >
          <Text style={styles.headline}>
            Une idée.{"\n"}
            <Text style={styles.headlineAccent}>
              Des possibilités infinies.
            </Text>
          </Text>
          <Text style={styles.headlineSub}>
            Pose une question, crée, transforme ou donne vie à ton prochain
            projet avec l'intelligence de Débrouille.
          </Text>
        </Animated.View>

        {/* ─────────── ACTIONS ─────────── */}
        <Animated.View
          style={[styles.actionsBlock, buildEntrance(actionsAnim, 14)]}
        >
          {/* Primary — Parler à l'IA */}
          <Pressable
            onPress={onOpenAI}
            accessibilityRole="button"
            accessibilityLabel="Parler à Débrouille AI"
            style={({ pressed }) => [
              styles.primaryActionOuter,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={["#8B5CF6", "#6366F1", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryAction}
            >
              {/* Subtle shine */}
              <View style={styles.primaryActionShine} pointerEvents="none" />

              <View style={styles.primaryIconBox}>
                <Sparkles size={16} color="#fff" strokeWidth={2.3} />
              </View>
              <View style={styles.primaryTextWrap}>
                <Text style={styles.primaryTitle}>Parler à l'IA</Text>
                <Text style={styles.primarySub}>Demande n'importe quoi</Text>
              </View>
              <ArrowRight size={15} color="rgba(255,255,255,0.85)" />
            </LinearGradient>
          </Pressable>

          {/* Studio */}
          {hasStudio ? (
            <Pressable
              onPress={onOpenStudio}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir IA Studio"
              style={({ pressed }) => [
                styles.studioAction,
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={["rgba(245,158,11,0.14)", "rgba(245,158,11,0.04)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.studioIconBox}>
                <Wand2 size={16} color="#FDE68A" />
              </View>

              <View style={styles.studioTextWrap}>
                <Text style={styles.studioTitle}>IA Studio</Text>
                <Text style={styles.studioSub}>
                  Créer · Transformer · Générer
                </Text>
              </View>

              <ChevronRight size={15} color="rgba(253,230,138,0.7)" />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* ─────────── CAPABILITIES ─────────── */}
        <View style={styles.capabilitiesRow}>
          {["Comprendre", "Créer", "Traduire", "Transformer"].map(
            (capability, i) => (
              <CapabilityChip
                key={capability}
                label={capability}
                delay={520 + i * 60}
              />
            ),
          )}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 30,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },

  surface: {
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#0F0720",
  },

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },

  // ── Avatar
  avatarHalo: {
    position: "absolute",
    backgroundColor: "rgba(167,139,250,0.35)",
  },
  avatarGradient: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.65,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  onlineDot: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#34D399",
    borderWidth: 2,
    borderColor: "#0F0720",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
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
  headerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  intelligenceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  intelligenceBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#DDD6FE",
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  headerSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(110,231,183,0.9)",
  },

  // ── Headline
  headlineBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headline: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.8,
    lineHeight: 27,
  },
  headlineAccent: {
    color: "#C4B5FD",
  },
  headlineSub: {
    marginTop: 8,
    maxWidth: 330,
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
  },

  // ── Actions block
  actionsBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },

  // Primary
  primaryActionOuter: {
    borderRadius: 18,
    shadowColor: "#6366F1",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 18,
    overflow: "hidden",
  },
  primaryActionShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  primaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  primaryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  primaryTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  primarySub: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },

  // Studio
  studioAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.28)",
    overflow: "hidden",
    backgroundColor: "rgba(245,158,11,0.04)",
  },
  studioIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.28)",
  },
  studioTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  studioTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#FDE68A",
    letterSpacing: -0.2,
  },
  studioSub: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  // Capabilities
  capabilitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  capabilityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  capabilityChipText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.2,
  },
});
