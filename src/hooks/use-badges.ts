import { UIService } from "@/core/sdk/ui/UIService";
import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { BADGE_DEFINITIONS, LEVELS } from "@/constants/badges";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"; // ✅ AJOUT

/**
 * Hook that exposes `awardXp` and `checkBadges` helpers.
 * Shows a toast when new badges are unlocked.
 */
export function useBadges() {
  const { user } = useFirebaseAuth(); // ✅ Récupérer l'utilisateur Firebase
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
          UIService.openToast(`Badge débloqué : ${def.label} ${def.emoji}`, "success");
        }
      } catch {
        // silently fail when unauthenticated
      }
    },
    [checkAndAward, email],
  );

  return { awardXp, checkBadges };
}
