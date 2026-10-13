import { useState } from "react";
import { Alert } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceFavorite(
  providerId: Id<"serviceProviders">,
  initial = false,
) {
  const [isFavorited, setIsFavorited] = useState(initial);
  const [loading, setLoading] = useState(false);

  const toggleMutation = useMutation(api.services.favorites.toggleFavorite);

  const toggle = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const result = await toggleMutation({ providerId });
      setIsFavorited(result.favorited);
    } catch {
      Alert.alert(
        "Favoris",
        "Impossible de mettre à jour ce favori. Réessaie.",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    isFavorited,
    loading,
    toggle,
  };
}
