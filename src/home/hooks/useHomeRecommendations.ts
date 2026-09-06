import { useCallback, useMemo, useState } from "react";

import type { RecommendationItem } from "../types/home-recommendation.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHomeRecommendations
 * ============================================================
 *
 * Le ranking lourd reste côté backend / engine.
 * Ce hook gère la consommation et l'état UI.
 * ============================================================
 */

export interface UseHomeRecommendationsOptions {
  initialItems?: RecommendationItem[];

  limit?: number;
}

export function useHomeRecommendations(
  options: UseHomeRecommendationsOptions = {},
) {
  const { initialItems = [], limit = 20 } = options;

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const recommendations = useMemo(
    () =>
      initialItems
        .filter((item) => !dismissedIds.has(String(item.id)))
        .slice(0, limit),
    [initialItems, dismissedIds, limit],
  );

  const dismiss = useCallback((id: string) => {
    setDismissedIds((current) => {
      const next = new Set(current);

      next.add(id);

      return next;
    });
  }, []);

  const restore = useCallback((id: string) => {
    setDismissedIds((current) => {
      const next = new Set(current);

      next.delete(id);

      return next;
    });
  }, []);

  const clearDismissed = useCallback(() => {
    setDismissedIds(new Set());
  }, []);

  return {
    recommendations,

    items: recommendations,

    dismiss,

    restore,

    clearDismissed,

    count: recommendations.length,

    hasRecommendations: recommendations.length > 0,
  };
}

export default useHomeRecommendations;
