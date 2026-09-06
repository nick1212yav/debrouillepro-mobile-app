import type { ActionConfig } from "@/core/sdk/types";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";

// ─── Actions SDK (pour le registre) ───────────────────────────────────────────
export const annonceActions: ActionConfig[] = [
  {
    id: "view",
    label: "Voir l'annonce",
    icon: "Eye",
    execute: async (context) => {
      // ✅ Utilisation de `as any` pour contourner le typage du SDK
      const ctx = context as any;
      const entity = ctx.data || ctx.publication || ctx.entity || ctx.item;
      const navigate = ctx.navigate;

      if (navigate && entity?._id) {
        router.push(`/annonce/${entity._id}`);
      } else {
        console.warn(
          "Impossible de naviguer vers l'annonce : navigate ou entité manquant",
        );
      }
    },
  },
  // Tu peux ajouter d'autres actions ici (like, share, etc.)
];

// ─── Hook React pour les mutations ────────────────────────────────────────────
export function useAnnonceActions() {
  const create = useMutation(api.publications.createPublication);
  const update = useMutation(api.publications.updatePublication);
  const remove = useMutation(api.publications.deletePublication);
  const toggleFavorite = useMutation(api.publications.toggleFavorite);
  const trackView = useMutation(api.publications.trackView);
  const share = useMutation(api.publications.incrementShare);
  const makeOffer = useMutation(api.publications.createOffer);
  const reserve = useMutation(api.publications.reserve);
  const markSold = useMutation(api.publications.markSold);
  const promote = useMutation(api.publications.promote);
  const boost = useMutation(api.publications.boost);

  return {
    create,
    update,
    remove,
    toggleFavorite,
    trackView,
    share,
    makeOffer,
    reserve,
    markSold,
    promote,
    boost,
  };
}
