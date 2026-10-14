// src/pages/home/_components/TopBar.tsx
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Menu, Sparkles } from "lucide-react-native";

import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user.ts";
import UserAvatar from "@/components/ui/user-avatar.tsx";

/* ============================================================================
 * TYPES
 * ========================================================================== */

/**
 * `true` → pastille pulsante ; nombre > 0 → pastille chiffrée (99+ au-delà) ;
 * `false` / 0 / undefined → rien.
 */
type BadgeValue = boolean | number | undefined;

interface TopBarProps {
  onMenuOpen: () => void;
  onProfileOpen: () => void;
  onNotificationsOpen: () => void;
  onRecompensesOpen?: () => void;

  /** Nombre de notifications non lues. Rien n'est affiché si 0 / absent. */
  notificationCount?: number;
  /** Pastille sur le bouton menu (ex. nouveautés). Absente par défaut. */
  menuBadge?: boolean;
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

const BUTTON_SIZE = 40;
const BUTTON_RADIUS = 14;
const BASE_COLOR = "#0A0818";

const GLASS_GRADIENT = [
  "rgba(255,255,255,0.08)",
  "rgba(255,255,255,0.02)",
] as const;
const AVATAR_GRADIENT = [
  "rgba(167,139,250,0.26)",
  "rgba(99,102,241,0.08)",
] as const;

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getGreeting(): Greeting {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Bonjour", emoji: "☀️" };
  if (hour >= 12 && hour < 14) return { text: "Bon appétit", emoji: "🍽️" };
  if (hour >= 14 && hour < 18) return { text: "Bon après-midi", emoji: "🌤️" };
  if (hour >= 18 && hour < 21) return { text: "Bonsoir", emoji: "🌇" };
  return { text: "Bonne nuit", emoji: "🌙" };
}

function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/* ============================================================================
 * PULSE DOT
 * ========================================================================== */

function PulseDot({ reducedMotion }: { reducedMotion: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
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
    );

    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 0.3],
  });

  return (
    <View style={styles.dotWrap} pointerEvents="none">
      <Animated.View
        style={[styles.dotGlow, { opacity, transform: [{ scale }] }]}
      />
      <View style={styles.dotCore} />
    </View>
  );
}

/* ============================================================================
 * BADGE (posé HORS du bouton : le bouton est en overflow hidden)
 * ========================================================================== */

function Badge({
  value,
  reducedMotion,
}: {
  value: BadgeValue;
  reducedMotion: boolean;
}) {
  if (typeof value === "number" && value > 0) {
    return (
      <View style={styles.countBadge} pointerEvents="none">
        <Text style={styles.countBadgeText} maxFontSizeMultiplier={1}>
          {value > 99 ? "99+" : String(Math.floor(value))}
        </Text>
      </View>
    );
  }

  if (value === true) {
    return <PulseDot reducedMotion={reducedMotion} />;
  }

  return null;
}

/* ============================================================================
 * GLASS BUTTON
 *
 * Pas de `Pressable style={({ pressed }) => ...}` : dans cette app, les styles
 * renvoyés par une fonction `style` semblent ignorés. Le retour visuel passe
 * par une animation d'échelle + ripple Android.
 * ========================================================================== */

function GlassButton({
  children,
  onPress,
  label,
  badge,
  variant = "glass",
  reducedMotion,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  badge?: BadgeValue;
  variant?: "glass" | "avatar";
  reducedMotion: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const isAvatar = variant === "avatar";

  return (
    <Animated.View style={[styles.buttonWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.92)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={4}
        android_ripple={{ color: "rgba(167,139,250,0.22)" }}
        style={styles.button}
      >
        <LinearGradient
          colors={isAvatar ? AVATAR_GRADIENT : GLASS_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[styles.buttonBorder, isAvatar && styles.buttonBorderAvatar]}
        />
        {children}
      </Pressable>

      <Badge value={badge} reducedMotion={reducedMotion} />
    </Animated.View>
  );
}

/* ============================================================================
 * ANIMATED EMOJI
 * ========================================================================== */

function AnimatedEmoji({
  emoji,
  reducedMotion,
}: {
  emoji: string;
  reducedMotion: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      anim.setValue(0);
      return;
    }

    const loop = Animated.loop(
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
    );

    loop.start();
    return () => loop.stop();
  }, [anim, reducedMotion]);

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
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {emoji}
    </Animated.Text>
  );
}

/* ============================================================================
 * ROTATING TAGLINE
 * ========================================================================== */

function RotatingTagline({ reducedMotion }: { reducedMotion: boolean }) {
  const [idx, setIdx] = useState(() =>
    Math.floor(Math.random() * TAGLINES.length),
  );
  const anim = useRef(new Animated.Value(1)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (reducedMotion) {
        setIdx((current) => (current + 1) % TAGLINES.length);
        return;
      }

      const out = Animated.timing(anim, {
        toValue: 0,
        duration: TAGLINE_TRANSITION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });
      running.current = out;

      out.start(({ finished }) => {
        if (!finished) return;

        setIdx((current) => (current + 1) % TAGLINES.length);

        const back = Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
        running.current = back;
        back.start();
      });
    }, TAGLINE_INTERVAL);

    return () => {
      clearInterval(interval);
      running.current?.stop();
    };
  }, [anim, reducedMotion]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
  });

  return (
    <Animated.Text
      style={[styles.tagline, { opacity: anim, transform: [{ translateY }] }]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {TAGLINES[idx]}
    </Animated.Text>
  );
}

/* ============================================================================
 * TOP BAR
 * ========================================================================== */

function TopBarInner({
  onMenuOpen,
  onProfileOpen,
  onNotificationsOpen,
  onRecompensesOpen,
  notificationCount,
  menuBadge,
}: TopBarProps) {
  const user = useCurrentUser();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReduceMotion();

  const greeting = getGreeting();
  const displayName = getDisplayName(user).trim();
  const firstName = displayName.length > 0 ? displayName.split(/\s+/)[0] : "";

  /* Entrance animation */
  const entrance = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      entrance.setValue(1);
      return;
    }

    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [entrance, reducedMotion]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, 0],
  });

  const greetingLabel = firstName
    ? `${greeting.text}, ${firstName}`
    : greeting.text;

  return (
    <Animated.View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 16) + 8,
          opacity: entrance,
          transform: [{ translateY }],
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
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.container}>
        <LinearGradient
          colors={[
            "rgba(40,24,88,0.55)",
            "rgba(14,16,44,0.35)",
            "rgba(28,14,64,0.55)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.containerBorder} />

        <View pointerEvents="none" style={styles.topHairline}>
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.22)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* LIGNE 1 : menu · salutation · actions */}
        <View style={styles.contentRow}>
          <GlassButton
            onPress={onMenuOpen}
            label="Ouvrir le menu"
            badge={menuBadge}
            reducedMotion={reducedMotion}
          >
            <Menu size={19} color="rgba(255,255,255,0.92)" strokeWidth={2.2} />
          </GlassButton>

          <View
            style={styles.greetingBlock}
            accessible
            accessibilityRole="header"
            accessibilityLabel={greetingLabel}
          >
            {firstName ? (
              <>
                <View style={styles.greetingTopRow}>
                  <Text
                    style={styles.greetingText}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.2}
                  >
                    {greeting.text}
                  </Text>
                  <AnimatedEmoji
                    emoji={greeting.emoji}
                    reducedMotion={reducedMotion}
                  />
                </View>
                <Text
                  style={styles.greetingName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={1.2}
                >
                  {firstName}
                </Text>
              </>
            ) : (
              <View style={styles.greetingTopRow}>
                <Text
                  style={styles.greetingName}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  {greeting.text}
                </Text>
                <AnimatedEmoji
                  emoji={greeting.emoji}
                  reducedMotion={reducedMotion}
                />
              </View>
            )}
          </View>

          <View style={styles.rightActions}>
            {onRecompensesOpen ? (
              <GlassButton
                onPress={onRecompensesOpen}
                label="Ouvrir mes récompenses"
                reducedMotion={reducedMotion}
              >
                <Sparkles size={17} color="#C4B5FD" strokeWidth={2.2} />
              </GlassButton>
            ) : null}

            <GlassButton
              onPress={onNotificationsOpen}
              label={
                notificationCount && notificationCount > 0
                  ? `Notifications, ${notificationCount} non lues`
                  : "Notifications"
              }
              badge={notificationCount}
              reducedMotion={reducedMotion}
            >
              <Bell
                size={18}
                color="rgba(255,255,255,0.92)"
                strokeWidth={2.2}
              />
            </GlassButton>

            <GlassButton
              onPress={onProfileOpen}
              label="Ouvrir mon profil"
              variant="avatar"
              reducedMotion={reducedMotion}
            >
              <View style={styles.avatarInner}>
                <UserAvatar user={user} size="w-8 h-8" showOnline />
              </View>
            </GlassButton>
          </View>
        </View>

        {/* LIGNE 2 : slogan sur toute la largeur (plus de troncature) */}
        <View style={styles.taglineRow}>
          <RotatingTagline reducedMotion={reducedMotion} />
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
    paddingBottom: 12,
  },

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

  /* Base opaque : évite l'artefact d'ombre Android sur fond translucide. */
  container: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: BASE_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
      },
      default: {},
    }),
  },

  containerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  topHairline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  /* ── Ligne 1 ── */
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonWrap: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },

  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  buttonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  buttonBorderAvatar: {
    borderColor: "rgba(196,181,253,0.35)",
  },

  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 11,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /* ── Salutation (alignée à gauche, hiérarchie en deux lignes) ── */
  greetingBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  greetingTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  greetingText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.62)",
  },

  greetingName: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: "#FFFFFF",
  },

  greetingEmoji: {
    fontSize: 13,
    lineHeight: 16,
  },

  /* ── Ligne 2 : slogan ── */
  taglineRow: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    height: 30,
    overflow: "hidden",
    justifyContent: "center",
  },

  tagline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
    color: "rgba(255,255,255,0.62)",
  },

  /* ── Badges ── */
  dotWrap: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  dotGlow: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#A78BFA",
  },

  dotCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C4B5FD",
    borderWidth: 2,
    borderColor: BASE_COLOR,
  },

  countBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    borderWidth: 2,
    borderColor: BASE_COLOR,
  },

  countBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
