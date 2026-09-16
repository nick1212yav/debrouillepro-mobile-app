// src/features/profile/components/CompletionBar.tsx

import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
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

type Step = {
  id: string;
  label: string;
  emoji: string;
  done: boolean;
};

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

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
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

  const steps: Step[] = [
    { id: "photo", label: "Photo de profil", emoji: "📸", done: true },
    { id: "name", label: "Nom renseigné", emoji: "✍️", done: hasName },
    { id: "bio", label: "Bio remplie", emoji: "📝", done: hasBio },
    { id: "skills", label: "3 compétences", emoji: "⚡", done: false },
    { id: "verified", label: "Identité vérifiée", emoji: "🛡️", done: true },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const remaining = steps.length - doneCount;
  const pct = Math.round((doneCount / steps.length) * 100);

  /* Entrée + remplissage de la barre */
  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 400,
      delay: 120,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 1000,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [enterAnim, progressAnim, pct]);

  /* Expansion / repli */
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [expandAnim, expanded]);

  /* Interpolations */
  const arrowRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* HEADER — pressable */}
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={`Profil complété à ${pct} pour cent`}
        style={({ pressed }) => [
          styles.header,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.headerTitle}>Profil complété</Text>

        <View style={styles.headerRight}>
          <Text style={[styles.pctText, { color: accentHex }]}>{pct}%</Text>

          <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
            <ChevronRight size={14} color={T.ghost} />
          </Animated.View>
        </View>
      </Pressable>

      {/* PROGRESS BAR */}
      <View style={styles.track}>
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

      {/* SUBTITLE — reste discret si profil incomplet */}
      {pct < 100 ? (
        <Text style={styles.subtitle}>
          {remaining} étape{remaining > 1 ? "s" : ""} restante
          {remaining > 1 ? "s" : ""} pour un profil parfait
        </Text>
      ) : null}

      {/* DETAILS — révélés au tap */}
      <Animated.View
        style={{
          maxHeight: expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 320],
          }),
          opacity: expandAnim,
          overflow: "hidden",
        }}
      >
        <View style={styles.detailsList}>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
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
                  <Check size={11} color={accentHex} strokeWidth={3} />
                ) : (
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                )}
              </View>

              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: step.done ? T.dim : T.faint,
                    textDecorationLine: step.done ? "line-through" : "none",
                  },
                ]}
              >
                {step.label}
              </Text>

              {!step.done ? (
                <Pressable
                  onPress={() =>
                    toast.info("Modifiable via « Modifier le profil »")
                  }
                  style={({ pressed }) => [
                    styles.completeBtn,
                    {
                      backgroundColor: alpha(accentHex, 0.14),
                      borderColor: alpha(accentHex, 0.3),
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.completeBtnText, { color: accentHex }]}>
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
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
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

  /* Progress */
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: T.track,
    overflow: "hidden",
    marginBottom: 10,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },

  subtitle: {
    color: T.faint,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
  },

  /* Details */
  detailsList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  completeBtnText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
