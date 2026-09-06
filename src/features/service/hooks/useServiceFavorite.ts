import { UIService } from "@/core/sdk/ui/UIService";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceFavorite(
  providerId: Id<"serviceProviders">,
  initial = false,
) {
  const [isFavorited, setIsFavorited] = useState(initial);
  const toggle = useMutation(api.serviceProviders.toggleFavorite);
  const handleToggle = async () => {
    try {
      const { favorited } = await toggle({ providerId });
      setIsFavorited(favorited);
      UIService.openToast(favorited ? "Ajouté aux favoris ❤️" : "Retiré des favoris", "success");
    } catch {
      UIService.openToast("Erreur lors de l'opération", "error");
    }
  };
  return { isFavorited, toggle: handleToggle };
}
