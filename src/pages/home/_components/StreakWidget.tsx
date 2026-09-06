import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text } from "react-native";
import { useMemo, useState } from "react";
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
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { api } from "@/convex/_generated/api.js";
import Confetti, { useConfetti } from "@/components/Confetti";
import { useHaptic } from "@/hooks/use-haptic";

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
   *
   * Streak peut être undefined pendant le chargement. On calcule donc
   * les valeurs nécessaires aux hooks avec des valeurs de secours.
   * Le return de chargement arrive seulement APRÈS useMemo.
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

  /*
   * ─────────────────────────────────────────────────────────────
   * AUTH / LOADING
   * ─────────────────────────────────────────────────────────────
   */

  if (!isAuthenticated) {
    return null;
  }

  if (streak === undefined) {
    return <StreakSkeleton />;
  }

  if (!streak) {
    return null;
  }

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

  /*
   * ─────────────────────────────────────────────────────────────
   * CLAIM
   * ─────────────────────────────────────────────────────────────
   */

  const handleClaim = async () => {
    if (!canClaim || isClaiming) {
      return;
    }

    setIsClaiming(true);

    try {
      const result = await claimStreak();

      setClaimResult(result);
      setShowModal(true);

      const celebration =
        result.isNewRecord ||
        MILESTONES.includes(result.newStreak as (typeof MILESTONES)[number]);

      trigger(celebration ? "success" : "medium");

      if (celebration) {
        fire();
      }
    } catch {
      trigger("error");

      UIService.openToast("Impossible de valider ta série pour le moment.", "error");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      {confettiEl}

      {/* ========================================================
          STREAK CARD
          ======================================================== */}

      <View
        className="mx-4 mb-4"
        accessibilityLabel="Votre série quotidienne"
      >
        <View
          className="relative overflow-hidden rounded-[28px]"
          style={{ borderColor: "rgba(248,113,113,0.28)", borderStyle: "solid" }}
        >
          {/* Ambient glow */}
          <View
            className="absolute -right-16 -top-16 h-40 w-40 rounded-full"
            style={{  }}
          />

          <View className="relative p-4">
            {/* ==================================================
                HEADER
                ================================================== */}

            <View className="flex items-center gap-3">
              <View
                className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px]"
                style={{ backgroundColor: isStreakInDanger
                                    ? "rgba(239,68,68,0.16)"
                                    : "rgba(249,115,22,0.14)", borderColor: "rgba(248,113,113,0.22)", borderStyle: "solid" }}
              >
                <Text className="text-[28px]">
                  {milestoneEmoji}
                </Text>

                <View className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/30">
                  <Sparkles size={9} className="text-amber-300" />
                </View>
              </View>

              <View className="min-w-0 flex-1">
                <View className="flex items-center gap-2">
                  <Text className="text-2xl font-black leading-none tracking-tight text-white">
                    {currentStreak}
                  </Text>

                  <Text className="text-xs font-semibold text-white/55">
                    jour{currentStreak > 1 ? "s" : ""}
                  </Text>

                  {isMilestone && (
                    <Text className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-300">
                      {milestoneLabel}
                    </Text>
                  )}
                </View>

                <View className="mt-1 flex items-center gap-1.5">
                  <Flame
                    size={12}
                    className={
                      isStreakInDanger ? "text-red-400" : "text-orange-400"
                    }
                    fill="currentColor"
                  />

                  <Text className="text-[11px] font-medium text-white/45">
                    Série quotidienne
                  </Text>
                </View>
              </View>

              {/* Record */}
              <View className="hidden shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 sm:flex">
                <Trophy size={14} className="text-amber-300" />

                <View>
                  <Text className="text-[9px] font-medium uppercase tracking-wide text-white/35">
                    Record
                  </Text>

                  <Text className="text-xs font-black text-white/80">
                    {longestStreak}j
                  </Text>
                </View>
              </View>
            </View>

            {/* ==================================================
                DANGER STATE
                ================================================== */}

            {isStreakInDanger && (
              <View
                className="mt-3 overflow-hidden"
              >
                <View className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2.5">
                  <Clock3 size={14} className="shrink-0 text-red-300" />

                  <Text className="text-[11px] font-semibold leading-relaxed text-red-200/80">
                    Ta série est en danger. Valide ton activité aujourd'hui pour
                    la préserver.
                  </Text>
                </View>
              </View>
            )}

            {/* ==================================================
                PROGRESS
                ================================================== */}

            <View className="mt-4">
              <View className="mb-2 flex items-center justify-between">
                <View className="flex items-center gap-1.5">
                  <Trophy size={11} className="text-amber-300/80" />

                  <Text className="text-[10px] font-semibold text-white/45">
                    Prochain palier
                  </Text>
                </View>

                <Text className="text-[10px] font-bold text-amber-300/80">
                  {nextMilestone} jours
                </Text>
              </View>

              <View className="relative h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <View
                  className="relative h-full overflow-hidden rounded-full"
                  style={{  }}
                >
                  <View
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </View>
              </View>

              <View className="mt-2 flex items-center justify-between">
                <Text className="text-[9px] text-white/30">
                  {previousMilestone > 0
                    ? `${currentStreak - previousMilestone} jour${
                        currentStreak - previousMilestone > 1 ? "s" : ""
                      } depuis le dernier palier`
                    : "Commence ta série"}
                </Text>

                <Text className="text-[9px] font-semibold text-white/40">
                  {daysRemaining > 0
                    ? `${daysRemaining} restant${daysRemaining > 1 ? "s" : ""}`
                    : "Palier atteint"}
                </Text>
              </View>
            </View>

            {/* ==================================================
                BOTTOM ACTION AREA
                ================================================== */}

            <View className="mt-4 flex items-center gap-3">
              {/* Weekly progress */}
              <View className="flex min-w-0 flex-1 items-center gap-1.5">
                {weekDots.map((day) => (
                  <View
                    key={day.id}
                    className="relative h-7 flex-1 rounded-xl"
                    style={{ borderColor: "rgba(251,191,36,0.25)", borderStyle: "solid" }}
                  >
                    {day.completed && (
                      <View className="absolute inset-0 flex items-center justify-center">
                        <Star
                          size={10}
                          className="text-white"
                          fill="currentColor"
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Claim */}
              {canClaim ? (
                <Pressable
                  disabled={isClaiming}
                  onPress={handleClaim}
                  accessibilityLabel="Valider ma série et gagner de l'XP"
                  className="relative flex shrink-0 items-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  style={{  }}
                >
                  <View
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />

                  {isClaiming ? (
                    <View
                      className="relative"
                    >
                      <Flame size={15} fill="currentColor" />
                    </View>
                  ) : (
                    <Flame size={15} fill="currentColor" className="relative" />
                  )}

                  <Text className="relative text-xs">
                    {isClaiming ? "Validation..." : "+ XP"}
                  </Text>
                </Pressable>
              ) : (
                <View className="flex shrink-0 items-center gap-2 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-2.5">
                  <ShieldCheck size={15} className="text-emerald-400/70" />

                  <Text className="text-[10px] font-bold text-white/45">
                    Validé
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* ========================================================
          CELEBRATION MODAL
          ======================================================== */}

      <>
        {showModal && claimResult && (
          <>
            <Pressable
              accessibilityLabel="Fermer"
              onPress={() => setShowModal(false)}
              className="fixed inset-0 z-[80]"
              style={{ backgroundColor: "rgba(2,4,12,0.78)" }}
            />

            <View
              accessibilityRole="dialog"
              aria-modal="true"
              accessibilityLabelledBy="streak-success-title"
              className="fixed inset-x-5 bottom-6 z-[90] overflow-hidden rounded-[32px] border border-white/10"
              style={{  }}
            >
              {/* Modal glow */}
              <View
                className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full"
                style={{  }}
              />

              <View className="relative p-6 text-center">
                <Pressable
                 
                  onPress={() => setShowModal(false)}
                  accessibilityLabel="Fermer la célébration"
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
                >
                  <X size={16} className="text-white/45" />
                </Pressable>

                {/* Celebration icon */}
                <View
                  className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-[30px]"
                  style={{ borderWidth: 1, borderColor: "rgba(251,146,60,0.24)", borderStyle: "solid" }}
                >
                  <Text className="text-5xl">
                    {getMilestoneEmoji(claimResult.newStreak)}
                  </Text>
                </View>

                <View
                >
                  <Text className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/70">
                    Série quotidienne
                  </Text>

                  <Text
                    id="streak-success-title"
                    className="text-2xl font-black tracking-tight text-white"
                  >
                    {claimResult.isNewRecord
                      ? "Nouveau record ! 🎉"
                      : `Jour ${claimResult.newStreak} ! 🔥`}
                  </Text>

                  <Text className="mt-2 text-sm leading-relaxed text-white/45">
                    {claimResult.isNewRecord
                      ? `Tu bats ton record avec ${claimResult.newStreak} jours consécutifs.`
                      : MILESTONES.includes(
                            claimResult.newStreak as (typeof MILESTONES)[number],
                          )
                        ? `Tu viens d'atteindre le palier des ${claimResult.newStreak} jours.`
                        : "Ta série continue. Garde le rythme !"}
                  </Text>
                </View>

                {/* XP */}
                <View
                  className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-3"
                >
                  <Zap
                    size={18}
                    className="text-amber-300"
                    fill="currentColor"
                  />

                  <Text className="text-xl font-black text-amber-300">
                    +{claimResult.xpEarned} XP
                  </Text>
                </View>

                {/* Week */}
                <View className="mt-5 flex justify-center gap-1.5">
                  {Array.from({ length: 7 }, (_, index) => {
                    const completed =
                      index < getWeekProgress(claimResult.newStreak);

                    return (
                      <View
                        key={index}
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ borderColor: "rgba(251,191,36,0.24)", borderStyle: "solid" }}
                      >
                        {completed && (
                          <Star
                            size={11}
                            className="text-white"
                            fill="currentColor"
                          />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Continue */}
                <Pressable
                  onPress={() => setShowModal(false)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-black text-white"
                  style={{  }}
                >
                  <Text>Continuer</Text><ChevronRight size={16} />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </>
    </>
  );
}

/*
 * ============================================================
 * LOADING STATE
 * ============================================================
 *
 * Aucun chiffre inventé.
 * On affiche uniquement la structure visuelle pendant
 * que Convex récupère les données.
 * ============================================================
 */

function StreakSkeleton() {
  return (
    <View className="mx-4 mb-4">
      <View className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.025] p-4">
        <View className="flex items-center gap-3">
          <View className="h-14 w-14 shrink-0 animate-pulse rounded-[20px] bg-white/[0.06]" />

          <View className="flex-1 space-y-2">
            <View className="h-5 w-32 animate-pulse rounded-lg bg-white/[0.06]" />
            <View className="h-3 w-24 animate-pulse rounded-lg bg-white/[0.05]" />
          </View>

          <View className="h-10 w-16 animate-pulse rounded-2xl bg-white/[0.05]" />
        </View>

        <View className="mt-4 h-2 animate-pulse rounded-full bg-white/[0.06]" />

        <View className="mt-4 flex gap-1.5">
          {Array.from({ length: 7 }, (_, index) => (
            <View
              key={index}
              className="h-7 flex-1 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </View>
      </View>
    </View>
  );
}
