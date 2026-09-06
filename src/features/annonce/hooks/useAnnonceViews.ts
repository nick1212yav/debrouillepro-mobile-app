import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useAnnonceViews(annonceId: string | undefined) {
  const trackView = useMutation(api.publications.trackView);

  useEffect(() => {
    if (annonceId) {
      // ✅ Corrigé : publicationId au lieu de propertyId
      trackView({ publicationId: annonceId as Id<"publications"> }).catch(
        () => {},
      );
    }
  }, [annonceId, trackView]);
}
