import { useMemo } from "react";

import { useAction } from "convex/react";

import { api } from "../../../convex/_generated/api";

import type { HomeContext } from "../types/home-context.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHomeContext
 * ============================================================
 *
 * Construit / récupère le contexte intelligent de la Home.
 *
 * Le contexte détaillé est produit côté Convex.
 * Le hook ne duplique pas les règles métier.
 * ============================================================
 */

export function useHomeContext() {
  const getHomeDataWithContext = useAction(api.home.getHomeDataWithContext);

  const loadContext = async () => {
    return getHomeDataWithContext({});
  };

  /**
   * État neutre exposé immédiatement à l'UI.
   */
  const emptyContext = useMemo<HomeContext>(
    () => ({
      modules: [],
      interests: [],
      categories: [],
      location: undefined,
      timeOfDay: undefined,
      sessionId: undefined,
    }),
    [],
  );

  return {
    context: emptyContext,

    loading: false,

    error: null,

    loadContext,
  };
}

export default useHomeContext;
