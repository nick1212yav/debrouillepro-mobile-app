// src/pages/home/_components/StreakWidget.tsx
import {
  View,
  Pressable,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Modal,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Flame,
  Trophy,
  Zap,
  X,
  Star,
  ShieldCheck,
  Sparkles,
  Clock3,
  ChevronRight,
} from "lucide-react-native";
import { toast } from "sonner";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { api } from "@/convex/_generated/api.js";
import Confetti, { useConfetti } from "@/components/Confetti.tsx";
import { useHaptic } from "@/hooks/use-haptic.ts";

/* ============================================================================
 * CONSTANTS + HELPERS
 * ========================================================================== */

const MILESTONES = [7, 14, 30, 60, 100, 365] as const;

function getMilestoneEmoji(days: number): string {
  if (days >= 365) return "🏆";
  if (days >= 100) return "💎";
  if (days >= 60) return "🔥";
  if (days >= 30) return "⚡";
  if (days >= 14) return "🌟";
  if (days >= 7) return "🎯";
  return "🔥";
}

function getMilestoneLabel(days: number): string {
  if (days >= 365) return "Légende";
  if (days >= 100) return "Diamant";
  if (days >= 60) return "Flamme";
  if (days >= 30) return "Élite";
  if (days >= 14) return "Régulier";
  if (days >= 7) return "Première série";
  return "Départ";
}

function getPreviousMilestone(currentStreak: number): number {
  return (
    [...MILESTONES].reverse().find((milestone) => milestone <= currentStreak) ??
    0
  );
}

function getNextMilestone(currentStreak: number): number {
  return (
    MILESTONES.find((milestone) => milestone > currentStreak) ??
    currentStreak + 1
  );
}

function getMilestoneProgress(currentStreak: number): number {
  const previous = getPreviousMilestone(currentStreak);
  const next = getNextMilestone(currentStreak);
  const range = next - previous;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, ((currentStreak - previous) / range) * 100));
}

function getWeekProgress(currentStreak: number): number {
  const remainder = currentStreak % 7;
  return remainder === 0 ? 7 : remainder;
}

interface ClaimResult {
  xpEarned: number;
  newStreak: number;
  isNewRecord: boolean;
}

/* ============================================================================
 * ANIMATION HELPERS
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 10,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: ViewStyle;
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
 * ANIMATED MILESTONE EMOJI (pulse / danger)
 * ========================================================================== */

function MilestoneEmojiIcon({
  emoji,
  danger,
}: {
  emoji: string;
  danger: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: danger ? 550 : 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: danger ? 550 : 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [danger, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: danger ? [1, 1.08] : [1, 1.03],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Text style={styles.milestoneEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

/* ============================================================================
 * SHINE STRIP (animated gradient sweep)
 * ========================================================================== */

function ShineSweep({
  color = "rgba(255,255,255,0.28)",
  duration = 1800,
  delay = 0,
}: {
  color?: string;
  duration?: number;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration, delay]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 480],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shineStrip,
        {
          backgroundColor: color,
          transform: [{ translateX }, { skewX: "-20deg" }],
        },
      ]}
    />
  );
}

/* ============================================================================
 * ANIMATED PROGRESS BAR
 * ========================================================================== */

function AnimatedProgressBar({
  value,
  danger,
}: {
  value: number;
  danger: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 800,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFillWrap, { width }]}>
        <LinearGradient
          colors={
            danger
              ? ["#EF4444", "#F87171", "#FB7185"]
              : ["#FB923C", "#F97316", "#FB7185"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.progressFillGradient}
        >
          <ShineSweep duration={1800} color="rgba(255,255,255,0.35)" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * WEEK DOTS (mini progress row)
 * ========================================================================== */

function WeekDots({
  completedCount,
  size = 28,
  starSize = 10,
}: {
  completedCount: number;
  size?: number;
  starSize?: number;
}) {
  return (
    <View style={styles.weekDotsRow}>
      {Array.from({ length: 7 }, (_, index) => {
        const completed = index < completedCount;
        return (
          <View
            key={index}
            style={[
              styles.weekDot,
              {
                height: size,
                borderRadius: size / 4,
              },
              completed && styles.weekDotCompleted,
            ]}
          >
            {completed ? (
              <Star size={starSize} color="#fff" fill="#fff" />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/* ============================================================================
 * CLAIM BUTTON
 * ========================================================================== */

function ClaimButton({
  claiming,
  onPress,
}: {
  claiming: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!claiming) return;
    rotate.setValue(0);
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [claiming, rotate]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
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

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={claiming}
        accessibilityLabel="Valider ma série et gagner de l'XP"
        style={[styles.claimOuter, claiming && { opacity: 0.6 }]}
      >
        <LinearGradient
          colors={["#FB923C", "#F97316", "#EA580C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.claimGradient}
        >
          <ShineSweep duration={2000} color="rgba(255,255,255,0.35)" />
          {claiming ? (
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Flame size={15} color="#fff" fill="#fff" />
            </Animated.View>
          ) : (
            <Flame size={15} color="#fff" fill="#fff" />
          )}
          <Text style={styles.claimText}>
            {claiming ? "Validation…" : "+ XP"}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * CELEBRATION MODAL
 * ========================================================================== */

function CelebrationModal({
  visible,
  result,
  onClose,
}: {
  visible: boolean;
  result: ClaimResult | null;
  onClose: () => void;
}) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropAnim.setValue(0);
      panelAnim.setValue(0);
      iconAnim.setValue(0);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(panelAnim, {
          toValue: 1,
          stiffness: 360,
          damping: 28,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.spring(iconAnim, {
        toValue: 1,
        delay: 100,
        stiffness: 400,
        damping: 18,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(panelAnim, {
          toValue: 0,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted || !result) return null;

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.06, 0],
  });
  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });

  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const iconRotate = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-20deg", "0deg"],
  });

  const isMilestone = MILESTONES.includes(
    result.newStreak as (typeof MILESTONES)[number],
  );

  const subtitle = result.isNewRecord
    ? `Tu bats ton record avec ${result.newStreak} jours consécutifs.`
    : isMilestone
      ? `Tu viens d'atteindre le palier des ${result.newStreak} jours.`
      : "Ta série continue. Garde le rythme !";

  const title = result.isNewRecord
    ? "Nouveau record ! 🎉"
    : `Jour ${result.newStreak} ! 🔥`;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <Animated.View
          style={[styles.modalBackdrop, { opacity: backdropAnim }]}
        >
          <Pressable
            onPress={onClose}
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Fermer"
          />
        </Animated.View>

        {/* Panel */}
        <Animated.View
          style={[
            styles.modalPanel,
            {
              transform: [
                { translateY: panelTranslateY },
                { scale: panelScale },
              ],
            },
          ]}
          accessibilityLabel="Célébration de série"
        >
          <LinearGradient
            colors={["#1A0F08", "#0F0511", "#050512"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalBorder} pointerEvents="none" />

          {/* Top glow */}
          <View style={styles.modalTopGlow} pointerEvents="none">
            <LinearGradient
              colors={["rgba(249,115,22,0.35)", "rgba(249,115,22,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1, borderRadius: 999 }}
            />
          </View>

          {/* Close button */}
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="Fermer la célébration"
            style={({ pressed }) => [
              styles.modalCloseBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            <X size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <View style={styles.modalContent}>
            {/* Emoji icon */}
            <Animated.View
              style={{
                transform: [{ scale: iconScale }, { rotate: iconRotate }],
              }}
            >
              <LinearGradient
                colors={["rgba(249,115,22,0.24)", "rgba(251,146,60,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalIconWrap}
              >
                <Text style={styles.modalIconEmoji}>
                  {getMilestoneEmoji(result.newStreak)}
                </Text>
              </LinearGradient>
            </Animated.View>

            <FadeUp delay={120}>
              <Text style={styles.modalEyebrow}>SÉRIE QUOTIDIENNE</Text>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            </FadeUp>

            {/* XP pill */}
            <FadeUp delay={220}>
              <View style={styles.xpPill}>
                <LinearGradient
                  colors={["rgba(251,191,36,0.28)", "rgba(251,191,36,0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.xpPillBorder} pointerEvents="none" />
                <Zap size={18} color="#FCD34D" fill="#FCD34D" />
                <Text style={styles.xpPillText}>+{result.xpEarned} XP</Text>
              </View>
            </FadeUp>

            {/* Week dots */}
            <FadeUp delay={320}>
              <View style={styles.modalWeekDots}>
                <WeekDots
                  completedCount={getWeekProgress(result.newStreak)}
                  size={30}
                  starSize={11}
                />
              </View>
            </FadeUp>

            {/* Continue button */}
            <FadeUp delay={420}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.continueOuter,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <LinearGradient
                  colors={["#FB923C", "#F97316", "#EA580C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueText}>Continuer</Text>
                  <ChevronRight size={16} color="#fff" strokeWidth={2.6} />
                </LinearGradient>
              </Pressable>
            </FadeUp>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * LOADING SKELETON
 * ========================================================================== */

function StreakSkeleton() {
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
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonTopRow}>
          <Animated.View style={[styles.skeletonEmoji, { opacity }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <Animated.View style={[styles.skeletonLine1, { opacity }]} />
            <Animated.View style={[styles.skeletonLine2, { opacity }]} />
          </View>
          <Animated.View style={[styles.skeletonRight, { opacity }]} />
        </View>

        <Animated.View style={[styles.skeletonProgress, { opacity }]} />

        <View style={styles.skeletonDotsRow}>
          {Array.from({ length: 7 }, (_, i) => (
            <Animated.View key={i} style={[styles.skeletonDot, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function StreakWidget() {
  const { isAuthenticated } = useFirebaseAuth();

  const streak = useQuery(
    api.streaks.getMyStreak,
    isAuthenticated ? {} : "skip",
  );

  const claimStreak = useMutation(api.streaks.claimDailyStreak);

  const [showModal, setShowModal] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const { fire, confetti: confettiEl } = useConfetti();
  const { trigger } = useHaptic();

  /*
   * IMPORTANT — TOUS LES HOOKS DOIVENT ÊTRE EXÉCUTÉS À CHAQUE RENDU.
   */
  const weekProgressForHook = getWeekProgress(streak?.currentStreak ?? 0);

  const weekDots = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => ({
        id: index,
        completed: index < weekProgressForHook,
      })),
    [weekProgressForHook],
  );

  /* ───── auth / loading ───── */
  if (!isAuthenticated) return null;
  if (streak === undefined) return <StreakSkeleton />;
  if (!streak) return null;

  const { currentStreak, longestStreak, canClaim, isStreakInDanger } = streak;

  const nextMilestone = getNextMilestone(currentStreak);
  const previousMilestone = getPreviousMilestone(currentStreak);
  const progressToNext = getMilestoneProgress(currentStreak);
  const weekProgress = getWeekProgress(currentStreak);

  const milestoneEmoji = getMilestoneEmoji(currentStreak);
  const milestoneLabel = getMilestoneLabel(currentStreak);

  const daysRemaining = Math.max(0, nextMilestone - currentStreak);

  const isMilestone = MILESTONES.includes(
    currentStreak as (typeof MILESTONES)[number],
  );

  /* ───── claim ───── */
  const handleClaim = async () => {
    if (!canClaim || isClaiming) return;

    setIsClaiming(true);

    try {
      const result = await claimStreak();

      setClaimResult(result);
      setShowModal(true);

      const celebration =
        result.isNewRecord ||
        MILESTONES.includes(result.newStreak as (typeof MILESTONES)[number]);

      trigger(celebration ? "success" : "medium");

      if (celebration) fire();
    } catch {
      trigger("error");
      toast.error("Impossible de valider ta série pour le moment.");
    } finally {
      setIsClaiming(false);
    }
  };

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <>
      {confettiEl}

      {/* ═══════════ STREAK CARD ═══════════ */}
      <FadeUp distance={10} style={styles.root}>
        <View
          style={styles.cardOuter}
          accessibilityLabel="Votre série quotidienne"
        >
          <LinearGradient
            colors={
              isStreakInDanger
                ? ["#3A0A0A", "#1A0510", "#0A0308"]
                : ["#2B1206", "#1A0A10", "#0A0510"]
            }
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Border ring */}
          <View
            style={[
              styles.cardBorder,
              {
                borderColor: isStreakInDanger
                  ? "rgba(248,113,113,0.4)"
                  : "rgba(251,146,60,0.32)",
              },
            ]}
            pointerEvents="none"
          />

          {/* Corner orb */}
          <View
            style={[
              styles.cardOrb,
              {
                backgroundColor: isStreakInDanger
                  ? "rgba(239,68,68,0.3)"
                  : "rgba(251,146,60,0.24)",
              },
            ]}
            pointerEvents="none"
          />

          <View style={styles.cardContent}>
            {/* ───── TOP ROW ───── */}
            <View style={styles.topRow}>
              {/* Emoji icon */}
              <View
                style={[
                  styles.emojiWrap,
                  {
                    backgroundColor: isStreakInDanger
                      ? "rgba(239,68,68,0.16)"
                      : "rgba(251,146,60,0.16)",
                    borderColor: isStreakInDanger
                      ? "rgba(248,113,113,0.35)"
                      : "rgba(251,146,60,0.35)",
                  },
                ]}
              >
                <MilestoneEmojiIcon
                  emoji={milestoneEmoji}
                  danger={isStreakInDanger}
                />
                <View style={styles.emojiSparkle}>
                  <Sparkles size={9} color="#FCD34D" strokeWidth={2.6} />
                </View>
              </View>

              {/* Streak count */}
              <View style={styles.countCol}>
                <View style={styles.countRow}>
                  <Text style={styles.countNumber}>{currentStreak}</Text>
                  <Text style={styles.countSuffix}>
                    jour{currentStreak > 1 ? "s" : ""}
                  </Text>
                  {isMilestone ? (
                    <View style={styles.milestoneBadge}>
                      <Text style={styles.milestoneBadgeText}>
                        {milestoneLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.labelRow}>
                  <Flame
                    size={12}
                    color={isStreakInDanger ? "#F87171" : "#FB923C"}
                    fill={isStreakInDanger ? "#F87171" : "#FB923C"}
                    strokeWidth={0}
                  />
                  <Text style={styles.labelText}>Série quotidienne</Text>
                </View>
              </View>

              {/* Record pill */}
              <View style={styles.recordPill}>
                <LinearGradient
                  colors={["rgba(251,191,36,0.16)", "rgba(255,255,255,0.04)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Trophy size={14} color="#FCD34D" strokeWidth={2.4} />
                <View>
                  <Text style={styles.recordLabel}>RECORD</Text>
                  <Text style={styles.recordValue}>{longestStreak}j</Text>
                </View>
              </View>
            </View>

            {/* ───── DANGER BANNER ───── */}
            {isStreakInDanger ? (
              <FadeUp distance={6}>
                <View style={styles.dangerBanner}>
                  <LinearGradient
                    colors={["rgba(239,68,68,0.18)", "rgba(239,68,68,0.06)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.dangerBorder} pointerEvents="none" />
                  <Clock3 size={14} color="#FCA5A5" strokeWidth={2.4} />
                  <Text style={styles.dangerText}>
                    Ta série est en danger. Valide ton activité aujourd'hui pour
                    la préserver.
                  </Text>
                </View>
              </FadeUp>
            ) : null}

            {/* ───── PROGRESS TO NEXT MILESTONE ───── */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <View style={styles.progressHeaderLeft}>
                  <Trophy
                    size={11}
                    color="rgba(252,211,77,0.8)"
                    strokeWidth={2.4}
                  />
                  <Text style={styles.progressLabel}>Prochain palier</Text>
                </View>
                <Text style={styles.progressValue}>{nextMilestone} jours</Text>
              </View>

              <AnimatedProgressBar
                value={progressToNext}
                danger={isStreakInDanger}
              />

              <View style={styles.progressFooter}>
                <Text style={styles.progressFooterLeft}>
                  {previousMilestone > 0
                    ? `${currentStreak - previousMilestone} jour${
                        currentStreak - previousMilestone > 1 ? "s" : ""
                      } depuis le dernier palier`
                    : "Commence ta série"}
                </Text>
                <Text style={styles.progressFooterRight}>
                  {daysRemaining > 0
                    ? `${daysRemaining} restant${daysRemaining > 1 ? "s" : ""}`
                    : "Palier atteint"}
                </Text>
              </View>
            </View>

            {/* ───── WEEK DOTS + CTA ───── */}
            <View style={styles.bottomRow}>
              <View style={styles.weekDotsWrap}>
                {weekDots.map((day) => (
                  <View
                    key={day.id}
                    style={[
                      styles.weekDotSmall,
                      day.completed && styles.weekDotSmallCompleted,
                    ]}
                  >
                    {day.completed ? (
                      <Star
                        size={10}
                        color="#fff"
                        fill="#fff"
                        strokeWidth={0}
                      />
                    ) : null}
                  </View>
                ))}
              </View>

              {canClaim ? (
                <ClaimButton claiming={isClaiming} onPress={handleClaim} />
              ) : (
                <View style={styles.validatedPill}>
                  <ShieldCheck
                    size={15}
                    color="rgba(110,231,183,0.85)"
                    strokeWidth={2.4}
                  />
                  <Text style={styles.validatedText}>Validé</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </FadeUp>

      {/* ═══════════ CELEBRATION MODAL ═══════════ */}
      <CelebrationModal
        visible={showModal}
        result={claimResult}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    marginBottom: 16,
  },

  /* ── Main card ──────────────────────────────────── */
  cardOuter: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0A0510",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
  },
  cardOrb: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 9999,
  },
  cardContent: {
    padding: 16,
  },

  /* ── Top row ────────────────────────────────────── */
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  emojiSparkle: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  countCol: {
    flex: 1,
    minWidth: 0,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  countSuffix: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },
  milestoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(252,211,77,0.12)",
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.3)",
  },
  milestoneBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#FCD34D",
    textTransform: "uppercase",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  recordPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.24)",
  },
  recordLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  recordValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
    marginTop: 1,
  },

  /* ── Danger banner ──────────────────────────────── */
  dangerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  dangerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.28)",
  },
  dangerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    color: "rgba(252,165,165,0.9)",
  },

  /* ── Progress section ──────────────────────────── */
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },
  progressValue: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "rgba(252,211,77,0.85)",
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  progressFillWrap: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFillGradient: {
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  shineStrip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    opacity: 0.7,
  },
  progressFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressFooterLeft: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
  },
  progressFooterRight: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.45)",
  },

  /* ── Bottom row ─────────────────────────────────── */
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  weekDotsWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weekDotSmall: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  weekDotSmallCompleted: {
    backgroundColor: "#FB923C",
    borderColor: "#FB923C",
    shadowColor: "#FB923C",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  /* ── Claim button ───────────────────────────────── */
  claimOuter: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#F97316",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  claimGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  claimText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  /* ── Validated pill ─────────────────────────────── */
  validatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(52,211,153,0.08)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
  },
  validatedText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.2,
  },

  /* ── Modal ──────────────────────────────────────── */
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,4,12,0.78)",
  },
  modalPanel: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#0A0510",
    shadowColor: "#000",
    shadowOpacity: 0.75,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 28,
  },
  modalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.24)",
  },
  modalTopGlow: {
    position: "absolute",
    top: -80,
    left: "25%",
    right: "25%",
    height: 160,
    opacity: 0.9,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 10,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.35)",
    shadowColor: "#F97316",
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    marginBottom: 16,
  },
  modalIconEmoji: {
    fontSize: 48,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.4,
    color: "rgba(251,191,36,0.75)",
    textAlign: "center",
  },
  modalTitle: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
    overflow: "hidden",
  },
  xpPillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.32)",
  },
  xpPillText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FCD34D",
    letterSpacing: -0.4,
  },
  modalWeekDots: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  weekDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  weekDot: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(255,255,255,0.02)",
    minWidth: 28,
  },
  weekDotCompleted: {
    backgroundColor: "#FB923C",
    borderColor: "#FB923C",
    shadowColor: "#FB923C",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  continueOuter: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#F97316",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  continueGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  continueText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },

  /* ── Skeleton ───────────────────────────────────── */
  skeletonWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  skeletonCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.025)",
    padding: 16,
  },
  skeletonTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skeletonEmoji: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonLine1: {
    height: 20,
    width: 128,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonLine2: {
    height: 12,
    width: 96,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonRight: {
    width: 64,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonProgress: {
    height: 8,
    width: "100%",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 16,
  },
  skeletonDotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
  },
  skeletonDot: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});
