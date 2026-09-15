// src/pages/home/_components/SwipeableCard.tsx
import React from "react";
import { View, Text, StyleSheet, Platform, type ViewStyle } from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, X, Sparkles } from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  disabled?: boolean;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const SWIPE_THRESHOLD = 100;
const EXIT_DISTANCE = 520;
const MAX_ROTATION = 8;

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
}: SwipeableCardProps) {
  /**
   * Position horizontale de la carte.
   *
   * IMPORTANT : Toutes les écritures dans x.value se font uniquement
   * dans les worklets Reanimated, jamais pendant le rendu React.
   */
  const x = useSharedValue(0);

  /**
   * Style principal de la carte (translate + rotate + scale + shadow).
   */
  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      x.value,
      [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
      [-MAX_ROTATION, 0, MAX_ROTATION],
    );

    const scale = interpolate(
      x.value,
      [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
      [0.97, 1, 0.97],
    );

    const shadowOpacity = interpolate(
      x.value,
      [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
      [0.28, 0.12, 0.28],
    );

    return {
      transform: [
        { translateX: x.value },
        { rotate: `${rotation}deg` },
        { scale },
      ],
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity,
      shadowRadius: 40,
      elevation: 8,
    };
  });

  /* ─── Ambient backgrounds ─── */

  const leftAmbientStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.value,
      [-SWIPE_THRESHOLD * 1.5, -30, 0],
      [1, 0.35, 0],
    );
    return { opacity };
  });

  const rightAmbientStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.value,
      [0, 30, SWIPE_THRESHOLD * 1.5],
      [0, 0.35, 1],
    );
    return { opacity };
  });

  /* ─── Icon indicators ─── */

  const leftIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.value,
      [-SWIPE_THRESHOLD * 1.5, -30, 0],
      [1, 0.25, 0],
    );
    const scale = interpolate(
      x.value,
      [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD, 0],
      [1.15, 1, 0.8],
    );
    return { opacity, transform: [{ scale }] };
  });

  const rightIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      x.value,
      [0, 30, SWIPE_THRESHOLD * 1.5],
      [0, 0.25, 1],
    );
    const scale = interpolate(
      x.value,
      [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.5],
      [0.8, 1, 1.15],
    );
    return { opacity, transform: [{ scale }] };
  });

  /* ─── Ring progress ─── */

  const leftProgressStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        x.value,
        [-SWIPE_THRESHOLD * 1.8, -SWIPE_THRESHOLD, 0],
        [1, 0.85, 0],
      ),
    };
  });

  const rightProgressStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        x.value,
        [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.8],
        [0, 0.85, 1],
      ),
    };
  });

  /* ─── Labels ─── */

  const leftLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        x.value,
        [-SWIPE_THRESHOLD * 1.5, -30, 0],
        [1, 0.25, 0],
      ),
    };
  });

  const rightLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        x.value,
        [0, 30, SWIPE_THRESHOLD * 1.5],
        [0, 0.25, 1],
      ),
    };
  });

  /* ─── Gesture handler ─── */

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, context) => {
      context.startX = x.value;
    },
    onActive: (event, context) => {
      x.value = context.startX + event.translationX;
    },
    onEnd: () => {
      /* Désactivé → retour immédiat */
      if (disabled) {
        x.value = withSpring(0, { stiffness: 420, damping: 32 });
        return;
      }

      const current = x.value;

      /* ─── SWIPE GAUCHE — IGNORER ─── */
      if (current < -SWIPE_THRESHOLD && onSwipeLeft) {
        x.value = withSpring(
          -EXIT_DISTANCE,
          { stiffness: 300, damping: 30 },
          (finished) => {
            "worklet";
            if (!finished) return;
            x.value = 0;
            runOnJS(onSwipeLeft)();
          },
        );
        return;
      }

      /* ─── SWIPE DROITE — SAUVEGARDER ─── */
      if (current > SWIPE_THRESHOLD && onSwipeRight) {
        x.value = withSpring(
          EXIT_DISTANCE,
          { stiffness: 300, damping: 30 },
          (finished) => {
            "worklet";
            if (!finished) return;
            x.value = 0;
            runOnJS(onSwipeRight)();
          },
        );
        return;
      }

      /* ─── PAS ASSEZ LOIN — CENTRE ─── */
      x.value = withSpring(0, { stiffness: 500, damping: 35 });
    },
  });

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={styles.root}>
      {/* ═══════════ AMBIENT — GAUCHE (IGNORER) ═══════════ */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.ambientWrap, leftAmbientStyle]}
      >
        <LinearGradient
          colors={[
            "rgba(239,68,68,0.28)",
            "rgba(239,68,68,0.08)",
            "rgba(239,68,68,0)",
          ]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.leftOrb} />
      </Animated.View>

      {/* ═══════════ AMBIENT — DROITE (SAUVEGARDER) ═══════════ */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.ambientWrap, rightAmbientStyle]}
      >
        <LinearGradient
          colors={[
            "rgba(250,204,21,0.28)",
            "rgba(250,204,21,0.08)",
            "rgba(250,204,21,0)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.rightOrb} />
      </Animated.View>

      {/* ═══════════ LEFT ACTION — X ═══════════ */}
      <Animated.View
        pointerEvents="none"
        style={[styles.leftIndicator, leftIndicatorStyle]}
      >
        <View style={styles.xIconWrap}>
          <LinearGradient
            colors={["rgba(239,68,68,0.24)", "rgba(239,68,68,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.xIconBorder} pointerEvents="none" />
          <X size={22} color="#FCA5A5" strokeWidth={2.6} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.iconProgressRing,
              styles.xRingBorder,
              leftProgressStyle,
            ]}
          />
        </View>
      </Animated.View>

      {/* ═══════════ RIGHT ACTION — BOOKMARK ═══════════ */}
      <Animated.View
        pointerEvents="none"
        style={[styles.rightIndicator, rightIndicatorStyle]}
      >
        <View style={styles.bookmarkIconWrap}>
          <LinearGradient
            colors={["rgba(250,204,21,0.24)", "rgba(250,204,21,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bookmarkIconBorder} pointerEvents="none" />
          <Bookmark size={21} color="#FDE047" strokeWidth={2.4} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.iconProgressRing,
              styles.bookmarkRingBorder,
              rightProgressStyle,
            ]}
          />
        </View>
      </Animated.View>

      {/* ═══════════ LABEL — IGNORER ═══════════ */}
      <Animated.View
        pointerEvents="none"
        style={[styles.leftLabel, leftLabelStyle]}
      >
        <View style={styles.labelChipRed}>
          <LinearGradient
            colors={["rgba(239,68,68,0.2)", "rgba(239,68,68,0.06)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.labelChipRedBorder} pointerEvents="none" />
          <X size={11} color="#FCA5A5" strokeWidth={2.6} />
          <Text style={styles.labelRedText}>IGNORER</Text>
        </View>
      </Animated.View>

      {/* ═══════════ LABEL — SAUVEGARDER ═══════════ */}
      <Animated.View
        pointerEvents="none"
        style={[styles.rightLabel, rightLabelStyle]}
      >
        <View style={styles.labelChipYellow}>
          <LinearGradient
            colors={["rgba(250,204,21,0.2)", "rgba(250,204,21,0.06)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.labelChipYellowBorder} pointerEvents="none" />
          <Bookmark size={10} color="#FDE047" strokeWidth={2.4} />
          <Text style={styles.labelYellowText}>SAUVEGARDER</Text>
        </View>
      </Animated.View>

      {/* ═══════════ MAIN CARD (gesture) ═══════════ */}
      <PanGestureHandler onGestureEvent={gestureHandler} enabled={!disabled}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Top highlight */}
          <View style={styles.topHighlight} pointerEvents="none">
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.22)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </View>

          {children}

          {/* Micro swipe hint */}
          {!disabled ? (
            <View pointerEvents="none" style={styles.swipeHintWrap}>
              <View style={styles.swipeHintChip}>
                <LinearGradient
                  colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.2)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.swipeHintBorder} pointerEvents="none" />
                <Sparkles
                  size={9}
                  color="rgba(255,255,255,0.6)"
                  strokeWidth={2.4}
                />
                <Text style={styles.swipeHintText}>Glisser pour agir</Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
  },

  /* ── Ambient ────────────────────────────────────── */
  ambientWrap: {
    borderRadius: 24,
    overflow: "hidden",
  },
  leftOrb: {
    position: "absolute",
    top: "50%",
    marginTop: -64,
    right: 24,
    width: 128,
    height: 128,
    borderRadius: 9999,
    backgroundColor: "rgba(239,68,68,0.22)",
  },
  rightOrb: {
    position: "absolute",
    top: "50%",
    marginTop: -64,
    left: 24,
    width: 128,
    height: 128,
    borderRadius: 9999,
    backgroundColor: "rgba(250,204,21,0.22)",
  },

  /* ── Left indicator (X) ────────────────────────── */
  leftIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  xIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  xIconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.4)",
  },
  iconProgressRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2,
  },
  xRingBorder: {
    borderColor: "rgba(248,113,113,0.55)",
  },

  /* ── Right indicator (Bookmark) ────────────────── */
  rightIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  bookmarkIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#FACC15",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  bookmarkIconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
  },
  bookmarkRingBorder: {
    borderColor: "rgba(253,224,71,0.55)",
  },

  /* ── Labels ─────────────────────────────────────── */
  leftLabel: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 2,
  },
  rightLabel: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 2,
  },
  labelChipRed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  labelChipRedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
  },
  labelRedText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#FCA5A5",
    textTransform: "uppercase",
  },
  labelChipYellow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  labelChipYellowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(253,224,71,0.3)",
  },
  labelYellowText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#FDE047",
    textTransform: "uppercase",
  },

  /* ── Main card ──────────────────────────────────── */
  card: {
    position: "relative",
    zIndex: 10,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 20,
  },

  /* ── Swipe hint ─────────────────────────────────── */
  swipeHintWrap: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  swipeHintChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  swipeHintBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  swipeHintText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.3,
  },
});
