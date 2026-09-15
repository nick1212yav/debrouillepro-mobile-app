// src/pages/home/_components/TopBar.tsx
import {
  View,
  Pressable,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  type ReactNode,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Bell, Menu, Sparkles } from "lucide-react-native";

import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user.ts";
import UserAvatar from "@/components/ui/user-avatar.tsx";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface TopBarProps {
  onMenuOpen: () => void;
  onProfileOpen: () => void;
  onNotificationsOpen: () => void;
  onRecompensesOpen?: () => void;
}

interface Greeting {
  text: string;
  emoji: string;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const TAGLINES = [
  "Que veux-tu régler aujourd'hui ?",
  "Ton Afrique dans ta poche. 🌍",
  "Prêt à conquérir ta journée ? 🚀",
  "Une action suffit pour changer les choses.",
  "Ta ville, tes opportunités. ⚡",
  "Explore. Connecte. Réalise.",
  "Tout ce dont tu as besoin, ici. 💡",
  "Fais bouger les choses aujourd'hui. 💪",
  "Le futur se construit maintenant.",
  "Qu'est-ce qu'on règle ensemble ? 🤝",
  "Ta communauté t'attend. 👥",
  "Chaque jour est une nouvelle opportunité. ✨",
];

const TAGLINE_INTERVAL = 5000;
const TAGLINE_TRANSITION = 350;

/* ============================================================================
 * GREETING
 * ========================================================================== */

function getGreeting(): Greeting {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Bonjour", emoji: "☀️" };
  if (hour >= 12 && hour < 14) return { text: "Bon appétit", emoji: "🍽️" };
  if (hour >= 14 && hour < 18) return { text: "Bon après-midi", emoji: "🌤️" };
  if (hour >= 18 && hour < 21) return { text: "Bonsoir", emoji: "🌇" };
  return { text: "Bonne nuit", emoji: "🌙" };
}

/* ============================================================================
 * GLASS ICON BUTTON
 * ========================================================================== */

function GlassIconButton({
  children,
  onPress,
  label,
  dot,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  dot?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
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
        accessibilityLabel={label}
        style={styles.iconButton}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0.02)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.iconButtonBorder} pointerEvents="none" />
        {children}
        {dot ? <PulseDot /> : null}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * PULSE DOT (notification indicator)
 * ========================================================================== */

function PulseDot() {
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

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 0.35],
  });

  return (
    <View style={styles.pulseDotWrap} pointerEvents="none">
      <Animated.View
        style={[styles.pulseDotGlow, { opacity, transform: [{ scale }] }]}
      />
      <View style={styles.pulseDotCore} />
    </View>
  );
}

/* ============================================================================
 * ANIMATED EMOJI
 * ========================================================================== */

function AnimatedEmoji({ emoji }: { emoji: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: -1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(4000),
      ]),
    ).start();
  }, [anim]);

  const rotate = anim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-6deg", "0deg", "8deg"],
  });
  const scale = anim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1, 1, 1.08],
  });

  return (
    <Animated.Text
      style={[styles.greetingEmoji, { transform: [{ rotate }, { scale }] }]}
    >
      {emoji}
    </Animated.Text>
  );
}

/* ============================================================================
 * ROTATING TAGLINE
 * ========================================================================== */

function RotatingTagline() {
  const [idx, setIdx] = useState(() =>
    Math.floor(Math.random() * TAGLINES.length),
  );
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: TAGLINE_TRANSITION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIdx((current) => (current + 1) % TAGLINES.length);
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }, TAGLINE_INTERVAL);

    return () => clearInterval(interval);
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [7, 0],
  });

  return (
    <Animated.Text
      style={[styles.tagline, { opacity: anim, transform: [{ translateY }] }]}
      numberOfLines={1}
    >
      {TAGLINES[idx]}
    </Animated.Text>
  );
}

/* ============================================================================
 * TOP BAR INNER
 * ========================================================================== */

function TopBarInner({
  onMenuOpen,
  onProfileOpen,
  onNotificationsOpen,
  onRecompensesOpen,
}: TopBarProps) {
  const user = useCurrentUser();

  const greeting = getGreeting();
  const displayName = getDisplayName(user).trim();
  const firstName =
    displayName.length > 0 ? displayName.split(/\s+/)[0] : "Nick";

  /* Entrance animation */
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const containerTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: entrance,
          transform: [{ translateY: containerTranslateY }],
        },
      ]}
    >
      {/* Ambient top glow */}
      <View style={styles.topGlow} pointerEvents="none">
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.28)",
            "rgba(139,92,246,0.08)",
            "rgba(139,92,246,0)",
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topGlowInner}
        />
      </View>

      {/* Main glass container */}
      <View style={styles.container}>
        {/* Base gradient */}
        <LinearGradient
          colors={[
            "rgba(12,8,30,0.75)",
            "rgba(8,11,29,0.55)",
            "rgba(10,6,24,0.75)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Border ring */}
        <View style={styles.containerBorder} pointerEvents="none" />

        {/* Top hairline */}
        <View style={styles.topHairline} pointerEvents="none">
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.2)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Top-right orb */}
        <View style={styles.cornerOrb} pointerEvents="none" />

        {/* Content row */}
        <View style={styles.contentRow}>
          {/* Left — menu button */}
          <GlassIconButton onPress={onMenuOpen} label="Ouvrir le menu" dot>
            <Menu size={19} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
          </GlassIconButton>

          {/* Center — greeting + tagline */}
          <View style={styles.centerBlock}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingText} numberOfLines={1}>
                {greeting.text},{" "}
                <Text style={styles.greetingName}>{firstName}</Text>
              </Text>
              <AnimatedEmoji emoji={greeting.emoji} />
            </View>
            <View style={styles.taglineWrap}>
              <RotatingTagline />
            </View>
          </View>

          {/* Right — actions */}
          <View style={styles.rightActions}>
            {onRecompensesOpen ? (
              <GlassIconButton
                onPress={onRecompensesOpen}
                label="Ouvrir mes récompenses"
              >
                <Sparkles size={17} color="#C4B5FD" strokeWidth={2.2} />
              </GlassIconButton>
            ) : null}

            <GlassIconButton
              onPress={onNotificationsOpen}
              label="Notifications"
              dot
            >
              <Bell size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
            </GlassIconButton>

            {/* Avatar button */}
            <Pressable
              onPress={onProfileOpen}
              accessibilityLabel="Ouvrir mon profil"
              style={({ pressed }) => [
                styles.avatarButton,
                pressed && styles.avatarButtonPressed,
              ]}
            >
              <LinearGradient
                colors={["rgba(167,139,250,0.24)", "rgba(99,102,241,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.avatarButtonBorder} pointerEvents="none" />
              <View style={styles.avatarInner}>
                <UserAvatar user={user} size={32} showOnline />
              </View>
              <View style={styles.avatarRing} pointerEvents="none" />
            </Pressable>
          </View>
        </View>

        {/* Bottom hairline */}
        <View style={styles.bottomHairline} pointerEvents="none">
          <LinearGradient
            colors={[
              "rgba(167,139,250,0)",
              "rgba(167,139,250,0.4)",
              "rgba(167,139,250,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN EXPORT
 * ========================================================================== */

export default function TopBar(props: TopBarProps) {
  return <TopBarInner {...props} />;
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    position: "relative",
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 44 : 54,
    paddingBottom: 12,
  },

  /* ── Top glow ──────────────────────────────────── */
  topGlow: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -144,
    width: 288,
    height: 96,
    borderRadius: 9999,
    opacity: 0.7,
    overflow: "hidden",
  },
  topGlowInner: {
    flex: 1,
  },

  /* ── Main container ────────────────────────────── */
  container: {
    position: "relative",
    borderRadius: 26,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  containerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  topHairline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  cornerOrb: {
    position: "absolute",
    top: -80,
    right: -64,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.18)",
  },
  bottomHairline: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -48,
    width: 96,
    height: 1,
  },

  /* ── Content row ───────────────────────────────── */
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  /* ── Icon button ───────────────────────────────── */
  iconButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconButtonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* ── Pulse dot ─────────────────────────────────── */
  pulseDotWrap: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDotGlow: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A78BFA",
  },
  pulseDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C4B5FD",
    shadowColor: "#A78BFA",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  /* ── Center block ──────────────────────────────── */
  centerBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    maxWidth: "100%",
  },
  greetingText: {
    maxWidth: "100%",
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  greetingName: {
    color: "#fff",
    fontWeight: "900",
  },
  greetingEmoji: {
    fontSize: 16,
  },
  taglineWrap: {
    marginTop: 4,
    height: 18,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tagline: {
    maxWidth: 250,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },

  /* ── Right actions ─────────────────────────────── */
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  /* ── Avatar button ─────────────────────────────── */
  avatarButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    overflow: "hidden",
  },
  avatarButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  avatarButtonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
});
