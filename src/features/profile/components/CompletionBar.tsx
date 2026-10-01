// src/features/profile/components/CompletionBar.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check, ChevronRight } from "lucide-react-native";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface CompletionBarProps {
  accentHex: string;
  hasName: boolean;
  hasBio: boolean;
}

interface Step {
  id: string;
  label: string;
  emoji: string;
  done: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  card: "rgba(255,255,255,0.04)",
  cardUp: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.10)",
  track: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.70)",
  faint: "rgba(255,255,255,0.40)",
  ghost: "rgba(255,255,255,0.35)",
} as const;

const ANIMATION_DURATION = 260;
const PROGRESS_DURATION = 850;
const ENTER_DURATION = 400;
const ENTER_DELAY = 120;
const PROGRESS_DELAY = 220;

const MAX_EXPANDED_HEIGHT = 320;

function alpha(hex: string, opacity: number): string {
  const normalized = hex.trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(99,102,241,${opacity})`;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */

export function CompletionBar({
  accentHex,
  hasName,
  hasBio,
}: CompletionBarProps) {
  const [expanded, setExpanded] = useState(false);

  const enterAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  /*
   * IMPORTANT:
   * Only values actually supplied by the component contract are considered
   * completed. We do not invent verification or skills data here.
   */
  const steps = useMemo<Step[]>(
    () => [
      {
        id: "photo",
        label: "Photo de profil",
        emoji: "📸",
        done: false,
      },
      {
        id: "name",
        label: "Nom renseigné",
        emoji: "✍️",
        done: hasName,
      },
      {
        id: "bio",
        label: "Bio remplie",
        emoji: "📝",
        done: hasBio,
      },
      {
        id: "skills",
        label: "3 compétences",
        emoji: "⚡",
        done: false,
      },
      {
        id: "verified",
        label: "Identité vérifiée",
        emoji: "🛡️",
        done: false,
      },
    ],
    [hasBio, hasName],
  );

  const doneCount = steps.reduce(
    (count, step) => count + (step.done ? 1 : 0),
    0,
  );

  const remaining = steps.length - doneCount;

  const pct =
    steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  /* ════════════════════════════════════════════════════════════════════════
     ENTRANCE ANIMATION
     ════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    enterAnim.setValue(0);

    const animation = Animated.timing(enterAnim, {
      toValue: 1,
      duration: ENTER_DURATION,
      delay: ENTER_DELAY,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [enterAnim]);

  /* ════════════════════════════════════════════════════════════════════════
     PROGRESS ANIMATION
     ════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    progressAnim.stopAnimation();

    const animation = Animated.timing(progressAnim, {
      toValue: pct,
      duration: PROGRESS_DURATION,
      delay: PROGRESS_DELAY,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pct, progressAnim]);

  /* ════════════════════════════════════════════════════════════════════════
     EXPANSION
     ════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    expandAnim.stopAnimation();

    const animation = Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [expandAnim, expanded]);

  const arrowRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const translateY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_EXPANDED_HEIGHT],
  });

  const handleToggle = () => {
    setExpanded((current) => !current);
  };

  const handleIncompleteStep = (step: Step) => {
    toast.info(`Complétez « ${step.label} » depuis Modifier le profil.`);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enterAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}

      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Profil complété à ${pct} pour cent`}
        style={({ pressed }) => [
          styles.header,
          {
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Profil complété</Text>

        <View style={styles.headerRight}>
          <Text
            style={[
              styles.pctText,
              {
                color: accentHex,
              },
            ]}
          >
            {pct}%
          </Text>

          <Animated.View
            style={{
              transform: [{ rotate: arrowRotate }],
            }}
          >
            <ChevronRight size={15} color={T.ghost} strokeWidth={2.2} />
          </Animated.View>
        </View>
      </Pressable>

      {/* ═══════════════════════════════════════════════════════════════════
          PROGRESS BAR
          ═══════════════════════════════════════════════════════════════════ */}

      <View
        accessible
        accessibilityLabel={`Progression du profil : ${pct} pour cent`}
        style={styles.track}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressWidth,
              backgroundColor: accentHex,
            },
          ]}
        />
      </View>

      {/* ═══════════════════════════════════════════════════════════════════
          SUBTITLE
          ═══════════════════════════════════════════════════════════════════ */}

      {pct < 100 ? (
        <Text style={styles.subtitle}>
          {remaining} étape{remaining > 1 ? "s" : ""} restante
          {remaining > 1 ? "s" : ""} pour compléter votre profil
        </Text>
      ) : (
        <Text
          style={[
            styles.subtitle,
            {
              color: accentHex,
            },
          ]}
        >
          Votre profil est complet
        </Text>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DETAILS
          ═══════════════════════════════════════════════════════════════════ */}

      <Animated.View
        style={{
          maxHeight: expandedHeight,
          opacity: expandAnim,
          overflow: "hidden",
        }}
      >
        <View style={styles.detailsList}>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              {/* Step icon */}
              <View
                style={[
                  styles.stepIcon,
                  {
                    backgroundColor: step.done
                      ? alpha(accentHex, 0.15)
                      : T.cardUp,
                    borderColor: step.done
                      ? alpha(accentHex, 0.28)
                      : T.borderUp,
                  },
                ]}
              >
                {step.done ? (
                  <Check size={12} color={accentHex} strokeWidth={3} />
                ) : (
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: step.done ? T.dim : T.faint,
                    textDecorationLine: step.done ? "line-through" : "none",
                  },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>

              {/* Action */}
              {!step.done ? (
                <Pressable
                  onPress={() => handleIncompleteStep(step)}
                  accessibilityRole="button"
                  accessibilityLabel={`Compléter ${step.label}`}
                  style={({ pressed }) => [
                    styles.completeBtn,
                    {
                      backgroundColor: alpha(accentHex, 0.14),
                      borderColor: alpha(accentHex, 0.3),
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.completeBtnText,
                      {
                        color: accentHex,
                      },
                    ]}
                  >
                    Compléter
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 24,
  },

  headerTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  pctText: {
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  track: {
    height: 8,
    marginBottom: 10,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: T.track,
  },

  fill: {
    height: "100%",
    minWidth: 0,
    borderRadius: 999,
  },

  subtitle: {
    color: T.faint,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
  },

  detailsList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },

  stepRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  stepIcon: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
  },

  stepEmoji: {
    fontSize: 11,
  },

  stepLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  completeBtn: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
  },

  completeBtnText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
