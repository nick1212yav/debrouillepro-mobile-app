// src/hooks/use-badges.ts
import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { showToast } from "@/lib/toast";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/**
 * Hook that exposes `awardXp` and `checkBadges` helpers.
 * Shows a toast when new badges are unlocked.
 */
export function useBadges() {
  const { user } = useFirebaseAuth();
  const email = user?.email;

  const checkAndAward = useMutation(api.badges.checkAndAwardBadges);
  const addXp = useMutation(api.badges.addXp);

  const awardXp = useCallback(
    async (
      amount: number,
      reason: string,
      sourceType: Parameters<typeof addXp>[0]["sourceType"],
    ) => {
      if (!email) {
        // Silently fail if not authenticated
        return;
      }
      try {
        await addXp({ email, amount, reason, sourceType });
      } catch {
        // silently fail when unauthenticated
      }
    },
    [addXp, email],
  );

  const checkBadges = useCallback(
    async (action: Parameters<typeof checkAndAward>[0]["action"]) => {
      if (!email) {
        // Silently fail if not authenticated
        return;
      }
      try {
        const result = await checkAndAward({ email, action });
        for (const badgeId of result.newlyUnlocked) {
          const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
          if (!def) continue;
          showToast.success(`Badge débloqué : ${def.label} ${def.emoji}`, {
            description: `${def.description}${
              def.xpReward > 0 ? ` · +${def.xpReward} XP` : ""
            }`,
            duration: 4000,
          });
        }
      } catch {
        // silently fail when unauthenticated
      }
    },
    [checkAndAward, email],
  );

  return { awardXp, checkBadges };
}
